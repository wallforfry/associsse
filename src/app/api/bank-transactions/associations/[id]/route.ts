import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const associationId = params.id

    // Find the association and verify user has access
    const association = await db.bankTransactionExpense.findUnique({
      where: { id: associationId },
      include: {
        bankTransaction: {
          include: {
            organization: {
              include: {
                memberships: {
                  where: { userId: session.user.id }
                }
              }
            }
          }
        }
      }
    })

    if (!association) {
      return NextResponse.json({ error: 'Association not found' }, { status: 404 })
    }

    // Check if user has access to the organization
    if (association.bankTransaction.organization.memberships.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete the association
    await db.bankTransactionExpense.delete({
      where: { id: associationId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing association:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
