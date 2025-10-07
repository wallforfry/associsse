import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateMemberSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updateMemberSchema.parse(body)

    // Get user's organization membership
    const userMembership = await db.organizationMembership.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE'
      },
      include: {
        organization: true
      }
    })

    if (!userMembership) {
      return NextResponse.json(
        { message: 'No active organization membership found' },
        { status: 404 }
      )
    }

    // Check if user has permission to update members (ADMIN or OWNER)
    if (!['OWNER', 'ADMIN'].includes(userMembership.role)) {
      return NextResponse.json(
        { message: 'Insufficient permissions to update members' },
        { status: 403 }
      )
    }

    // Get the membership to update
    const membershipToUpdate = await db.organizationMembership.findFirst({
      where: {
        id: params.id,
        organizationId: userMembership.organizationId
      }
    })

    if (!membershipToUpdate) {
      return NextResponse.json(
        { message: 'Membership not found' },
        { status: 404 }
      )
    }

    // Prevent users from changing their own role/status
    if (membershipToUpdate.userId === session.user.id) {
      return NextResponse.json(
        { message: 'You cannot modify your own membership' },
        { status: 400 }
      )
    }

    // Prevent non-owners from changing owner roles
    if (membershipToUpdate.role === 'OWNER' && userMembership.role !== 'OWNER') {
      return NextResponse.json(
        { message: 'Only owners can modify other owners' },
        { status: 403 }
      )
    }

    // Update the membership
    const updatedMembership = await db.organizationMembership.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Membership updated successfully',
      membership: {
        id: updatedMembership.id,
        user: updatedMembership.user,
        role: updatedMembership.role,
        status: updatedMembership.status,
        joinedAt: updatedMembership.joinedAt.toISOString(),
        updatedAt: updatedMembership.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Error updating membership:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Internal server error' },
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
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's organization membership
    const userMembership = await db.organizationMembership.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE'
      },
      include: {
        organization: true
      }
    })

    if (!userMembership) {
      return NextResponse.json(
        { message: 'No active organization membership found' },
        { status: 404 }
      )
    }

    // Check if user has permission to remove members (ADMIN or OWNER)
    if (!['OWNER', 'ADMIN'].includes(userMembership.role)) {
      return NextResponse.json(
        { message: 'Insufficient permissions to remove members' },
        { status: 403 }
      )
    }

    // Get the membership to delete
    const membershipToDelete = await db.organizationMembership.findFirst({
      where: {
        id: params.id,
        organizationId: userMembership.organizationId
      }
    })

    if (!membershipToDelete) {
      return NextResponse.json(
        { message: 'Membership not found' },
        { status: 404 }
      )
    }

    // Prevent users from removing themselves
    if (membershipToDelete.userId === session.user.id) {
      return NextResponse.json(
        { message: 'You cannot remove yourself from the organization' },
        { status: 400 }
      )
    }

    // Prevent non-owners from removing owners
    if (membershipToDelete.role === 'OWNER' && userMembership.role !== 'OWNER') {
      return NextResponse.json(
        { message: 'Only owners can remove other owners' },
        { status: 403 }
      )
    }

    // Delete the membership
    await db.organizationMembership.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Member removed successfully'
    })

  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
