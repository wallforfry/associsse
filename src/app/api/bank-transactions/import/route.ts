import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { bankTransactionImportSchema } from '@/lib/validations'
import { createActivity } from '@/lib/activity-utils'
import { ActivityType } from '@/lib/prisma'
import { generateTransactionHash, parseCSV, parseFrenchDate, handleFileEncoding } from '@/lib/bank-utils'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const membership = await db.organizationMembership.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE'
      },
      include: {
        organization: true
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'No active organization found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Handle different text encodings
    const csvText = await handleFileEncoding(file)
    const csvData = parseCSV(csvText)

    // Validate CSV structure
    if (csvData.length === 0) {
      return NextResponse.json({ error: 'No data found in CSV' }, { status: 400 })
    }

    const firstRow = csvData[0]
    const expectedHeaders = ['Date', 'Date de valeur', 'Montant', 'Libellé', 'Solde']
    const hasAllHeaders = expectedHeaders.every(header => firstRow.hasOwnProperty(header))

    if (!hasAllHeaders) {
      return NextResponse.json(
        { error: 'CSV must contain columns: Date, Date de valeur, Montant, Libellé, Solde' },
        { status: 400 }
      )
    }

    // Transform CSV data to match our schema
    const transformedData = csvData.map(row => ({
      date: row['Date'],
      valueDate: row['Date de valeur'],
      amount: row['Montant'],
      description: row['Libellé'],
      balance: row['Solde']
    }))

    // Validate with Zod
    const validationResult = bankTransactionImportSchema.safeParse({
      transactions: transformedData
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid CSV data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const validatedTransactions = validationResult.data.transactions
    let importedCount = 0
    let skippedCount = 0

    // Import transactions
    for (const transactionData of validatedTransactions) {
      const hash = generateTransactionHash(
        transactionData.date,
        transactionData.amount.toString(),
        transactionData.description,
        membership.organization.id
      )

      // Check if transaction already exists
      const existingTransaction = await db.bankTransaction.findUnique({
        where: { hash }
      })

      if (existingTransaction) {
        skippedCount++
        continue
      }

      // Create new transaction
      await db.bankTransaction.create({
        data: {
          organizationId: membership.organization.id,
          hash,
          date: parseFrenchDate(transactionData.date),
          valueDate: parseFrenchDate(transactionData.valueDate),
          amount: transactionData.amount,
          description: transactionData.description,
          balance: transactionData.balance
        }
      })

      importedCount++
    }

    // Log activity
    await createActivity({
      organizationId: membership.organization.id,
      userId: session.user.id,
      type: ActivityType.BANK_TRANSACTIONS_IMPORTED,
      entityType: 'bank_transaction',
      description: `Imported ${importedCount} bank transactions from CSV`,
      metadata: {
        importedCount,
        skippedCount,
        fileName: file.name
      }
    })

    return NextResponse.json({
      message: 'Import completed successfully',
      importedCount,
      skippedCount
    })
  } catch (error) {
    console.error('Failed to import bank transactions:', error)
    return NextResponse.json(
      { error: 'Failed to import bank transactions' },
      { status: 500 }
    )
  }
}
