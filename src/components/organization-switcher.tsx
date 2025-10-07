'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Building2, Check, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'

interface Organization {
  id: string
  name: string
  slug: string
  logo: string | null
  description: string | null
  role: string
  joinedAt: string
}

interface OrganizationSwitcherProps {
  currentOrganizationSlug?: string
  currentOrganizationName?: string
}

export function OrganizationSwitcher({ 
  currentOrganizationSlug, 
  currentOrganizationName 
}: OrganizationSwitcherProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const response = await fetch('/api/organizations')
        if (response.ok) {
          const data = await response.json()
          setOrganizations(data.organizations)
        } else {
          toast.error('Failed to load organizations')
        }
      } catch (error) {
        console.error('Error loading organizations:', error)
        toast.error('Failed to load organizations')
      } finally {
        setIsLoading(false)
      }
    }

    loadOrganizations()
  }, [])

  const handleOrganizationChange = (organizationSlug: string) => {
    if (organizationSlug === currentOrganizationSlug) {
      return // Already on this organization
    }

    // Replace the current organization slug in the pathname
    const pathSegments = pathname.split('/')
    if (pathSegments[1] && pathSegments[1] !== organizationSlug) {
      pathSegments[1] = organizationSlug
      const newPath = pathSegments.join('/')
      router.push(newPath)
    } else {
      // If no organization in path, add it
      router.push(`/${organizationSlug}/dashboard`)
    }
  }

  const currentOrg = organizations.find(org => org.slug === currentOrganizationSlug)

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-2 py-2">
        <div className="h-6 w-6 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  if (organizations.length === 0) {
    return (
      <div className="flex items-center gap-2 px-2 py-2">
        <Building2 className="h-6 w-6 text-gray-400" />
        <span className="text-sm text-gray-500">No organizations</span>
      </div>
    )
  }

  if (organizations.length === 1) {
    const org = organizations[0]
    return (
      <div className="flex items-center gap-2 px-2 py-2">
        <Avatar className="h-6 w-6">
          <AvatarImage src={org.logo || undefined} alt={org.name} />
          <AvatarFallback>
            <Building2 className="h-3 w-3" />
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{org.name}</span>
          <span className="text-xs text-muted-foreground capitalize">
            {org.role.toLowerCase()}
          </span>
        </div>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 px-2 py-2 h-auto"
        >
          <Avatar className="h-6 w-6">
            <AvatarImage 
              src={currentOrg?.logo || undefined} 
              alt={currentOrg?.name || 'Organization'} 
            />
            <AvatarFallback>
              <Building2 className="h-3 w-3" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold">
              {currentOrg?.name || currentOrganizationName || 'Select Organization'}
            </span>
            {currentOrg && (
              <span className="text-xs text-muted-foreground capitalize">
                {currentOrg.role.toLowerCase()}
              </span>
            )}
          </div>
          <ChevronUp className="h-4 w-4 ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleOrganizationChange(org.slug)}
            className="flex items-center gap-2 p-2"
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={org.logo || undefined} alt={org.name} />
              <AvatarFallback>
                <Building2 className="h-3 w-3" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1">
              <span className="text-sm font-medium">{org.name}</span>
              <span className="text-xs text-muted-foreground capitalize">
                {org.role.toLowerCase()}
              </span>
            </div>
            {org.slug === currentOrganizationSlug && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
