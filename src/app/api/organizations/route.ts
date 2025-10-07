import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getProxyUrl } from "@/lib/file-utils"
import { z } from "zod"
import { Organization, OrganizationMembership } from "@/lib/prisma"

const createOrganizationSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    ),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
})

// GET /api/organizations - List all organizations user is a member of
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get all organizations the user is a member of
    const memberships = await db.organizationMembership.findMany({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
      },
      include: {
        organization: {
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
          },
        },
      },
      orderBy: {
        joinedAt: "desc",
      },
    })

    const organizations = memberships.map(
      (
        membership: OrganizationMembership & {
          organization: Pick<
            Organization,
            | "id"
            | "name"
            | "slug"
            | "logo"
            | "description"
            | "website"
            | "email"
            | "phone"
            | "address"
            | "city"
            | "state"
            | "zipCode"
            | "country"
            | "status"
            | "createdAt"
            | "updatedAt"
          >
        }
      ) => ({
        id: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug,
        logo: getProxyUrl(membership.organization.logo),
        description: membership.organization.description,
        website: membership.organization.website,
        email: membership.organization.email,
        phone: membership.organization.phone,
        address: membership.organization.address,
        city: membership.organization.city,
        state: membership.organization.state,
        zipCode: membership.organization.zipCode,
        country: membership.organization.country,
        status: membership.organization.status,
        role: membership.role,
        joinedAt: membership.joinedAt.toISOString(),
        createdAt: membership.organization.createdAt.toISOString(),
        updatedAt: membership.organization.updatedAt.toISOString(),
      })
    )

    return NextResponse.json({ organizations })
  } catch (error) {
    console.error("Error fetching organizations:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/organizations - Create a new organization
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createOrganizationSchema.parse(body)

    // Check if slug is already taken
    const existingOrg = await db.organization.findUnique({
      where: { slug: validatedData.slug },
    })

    if (existingOrg) {
      return NextResponse.json(
        { message: "Organization slug is already taken" },
        { status: 400 }
      )
    }

    // Create the organization
    const organization = await db.organization.create({
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
        status: "ACTIVE",
      },
    })

    // Create membership for the creator as OWNER
    await db.organizationMembership.create({
      data: {
        userId: session.user.id,
        organizationId: organization.id,
        role: "OWNER",
        status: "ACTIVE",
      },
    })

    // Return the organization with proxy URL
    const organizationWithProxyUrl = {
      ...organization,
      logo: getProxyUrl(organization.logo),
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString(),
    }

    return NextResponse.json(
      {
        message: "Organization created successfully",
        organization: organizationWithProxyUrl,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating organization:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation error", errors: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
