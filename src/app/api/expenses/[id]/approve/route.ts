import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { approveExpenseSchema } from '@/lib/validations'
import { z } from 'zod'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = approveExpenseSchema.parse(body)

    // Get the expense to check permissions
    const existingExpense = await db.expense.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Check if user is member of the organization
    const membership = await db.organizationMembership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: existingExpense.organizationId,
        status: 'ACTIVE',
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only admin/owner can approve/reject expenses
    const canApprove = 
      membership.role === 'ADMIN' ||
      membership.role === 'OWNER'

    if (!canApprove) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const expense = await db.expense.update({
      where: {
        id: params.id,
      },
      data: {
        status: validatedData.status,
        approvedBy: session.user.id,
        approvedAt: new Date(),
      },
      include: {
        category: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(expense)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error approving expense:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
