import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export default async function DashboardRedirect() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // Get user's organization
  const membership = await db.organizationMembership.findFirst({
    where: {
      userId: session.user.id,
      status: 'ACTIVE'
    },
    include: {
      organization: {
        select: {
          slug: true
        }
      }
    }
  })

  if (!membership) {
    // User has no organization, redirect to signup or create organization
    redirect('/auth/signup')
  }

  // Redirect to organization-specific dashboard
  redirect(`/${membership.organization.slug}/dashboard`)
}
