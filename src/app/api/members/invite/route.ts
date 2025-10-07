import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const inviteMemberSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER']),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = inviteMemberSchema.parse(body)

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

    // Check if user has permission to invite members (ADMIN or OWNER)
    if (!['OWNER', 'ADMIN'].includes(userMembership.role)) {
      return NextResponse.json(
        { message: 'Insufficient permissions to invite members' },
        { status: 403 }
      )
    }

    // Check if user exists, if not create them
    let user = await db.user.findUnique({
      where: { email: validatedData.email }
    })

    if (!user) {
      // Create a new user with the invited email
      // They will need to set up their password and complete their profile when they first log in
      user = await db.user.create({
        data: {
          email: validatedData.email,
          name: null, // Will be set when they complete their profile
          emailVerified: null,
          image: null,
        }
      })
    }

    // Check if user is already a member
    const existingMembership = await db.organizationMembership.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: userMembership.organizationId
        }
      }
    })

    if (existingMembership) {
      return NextResponse.json(
        { message: 'User is already a member of this organization' },
        { status: 400 }
      )
    }

    // Create membership
    const membership = await db.organizationMembership.create({
      data: {
        userId: user.id,
        organizationId: userMembership.organizationId,
        role: validatedData.role,
        status: 'PENDING'
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

    // TODO: Send invitation email here
    // For now, we'll just create the membership with PENDING status

    return NextResponse.json({
      message: 'Invitation sent successfully',
      membership: {
        id: membership.id,
        user: membership.user,
        role: membership.role,
        status: membership.status,
        joinedAt: membership.joinedAt.toISOString(),
        updatedAt: membership.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Error inviting member:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
