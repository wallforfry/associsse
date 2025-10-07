import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export type MembershipRole = "OWNER" | "ADMIN" | "MEMBER"

export interface AuthResult {
  success: true
  userId: string
  membership?: {
    id: string
    role: MembershipRole
    organizationId: string
  }
}

export interface AuthError {
  success: false
  response: NextResponse
}

export type AuthCheckResult = AuthResult | AuthError

/**
 * Validates user session and returns user ID
 */
export async function validateSession(): Promise<AuthCheckResult> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return {
      success: false,
      response: NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      ),
    }
  }

  return {
    success: true,
    userId: session.user.id,
  }
}

/**
 * Validates user session and organization membership
 */
export async function validateMembership(
  organizationId: string
): Promise<AuthCheckResult> {
  const sessionResult = await validateSession()
  
  if (!sessionResult.success) {
    return sessionResult
  }

  const membership = await db.organizationMembership.findFirst({
    where: {
      userId: sessionResult.userId,
      organizationId,
      status: "ACTIVE",
    },
  })

  if (!membership) {
    return {
      success: false,
      response: NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      ),
    }
  }

  return {
    success: true,
    userId: sessionResult.userId,
    membership: {
      id: membership.id,
      role: membership.role as MembershipRole,
      organizationId: membership.organizationId,
    },
  }
}

/**
 * Validates user session and organization membership by organization slug
 */
export async function validateMembershipBySlug(
  orgSlug: string
): Promise<AuthCheckResult> {
  const sessionResult = await validateSession()
  
  if (!sessionResult.success) {
    return sessionResult
  }

  // Get organization by slug
  const organization = await db.organization.findUnique({
    where: { slug: orgSlug },
  })

  if (!organization) {
    return {
      success: false,
      response: NextResponse.json(
        { message: "Organization not found" },
        { status: 404 }
      ),
    }
  }

  const membership = await db.organizationMembership.findFirst({
    where: {
      userId: sessionResult.userId,
      organizationId: organization.id,
      status: "ACTIVE",
    },
  })

  if (!membership) {
    return {
      success: false,
      response: NextResponse.json(
        { message: "Access denied. You are not a member of this organization." },
        { status: 403 }
      ),
    }
  }

  return {
    success: true,
    userId: sessionResult.userId,
    membership: {
      id: membership.id,
      role: membership.role as MembershipRole,
      organizationId: membership.organizationId,
    },
  }
}

/**
 * Validates user session and checks if user has required role
 */
export async function validateRole(
  organizationId: string,
  requiredRoles: MembershipRole[]
): Promise<AuthCheckResult> {
  const membershipResult = await validateMembership(organizationId)
  
  if (!membershipResult.success) {
    return membershipResult
  }

  if (!membershipResult.membership) {
    return {
      success: false,
      response: NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      ),
    }
  }

  if (!requiredRoles.includes(membershipResult.membership.role)) {
    return {
      success: false,
      response: NextResponse.json(
        { message: "Insufficient permissions" },
        { status: 403 }
      ),
    }
  }

  return membershipResult
}

/**
 * Validates user session and checks if user has required role by organization slug
 */
export async function validateRoleBySlug(
  orgSlug: string,
  requiredRoles: MembershipRole[]
): Promise<AuthCheckResult> {
  const membershipResult = await validateMembershipBySlug(orgSlug)
  
  if (!membershipResult.success) {
    return membershipResult
  }

  if (!membershipResult.membership) {
    return {
      success: false,
      response: NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      ),
    }
  }

  if (!requiredRoles.includes(membershipResult.membership.role)) {
    return {
      success: false,
      response: NextResponse.json(
        { message: "Insufficient permissions" },
        { status: 403 }
      ),
    }
  }

  return membershipResult
}

/**
 * Helper function to check if user can perform admin actions
 */
export function canAdmin(role: MembershipRole): boolean {
  return ["ADMIN", "OWNER"].includes(role)
}

/**
 * Helper function to check if user is owner
 */
export function isOwner(role: MembershipRole): boolean {
  return role === "OWNER"
}
