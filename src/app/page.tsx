import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export default async function Home() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    // Show landing page for non-authenticated users
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Associsse</h1>
          <p className="text-xl text-gray-600 mb-8">Multi-tenant charity management system</p>
          <div className="space-x-4">
            <a 
              href="/auth/signin" 
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </a>
            <a 
              href="/auth/signup" 
              className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Sign Up
            </a>
          </div>
        </div>
      </div>
    )
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
    // User has no organization, redirect to signup
    redirect('/auth/signup')
  }

  // Redirect to organization-specific dashboard
  redirect(`/${membership.organization.slug}/dashboard`)
}
