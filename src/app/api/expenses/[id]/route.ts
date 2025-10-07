import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { updateExpenseSchema } from '@/lib/validations'
import { z } from 'zod'
import { activityHelpers } from "@/lib/activity-utils"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const expense = await db.expense.findUnique({
      where: {
        id: params.id,
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
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Check if user is member of the organization
    const membership = await db.organizationMembership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: expense.organizationId,
        status: 'ACTIVE',
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Convert Decimal fields to numbers for proper JSON serialization
    const serializedExpense = {
      ...expense,
      amountTTC: Number(expense.amountTTC),
      taxesAmount: Number(expense.taxesAmount),
    }
    
    return NextResponse.json(serializedExpense)
  } catch (error) {
    console.error('Error fetching expense:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateExpenseSchema.parse(body)

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

    // Only the creator or admin/owner can edit
    const canEdit = 
      existingExpense.createdById === session.user.id ||
      membership.role === 'ADMIN' ||
      membership.role === 'OWNER'

    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const expense = await db.expense.update({
      where: {
        id: params.id,
      },
      data: validatedData,
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

    // Log activity
    try {
      await activityHelpers.logExpenseUpdated(
        existingExpense.organizationId,
        session.user.id,
        expense.id,
        Number(expense.amountTTC),
        expense.description
      )
    } catch (activityError) {
      console.error('Failed to log expense update activity:', activityError)
      // Don't fail the request if activity logging fails
    }

    // Convert Decimal fields to numbers for proper JSON serialization
    const serializedExpense = {
      ...expense,
      amountTTC: Number(expense.amountTTC),
      taxesAmount: Number(expense.taxesAmount),
    }
    
    return NextResponse.json(serializedExpense)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating expense:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // Only the creator or admin/owner can delete
    const canDelete = 
      existingExpense.createdById === session.user.id ||
      membership.role === 'ADMIN' ||
      membership.role === 'OWNER'

    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.expense.delete({
      where: {
        id: params.id,
      },
    })

    // Log activity
    try {
      await activityHelpers.logExpenseDeleted(
        existingExpense.organizationId,
        session.user.id,
        expense.id
      )
    } catch (activityError) {
      console.error('Failed to log expense deletion activity:', activityError)
      // Don't fail the request if activity logging fails
    }

    return NextResponse.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
