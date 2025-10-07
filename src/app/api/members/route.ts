import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
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
      members: members.map(member => ({
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
