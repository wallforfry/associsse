import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { createHash } from 'crypto'

export async function GET(request: NextRequest) {
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
