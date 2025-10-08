import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth-utils'
import { db } from '@/lib/db'
import { generateTransactionHash } from '@/lib/bank-utils'
import { createActivity } from '@/lib/activity-utils'
import { ActivityType } from '@/lib/prisma'

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

    // Get all bank transactions for this organization
    const transactions = await db.bankTransaction.findMany({
      where: {
        organizationId: membership.organization.id
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    if (transactions.length === 0) {
      return NextResponse.json({
        message: 'No transactions found to recompute',
        updatedCount: 0
      })
    }

    let updatedCount = 0
    let errorCount = 0

    // Recompute hashes for each transaction
    for (const transaction of transactions) {
      try {
        // Generate new hash with balance included
        const newHash = generateTransactionHash(
          transaction.date.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
          transaction.amount.toString(),
          transaction.description,
          transaction.balance.toString(),
          membership.organization.id
        )

        // Check if the new hash already exists (shouldn't happen, but safety check)
        const existingWithNewHash = await db.bankTransaction.findUnique({
          where: { hash: newHash }
        })

        if (existingWithNewHash && existingWithNewHash.id !== transaction.id) {
          console.warn(`Hash collision detected for transaction ${transaction.id}, skipping`)
          errorCount++
          continue
        }

        // Update the transaction with the new hash
        await db.bankTransaction.update({
          where: { id: transaction.id },
          data: { hash: newHash }
        })

        updatedCount++
      } catch (error) {
        console.error(`Error updating hash for transaction ${transaction.id}:`, error)
        errorCount++
      }
    }

    // Log activity
    await createActivity({
      organizationId: membership.organization.id,
      userId: authResult.userId,
      type: ActivityType.BANK_TRANSACTIONS_IMPORTED,
      entityType: 'bank_transaction',
      description: `Recomputed hashes for ${updatedCount} bank transactions`,
      metadata: {
        updatedCount,
        errorCount,
        totalTransactions: transactions.length
      }
    })

    return NextResponse.json({
      message: 'Hash recomputation completed',
      updatedCount,
      errorCount,
      totalTransactions: transactions.length
    })
  } catch (error) {
    console.error('Failed to recompute hashes:', error)
    return NextResponse.json(
      { error: 'Failed to recompute hashes' },
      { status: 500 }
    )
  }
}
