import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { signUpSchema } from '@/lib/validations'
import { hash } from 'bcryptjs'
import { z } from 'zod'

const organizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  slug: z.string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
})

const signUpWithOrganizationSchema = signUpSchema.extend({
  organization: organizationSchema,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Check if this is a signup with organization or just user signup
    const hasOrganization = body.organization
    
    if (hasOrganization) {
      // Signup with organization creation
      const { name, email, password, organization } = signUpWithOrganizationSchema.parse(body)

      // Check if user already exists
      const existingUser = await db.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return NextResponse.json(
          { message: 'User already exists' },
          { status: 400 }
        )
      }

      // Check if organization slug is already taken
      const existingOrg = await db.organization.findUnique({
        where: { slug: organization.slug }
      })

      if (existingOrg) {
        return NextResponse.json(
          { message: 'Organization URL is already taken' },
          { status: 400 }
        )
      }

      // Hash password
      const hashedPassword = await hash(password, 12)

      // Create user, organization, and membership in a transaction
      const result = await db.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
          },
        })

        // Create organization
        const organizationRecord = await tx.organization.create({
          data: {
            name: organization.name,
            slug: organization.slug,
            status: 'ACTIVE',
          },
        })

        // Create organization membership with OWNER role
        await tx.organizationMembership.create({
          data: {
            userId: user.id,
            organizationId: organizationRecord.id,
            role: 'OWNER',
            status: 'ACTIVE',
          },
        })

        return { user, organization: organizationRecord }
      })

      return NextResponse.json(
        { 
          message: 'User and organization created successfully', 
          user: { id: result.user.id, email: result.user.email },
          organization: { id: result.organization.id, name: result.organization.name, slug: result.organization.slug }
        },
        { status: 201 }
      )
    } else {
      // Regular user signup (for existing organizations)
      const { name, email, password } = signUpSchema.parse(body)

      // Check if user already exists
      const existingUser = await db.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return NextResponse.json(
          { message: 'User already exists' },
          { status: 400 }
        )
      }

      // Hash password
      const hashedPassword = await hash(password, 12)

      // Create user
      const user = await db.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      })

      return NextResponse.json(
        { message: 'User created successfully', user: { id: user.id, email: user.email } },
        { status: 201 }
      )
    }
  } catch (error) {
    console.error('Registration error:', error)
    
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
