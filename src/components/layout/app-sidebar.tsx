'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Building2 } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import { getNavigationItems, isActiveNavigationItem } from '@/lib/navigation'

interface AppSidebarProps {
  organizationName?: string
  organizationSlug?: string
}

export function AppSidebar({ organizationName, organizationSlug }: AppSidebarProps) {
  const pathname = usePathname()
  const navigation = getNavigationItems(organizationSlug)
  
  // Helper function to check if a navigation item is active
  const isItemActive = (item: any) => {
    if (organizationSlug) {
      // Remove organization slug from pathname for comparison
      const cleanPathname = pathname.replace(`/${organizationSlug}`, '')
      return isActiveNavigationItem(cleanPathname, item)
    }
    return isActiveNavigationItem(pathname, item)
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <Building2 className="h-6 w-6" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Associsse</span>
            {organizationName && (
              <span className="text-xs text-muted-foreground">{organizationName}</span>
            )}
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isItemActive(item)}
                    disabled={item.disabled}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                      {item.badge && (
                        <span className="ml-auto text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                  {item.children && (
                    <SidebarMenuSub>
                      {item.children.map((child) => (
                        <SidebarMenuSubItem key={child.name}>
                          <SidebarMenuSubButton 
                            asChild 
                            isActive={isItemActive(child)}
                            disabled={child.disabled}
                          >
                            <Link href={child.href}>
                              <child.icon className="h-4 w-4" />
                              <span>{child.name}</span>
                              {child.badge && (
                                <span className="ml-auto text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                                  {child.badge}
                                </span>
                              )}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="px-2 py-2 text-xs text-muted-foreground">
          {organizationSlug && (
            <div className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              <span>{organizationSlug}</span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
