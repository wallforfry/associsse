import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateMembership } from '@/lib/auth-utils'
import { createExpenseSchema } from '@/lib/validations'
import { activityHelpers } from '@/lib/activity-utils'
import { z } from 'zod'
import { Expense } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const authResult = await validateMembership(organizationId)
    if (!authResult.success) {
      return authResult.response
    }

    const expenses = await db.expense.findMany({
      where: {
        organizationId,
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Convert Decimal fields to numbers for proper JSON serialization
    const serializedExpenses = expenses.map((expense: Expense) => ({
      ...expense,
      amountTTC: Number(expense.amountTTC),
      taxesAmount: Number(expense.taxesAmount),
    }))
    
    return NextResponse.json(serializedExpenses)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, ...expenseData } = body

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const authResult = await validateMembership(organizationId)
    if (!authResult.success) {
      return authResult.response
    }

    // Validate expense data
    const validatedData = createExpenseSchema.parse(expenseData)

    const expense = await db.expense.create({
      data: {
        ...validatedData,
        organizationId,
        createdById: authResult.userId,
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

    // Log activity
    try {
      await activityHelpers.logExpenseCreated(
        organizationId,
        authResult.userId,
        expense.id,
        Number(expense.amountTTC),
        expense.description
      )
    } catch (activityError) {
      console.error('Failed to log expense creation activity:', activityError)
      // Don't fail the request if activity logging fails
    }

    // Convert Decimal fields to numbers for proper JSON serialization
    const serializedExpense = {
      ...expense,
      amountTTC: Number(expense.amountTTC),
      taxesAmount: Number(expense.taxesAmount),
    }
    
    return NextResponse.json(serializedExpense, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating expense:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
