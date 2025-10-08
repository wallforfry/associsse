import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession } from '@/lib/auth-utils'
import { bankTransactionImportSchema } from '@/lib/validations'
import { createActivity } from '@/lib/activity-utils'
import { ActivityType } from '@/lib/prisma'
import { generateTransactionHash, parseCSV, handleFileEncoding } from '@/lib/bank-utils'

export async function POST(request: NextRequest) {
  try {
    const authResult = await validateSession()
    if (!authResult.success) {
      return authResult.response
    }

    // Get user's organization
    const membership = await db.organizationMembership.findFirst({
      where: {
        userId: authResult.userId,
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
        transactionData.date.toISOString().split('T')[0],
        transactionData.amount.toString(),
        transactionData.description,
        transactionData.balance.toString(),
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
          date: transactionData.date,
          valueDate: transactionData.valueDate,
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
      userId: authResult.userId,
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
