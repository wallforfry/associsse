import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProxyUrl } from '@/lib/file-utils'
import { validateMembershipBySlug, validateRoleBySlug } from '@/lib/auth-utils'
import { z } from 'zod'

const updateOrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').optional(),
  slug: z.string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional(),
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

// GET /api/organizations/[orgSlug] - Get specific organization
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
  ) {
    try {
    const authResult = await validateMembershipBySlug((await params).orgSlug)
    if (!authResult.success) {
      return authResult.response
    }

    // Get organization by slug
    const organization = await db.organization.findUnique({
      where: { slug: (await params).orgSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        description: true,
        website: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!organization) {
      return NextResponse.json(
        { message: 'Organization not found' },
        { status: 404 }
      )
    }

    // Return organization with proxy URL and user's role
    const organizationWithProxyUrl = {
      ...organization,
      logo: getProxyUrl(organization.logo),
      role: authResult.membership!.role,
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString(),
    }

    return NextResponse.json({ organization: organizationWithProxyUrl })

  } catch (error) {
    console.error('Error fetching organization:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/organizations/[orgSlug] - Update specific organization
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const body = await request.json()
    const validatedData = updateOrganizationSchema.parse(body)

    const authResult = await validateRoleBySlug((await params).orgSlug, ['ADMIN', 'OWNER'])
    if (!authResult.success) {
      return authResult.response
    }

    // Get organization by slug
    const organization = await db.organization.findUnique({
      where: { slug: (await params).orgSlug }
    })

    if (!organization) {
      return NextResponse.json(
        { message: 'Organization not found' },
        { status: 404 }
      )
    }

    // Check if slug is already taken by another organization (only if slug is being updated)
    if (validatedData.slug && validatedData.slug !== organization.slug) {
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
    const updateData: Record<string, unknown> = {
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
    if (validatedData.logo !== undefined) updateData.logo = validatedData.logo || null

    // Update the organization
    const updatedOrganization = await db.organization.update({
      where: { id: organization.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        description: true,
        website: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    // Return organization with proxy URL
    const organizationWithProxyUrl = {
      ...updatedOrganization,
      logo: getProxyUrl(updatedOrganization.logo),
      role: authResult.membership!.role,
      createdAt: updatedOrganization.createdAt.toISOString(),
      updatedAt: updatedOrganization.updatedAt.toISOString(),
    }

    return NextResponse.json({
      message: 'Organization updated successfully',
      organization: organizationWithProxyUrl
    })

  } catch (error) {
    console.error('Error updating organization:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/organizations/[orgSlug] - Delete specific organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const authResult = await validateRoleBySlug((await params).orgSlug, ['OWNER'])
    if (!authResult.success) {
      return authResult.response
    }

    // Get organization by slug
    const organization = await db.organization.findUnique({
      where: { slug: (await params).orgSlug }
    })

    if (!organization) {
      return NextResponse.json(
        { message: 'Organization not found' },
        { status: 404 }
      )
    }

    // Check if there are other active members
    const otherMembers = await db.organizationMembership.count({
      where: {
        organizationId: organization.id,
        userId: { not: authResult.userId },
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
      where: { id: organization.id }
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