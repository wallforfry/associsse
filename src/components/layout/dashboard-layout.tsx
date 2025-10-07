'use client'

import { ReactNode } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'

interface DashboardLayoutProps {
  children: ReactNode
  organizationName?: string
  organizationSlug?: string
}

export function DashboardLayout({ 
  children, 
  organizationName, 
  organizationSlug 
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        organizationName={organizationName}
        organizationSlug={organizationSlug}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header 
          organizationName={organizationName}
          organizationSlug={organizationSlug}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
