import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getRecentActivities } from '@/lib/activity-utils'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const orgSlug = searchParams.get('orgSlug')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!orgSlug) {
      return NextResponse.json(
        { error: 'Organization slug is required' },
        { status: 400 }
      )
    }

    // Get organization
    const organization = await db.organization.findUnique({
      where: { slug: orgSlug },
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Check if user is a member of the organization
    const membership = await db.organizationMembership.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: organization.id,
        },
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get recent activities
    const activities = await getRecentActivities(organization.id, limit)

    return NextResponse.json({ activities })
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
