"use client"

import { ReactNode } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, LogOut, Settings } from "lucide-react"
import Link from "next/link"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { BreadcrumbNav } from "./breadcrumb-nav"

interface DashboardLayoutProps {
  children: ReactNode
  organizationName?: string
  organizationSlug?: string
}

export function DashboardLayout({
  children,
  organizationName,
  organizationSlug,
}: DashboardLayoutProps) {
  const { data: session } = useSession()

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  return (
    <SidebarProvider>
      <AppSidebar
        organizationName={organizationName}
        organizationSlug={organizationSlug}
      />
      <SidebarInset className="flex flex-col min-w-0">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          {/* <div className="flex items-center gap-2">
            {organizationName && (
              <span className="text-lg font-semibold">{organizationName}</span>
            )}
          </div> */}
          <div className="ml-auto flex items-center gap-2">
            {session?.user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={session.user.image || ""}
                        alt={session.user.name || ""}
                      />
                      <AvatarFallback>
                        {session.user.name?.charAt(0) ||
                          session.user.email?.charAt(0) ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {session.user.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href={`/${organizationSlug}/settings/account`}>
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Account</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href={`/${organizationSlug}/settings`}>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 min-w-0">
          <BreadcrumbNav organizationSlug={organizationSlug} />
          <div className="min-w-0">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
