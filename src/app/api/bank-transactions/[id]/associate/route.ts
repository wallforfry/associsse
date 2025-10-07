import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { associateExpenseSchema } from '@/lib/validations'
import { createActivity } from '@/lib/activity-utils'
import { ActivityType } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json()
    const validationResult = associateExpenseSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { expenseId, amount } = validationResult.data

    // Verify bank transaction exists and belongs to organization
    const bankTransaction = await db.bankTransaction.findFirst({
      where: {
        id: (await params).id,
        organizationId: membership.organization.id
      },
      include: {
        expenseAssociations: true
      }
    })

    if (!bankTransaction) {
      return NextResponse.json({ error: 'Bank transaction not found' }, { status: 404 })
    }

    // Verify expense exists and belongs to organization
    const expense = await db.expense.findFirst({
      where: {
        id: expenseId,
        organizationId: membership.organization.id
      }
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Check if expense is already associated with this transaction
    const existingAssociation = await db.bankTransactionExpense.findUnique({
      where: {
        bankTransactionId_expenseId: {
          bankTransactionId: (await params).id,
          expenseId: expenseId
        }
      }
    })

    if (existingAssociation) {
      return NextResponse.json(
        { error: 'Expense is already associated with this transaction' },
        { status: 400 }
      )
    }

    // Calculate current associated amount
    const currentAssociatedAmount = bankTransaction.expenseAssociations.reduce(
      (sum, assoc) => sum + Number(assoc.amount),
      0
    )

    // Check if the association would exceed the transaction amount
    // For negative transactions (expenses), we need to work with absolute values
    const transactionAmount = Math.abs(Number(bankTransaction.amount))
    const remainingAmount = transactionAmount - currentAssociatedAmount
    if (amount > remainingAmount) {
      return NextResponse.json(
        { error: `Amount exceeds remaining transaction amount (${remainingAmount})` },
        { status: 400 }
      )
    }

    // Check if the amount exceeds the expense amount
    if (amount > Number(expense.amountTTC)) {
      return NextResponse.json(
        { error: `Amount exceeds expense amount (${expense.amountTTC})` },
        { status: 400 }
      )
    }

    // Create the association
    await db.bankTransactionExpense.create({
      data: {
        bankTransactionId: (await params).id,
        expenseId: expenseId,
        amount: amount
      }
    })

    // Log activity
    await createActivity({
      organizationId: membership.organization.id,
      userId: session.user.id,
      type: ActivityType.BANK_TRANSACTION_EXPENSE_ASSOCIATED,
      entityType: 'bank_transaction',
      entityId: (await params).id,
      description: `Associated expense "${expense.description}" with bank transaction`,
      metadata: {
        bankTransactionId: (await params).id,
        expenseId: expenseId,
        amount: amount,
        expenseDescription: expense.description
      }
    })

    return NextResponse.json({
      message: 'Expense associated successfully'
    })
  } catch (error) {
    console.error('Failed to associate expense:', error)
    return NextResponse.json(
      { error: 'Failed to associate expense' },
      { status: 500 }
    )
  }
}
