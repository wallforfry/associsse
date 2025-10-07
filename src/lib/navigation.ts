import {
  Home,
  Users,
  BarChart3,
  Settings,
  Receipt,
  PiggyBank,
  Building2,
  Tag,
  Calculator,
} from 'lucide-react'

export interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
  badge?: string
  disabled?: boolean
  children?: NavigationItem[]
}

export const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    description: 'Overview and key metrics',
  },
  {
    name: 'Accounting',
    href: '/accounting',
    icon: Calculator,
    description: 'Financial accounting and transactions',
    children: [
      {
        name: 'Expenses',
        href: '/accounting/expenses',
        icon: Receipt,
        description: 'Track organization expenses',
      },
      {
        name: 'Banks',
        href: '/accounting/banks',
        icon: PiggyBank,
        description: 'Track organization banks',
      },
      {
        name: 'Categories',
        href: '/accounting/categories',
        icon: Tag,
        description: 'Manage expense categories',
      },
    ],
  },
  {
    name: 'Members',
    href: '/members',
    icon: Users,
    description: 'Manage team members',
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: BarChart3,
    description: 'Generate financial reports',
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Organization and account settings',
    children: [
      {
        name: 'Organization',
        href: '/settings/organization',
        icon: Building2,
        description: 'Organization details and branding',
      },
      {
        name: 'Account',
        href: '/settings/account',
        icon: Settings,
        description: 'Personal account settings',
      },
    ],
  },
]

/**
 * Get navigation items with organization context
 */
export function getNavigationItems(organizationSlug?: string): NavigationItem[] {
  return navigationItems.map(item => ({
    ...item,
    href: organizationSlug ? `/${organizationSlug}${item.href}` : item.href,
    children: item.children?.map(child => ({
      ...child,
      href: organizationSlug ? `/${organizationSlug}${child.href}` : child.href,
    }))
  }))
}

/**
 * Find navigation item by href
 */
export function findNavigationItem(href: string): NavigationItem | undefined {
  return navigationItems.find(item => item.href === href)
}

/**
 * Check if a path matches a navigation item
 */
export function isActiveNavigationItem(pathname: string, item: NavigationItem): boolean {
  // Exact match
  if (pathname === item.href) {
    return true
  }
  
  // For dashboard root, only match exact path
  if (item.href === '/dashboard') {
    return pathname === '/dashboard'
  }
  
  // For other items, check if pathname starts with the item href
  return pathname.startsWith(item.href)
}

/**
 * Get navigation items grouped by category
 */
export function getGroupedNavigationItems(organizationSlug?: string) {
  const items = getNavigationItems(organizationSlug)
  
  return {
    main: items.filter(item => 
      ['Dashboard', 'Projects', 'Donations', 'Expenses'].includes(item.name)
    ),
    financial: items.filter(item => 
      ['Accounting', 'Reports'].includes(item.name)
    ),
    management: items.filter(item => 
      ['Members', 'Settings'].includes(item.name)
    ),
  }
}

/**
 * Get breadcrumb items for a given pathname
 */
export function getBreadcrumbItems(pathname: string, organizationSlug?: string) {
  const items = getNavigationItems(organizationSlug)
  // const pathSegments = pathname.split('/').filter(Boolean)
  const breadcrumbs = []
  
  // Remove organization slug from pathname for matching
  const cleanPathname = organizationSlug 
    ? pathname.replace(`/${organizationSlug}`, '') 
    : pathname
  
  // Always start with Dashboard
  const dashboardItem = items.find(item => item.name === 'Dashboard')
  if (dashboardItem) {
    breadcrumbs.push(dashboardItem)
  }
  
  // Find the current page
  const currentItem = items.find(item => isActiveNavigationItem(cleanPathname, item))
  if (currentItem && currentItem.name !== 'Dashboard') {
    breadcrumbs.push(currentItem)
  }
  
  return breadcrumbs
}
