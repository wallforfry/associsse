import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth-utils'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await validateSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const months = parseInt(searchParams.get('months') || '6')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(endDate.getMonth() - months)

    // Get monthly expenses data
    const monthlyExpenses = await db.expense.groupBy({
      by: ['date'],
      where: {
        organizationId,
        status: 'APPROVED',
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amountTTC: true,
      },
      orderBy: {
        date: 'asc',
      },
    })

    // Get monthly donations data
    const monthlyDonations = await db.donation.groupBy({
      by: ['date'],
      where: {
        organizationId,
        status: 'COMPLETED',
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
      orderBy: {
        date: 'asc',
      },
    })

    // Get category expenses data
    const categoryExpenses = await db.expense.groupBy({
      by: ['categoryId'],
      where: {
        organizationId,
        status: 'APPROVED',
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amountTTC: true,
      },
    })

    // Get category names
    const categories = await db.category.findMany({
      where: {
        organizationId,
        id: {
          in: categoryExpenses.map(c => c.categoryId).filter(Boolean),
        },
      },
      select: {
        id: true,
        name: true,
        color: true,
      },
    })

    // Get total financial summary
    const totalExpenses = await db.expense.aggregate({
      where: {
        organizationId,
        status: 'APPROVED',
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amountTTC: true,
      },
    })

    const totalDonations = await db.donation.aggregate({
      where: {
        organizationId,
        status: 'COMPLETED',
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    })

    // Format monthly data
    const monthlyData = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      const monthKey = currentDate.toISOString().slice(0, 7) // YYYY-MM format
      const monthName = currentDate.toLocaleDateString('en-US', { month: 'short' })
      
      const monthExpenses = monthlyExpenses.find(e => 
        e.date.toISOString().slice(0, 7) === monthKey
      )
      
      const monthDonations = monthlyDonations.find(d => 
        d.date.toISOString().slice(0, 7) === monthKey
      )

      monthlyData.push({
        month: monthName,
        expenses: Number(monthExpenses?._sum.amountTTC || 0),
        income: Number(monthDonations?._sum.amount || 0),
      })

      currentDate.setMonth(currentDate.getMonth() + 1)
    }

    // Format category data
    const categoryData = categoryExpenses.map(expense => {
      const category = categories.find(c => c.id === expense.categoryId)
      return {
        category: category?.name || 'Uncategorized',
        amount: Number(expense._sum.amountTTC || 0),
        fill: category?.color || 'hsl(var(--chart-1))',
      }
    })

    // Calculate financial trend (cumulative balance)
    const financialTrend = []
    let runningBalance = 0
    
    monthlyData.forEach((month, index) => {
      runningBalance += month.income - month.expenses
      financialTrend.push({
        month: month.month,
        balance: runningBalance,
      })
    })

    return NextResponse.json({
      monthlyData,
      categoryData,
      financialTrend,
      summary: {
        totalIncome: Number(totalDonations._sum.amount || 0),
        totalExpenses: Number(totalExpenses._sum.amountTTC || 0),
        netPosition: Number(totalDonations._sum.amount || 0) - Number(totalExpenses._sum.amountTTC || 0),
      },
    })
  } catch (error) {
    console.error('Error fetching financial summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch financial summary' },
      { status: 500 }
    )
  }
}
