'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, User } from 'lucide-react'
import { signUpSchema } from '@/lib/validations'
import { toast } from 'sonner'
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


export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organization: {
      name: '',
      slug: '',
    },
  })
  const router = useRouter()

  // Auto-generate slug from organization name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleOrganizationNameChange = (name: string) => {
    setFormData({
      ...formData,
      organization: {
        name,
        slug: generateSlug(name),
      },
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const validatedData = signUpWithOrganizationSchema.parse(formData)
      
      // Create user account with organization
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      })

      if (response.ok) {
        toast.success('Account and organization created successfully')
        // Auto sign in after registration
        await signIn('credentials', {
          email: validatedData.email,
          password: validatedData.password,
          redirect: false,
        })
        // Redirect to organization-specific dashboard
        router.push(`/${validatedData.organization.slug}/dashboard`)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to create account')
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error('Please check your form data')
        console.error('Validation errors:', error)
      } else {
        toast.error('Invalid form data')
      }
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Join Associsse
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your charity management account
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              Get started with your charity organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <User className="h-4 w-4" />
                  Personal Information
                </div>
                <div className="space-y-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Create a secure password"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Organization Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Building2 className="h-4 w-4" />
                  Organization Information
                </div>
                <div className="space-y-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name *</Label>
                    <Input
                      id="orgName"
                      type="text"
                      value={formData.organization.name}
                      onChange={(e) => handleOrganizationNameChange(e.target.value)}
                      placeholder="Enter your organization name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgSlug">Organization URL *</Label>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">associsse.com/</span>
                      <Input
                        id="orgSlug"
                        type="text"
                        value={formData.organization.slug}
                        onChange={(e) => setFormData({
                          ...formData,
                          organization: { ...formData.organization, slug: e.target.value }
                        })}
                        placeholder="organization-slug"
                        className="flex-1"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      This will be your organization&apos;s unique URL identifier
                    </p>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create Account & Organization'}
              </Button>
            </form>


            <div className="text-center text-sm">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
