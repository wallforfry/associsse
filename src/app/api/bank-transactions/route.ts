import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession } from '@/lib/auth-utils'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
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

    const transactions = await db.bankTransaction.findMany({
      where: {
        organizationId: membership.organization.id
      },
      include: {
        expenseAssociations: {
          include: {
            expense: {
              select: {
                id: true,
                description: true,
                amountTTC: true,
                status: true,
                date: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Failed to fetch bank transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bank transactions' },
      { status: 500 }
    )
  }
}
