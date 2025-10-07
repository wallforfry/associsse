import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession } from '@/lib/auth-utils'
import { OrganizationMembership } from '@/lib/prisma'

export async function GET() {
  try {
    const authResult = await validateSession()
    if (!authResult.success) {
      return authResult.response
    }

    // Get user's organization membership
    const userMembership = await db.organizationMembership.findFirst({
      where: {
        userId: authResult.userId,
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

    // Get all members of the organization
    const members = await db.organizationMembership.findMany({
      where: {
        organizationId: userMembership.organizationId
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
      },
      orderBy: {
        joinedAt: 'desc'
      }
    })

    return NextResponse.json({
      members: members.map((member: OrganizationMembership & { user: { id: string; name: string | null; email: string; image: string | null } }) => ({
        id: member.id,
        user: member.user,
        role: member.role,
        status: member.status,
        joinedAt: member.joinedAt.toISOString(),
        updatedAt: member.updatedAt.toISOString()
      }))
    })

  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
