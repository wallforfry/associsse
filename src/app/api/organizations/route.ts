import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getProxyUrl } from '@/lib/file-utils'
import { z } from 'zod'

const organizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  slug: z.string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  logo: z.string().optional(),
})

const organizationUpdateSchema = organizationSchema.partial()

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = organizationSchema.parse(body)

    // Get user's organization membership
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
      return NextResponse.json(
        { message: 'No active organization membership found' },
        { status: 404 }
      )
    }

    // Check if user has permission to update organization (ADMIN or OWNER)
    if (!['ADMIN', 'OWNER'].includes(membership.role)) {
      return NextResponse.json(
        { message: 'Insufficient permissions to update organization' },
        { status: 403 }
      )
    }

    // Check if slug is already taken by another organization
    if (validatedData.slug !== membership.organization.slug) {
      const existingOrg = await db.organization.findUnique({
        where: { slug: validatedData.slug }
      })

      if (existingOrg) {
        return NextResponse.json(
          { message: 'Organization slug is already taken' },
          { status: 400 }
        )
      }
    }

    // Update the organization
    const updatedOrganization = await db.organization.update({
      where: { id: membership.organization.id },
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description || null,
        website: validatedData.website || null,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        city: validatedData.city || null,
        state: validatedData.state || null,
        zipCode: validatedData.zipCode || null,
        country: validatedData.country || null,
        logo: validatedData.logo || null,
        updatedAt: new Date(),
      }
    })

    // Convert logo URL to proxy URL if it exists
    const organizationWithProxyUrl = {
      ...updatedOrganization,
      logo: getProxyUrl(updatedOrganization.logo)
    }

    return NextResponse.json({
      message: 'Organization updated successfully',
      organization: organizationWithProxyUrl
    })

  } catch (error) {
    console.error('Error updating organization:', error)
    
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

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
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
      return NextResponse.json(
        { message: 'No active organization membership found' },
        { status: 404 }
      )
    }

    // Convert logo URL to proxy URL if it exists
    const organizationWithProxyUrl = {
      ...membership.organization,
      logo: getProxyUrl(membership.organization.logo)
    }

    return NextResponse.json({
      organization: organizationWithProxyUrl
    })

  } catch (error) {
    console.error('Error fetching organization:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = organizationUpdateSchema.parse(body)

    // Get user's organization membership
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
      return NextResponse.json(
        { message: 'No active organization membership found' },
        { status: 404 }
      )
    }

    // Check if user has permission to update organization (ADMIN or OWNER)
    if (!['ADMIN', 'OWNER'].includes(membership.role)) {
      return NextResponse.json(
        { message: 'Insufficient permissions to update organization' },
        { status: 403 }
      )
    }

    // Check if slug is already taken by another organization (only if slug is being updated)
    if (validatedData.slug && validatedData.slug !== membership.organization.slug) {
      const existingOrg = await db.organization.findUnique({
        where: { slug: validatedData.slug }
      })

      if (existingOrg) {
        return NextResponse.json(
          { message: 'Organization slug is already taken' },
          { status: 400 }
        )
      }
    }

    // Prepare update data (only include fields that are provided)
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.slug !== undefined) updateData.slug = validatedData.slug
    if (validatedData.description !== undefined) updateData.description = validatedData.description || null
    if (validatedData.website !== undefined) updateData.website = validatedData.website || null
    if (validatedData.email !== undefined) updateData.email = validatedData.email || null
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone || null
    if (validatedData.address !== undefined) updateData.address = validatedData.address || null
    if (validatedData.city !== undefined) updateData.city = validatedData.city || null
    if (validatedData.state !== undefined) updateData.state = validatedData.state || null
    if (validatedData.zipCode !== undefined) updateData.zipCode = validatedData.zipCode || null
    if (validatedData.country !== undefined) updateData.country = validatedData.country || null

    // Update the organization
    const updatedOrganization = await db.organization.update({
      where: { id: membership.organization.id },
      data: updateData
    })

    return NextResponse.json({
      message: 'Organization updated successfully',
      organization: updatedOrganization
    })

  } catch (error) {
    console.error('Error updating organization:', error)
    
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

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's organization membership
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
      return NextResponse.json(
        { message: 'No active organization membership found' },
        { status: 404 }
      )
    }

    // Only OWNER can delete the organization
    if (membership.role !== 'OWNER') {
      return NextResponse.json(
        { message: 'Only organization owners can delete the organization' },
        { status: 403 }
      )
    }

    // Check if there are other active members
    const otherMembers = await db.organizationMembership.count({
      where: {
        organizationId: membership.organization.id,
        userId: { not: session.user.id },
        status: 'ACTIVE'
      }
    })

    if (otherMembers > 0) {
      return NextResponse.json(
        { message: 'Cannot delete organization with active members. Please remove all members first.' },
        { status: 400 }
      )
    }

    // Delete the organization (this will cascade delete memberships due to foreign key constraints)
    await db.organization.delete({
      where: { id: membership.organization.id }
    })

    return NextResponse.json({
      message: 'Organization deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting organization:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
