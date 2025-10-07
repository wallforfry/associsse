import { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface OrganizationLayoutProps {
  children: ReactNode
  params: {
    orgSlug: string
  }
}

async function getOrganization(slug: string) {
  try {
    const organization = await db.organization.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
      }
    })
    return organization
  } catch (error) {
    console.error('Error fetching organization:', error)
    return null
  }
}

async function getUserMembership(userId: string, orgSlug: string) {
  try {
    const membership = await db.organizationMembership.findFirst({
      where: {
        userId,
        organization: { slug: orgSlug },
        status: 'ACTIVE'
      },
      select: {
        role: true,
        status: true,
      }
    })
    return membership
  } catch (error) {
    console.error('Error fetching membership:', error)
    return null
  }
}

export default async function OrganizationLayout({ 
  children, 
  params 
}: OrganizationLayoutProps) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    notFound()
  }

  const organization = await getOrganization(params.orgSlug)
  
  if (!organization) {
    notFound()
  }

  if (organization.status !== 'ACTIVE') {
    notFound()
  }

  const membership = await getUserMembership(session.user.id, params.orgSlug)
  
  if (!membership) {
    notFound()
  }

  return (
    <DashboardLayout
      organizationName={organization.name}
      organizationSlug={organization.slug}
    >
      {children}
    </DashboardLayout>
  )
}

export async function generateStaticParams() {
  // This could be used for static generation if needed
  // For now, we'll use dynamic routing
  return []
}
