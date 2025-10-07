'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Heart, DollarSign, Users, BarChart3, Shield } from 'lucide-react'

export function HomeWrapper() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">
                Associsse
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Manage Your Charity
            <span className="text-blue-600"> Organization</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Comprehensive accounting and management software designed specifically 
            for charities. Track donations, manage projects, handle expenses, and 
            generate reports all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-8 py-3">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <DollarSign className="h-10 w-10 text-blue-600 mb-4" />
              <CardTitle>Donation Management</CardTitle>
              <CardDescription>
                Track and manage donations with detailed donor information, 
                payment methods, and automated receipts.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Heart className="h-10 w-10 text-red-600 mb-4" />
              <CardTitle>Project Tracking</CardTitle>
              <CardDescription>
                Create and manage fundraising projects with goal tracking, 
                progress monitoring, and impact reporting.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-green-600 mb-4" />
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>
                Generate comprehensive financial reports for transparency 
                and compliance with regulatory requirements.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-purple-600 mb-4" />
              <CardTitle>Team Management</CardTitle>
              <CardDescription>
                Manage team members with role-based access control and 
                collaborative features for efficient operations.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Building2 className="h-10 w-10 text-orange-600 mb-4" />
              <CardTitle>Multi-Tenant</CardTitle>
              <CardDescription>
                Support for multiple organizations with complete data 
                isolation and customizable branding.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-gray-600 mb-4" />
              <CardTitle>Secure & Compliant</CardTitle>
              <CardDescription>
                Enterprise-grade security with compliance features for 
                financial regulations and data protection.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Associsse. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
