import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession } from '@/lib/auth-utils'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await validateSession()
    if (!authResult.success) {
      return authResult.response
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
                  where: { userId: authResult.userId }
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
