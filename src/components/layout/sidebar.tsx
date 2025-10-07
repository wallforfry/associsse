'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Building2,
  Home,
  DollarSign,
  Users,
  FileText,
  BarChart3,
  Settings,
  Receipt,
  Heart,
  PiggyBank,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Projects', href: '/projects', icon: Heart },
  { name: 'Donations', href: '/donations', icon: DollarSign },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Accounting', href: '/accounting', icon: PiggyBank },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
  organizationName?: string
  organizationSlug?: string
}

export function Sidebar({ organizationName, organizationSlug }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      <div className="flex h-16 items-center px-4">
        <Building2 className="h-8 w-8 text-white" />
        <div className="ml-3">
          <h1 className="text-lg font-semibold text-white">
            Associsse
          </h1>
          {organizationName && (
            <p className="text-sm text-gray-300">{organizationName}</p>
          )}
        </div>
      </div>
      
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const href = organizationSlug 
            ? `/${organizationSlug}${item.href}` 
            : item.href
          
          return (
            <Link key={item.name} href={href}>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-white',
                  pathname === href && 'bg-gray-800 text-white'
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Button>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
