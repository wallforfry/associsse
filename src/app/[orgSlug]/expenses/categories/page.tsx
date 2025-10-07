'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CategoryForm } from '@/components/category-form'
import { Tag, Plus, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import { CategoryList } from "@/components/category-list"

interface Category {
  id: string
  name: string
  description?: string
  color?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    expenses: number
  }
}

export default function CategoriesPage() {
  const params = useParams()
  const orgSlug = params.orgSlug as string

  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [organizationId, setOrganizationId] = useState<string>('')

  // Calculate statistics
  const totalCategories = categories.length
  const activeCategories = categories.filter(c => c.isActive).length
  const totalExpenses = categories.reduce((sum, c) => sum + (c._count?.expenses || 0), 0)

  const fetchOrganization = useCallback(async () => {
    try {
      const response = await fetch(`/api/organizations/${orgSlug}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Organization data:', data)
        setOrganizationId(data.organization.id)
      } else {
        console.error('Failed to fetch organization:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching organization:', error)
    }
  }, [orgSlug])

  const fetchCategories = useCallback(async () => {
    if (!organizationId) {
      console.log('No organizationId, skipping fetchCategories')
      return
    }

    try {
      console.log('Fetching categories for organizationId:', organizationId)
      const response = await fetch(`/api/categories?organizationId=${organizationId}&includeInactive=true`)
      if (response.ok) {
        const data = await response.json()
        console.log('Categories data:', data)
        setCategories(data)
      } else {
        console.error('Failed to fetch categories:', response.status, response.statusText)
        throw new Error('Failed to fetch categories')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
    }
  }, [organizationId])

  const refreshData = useCallback(async () => {
    setIsLoading(true)
    try {
      await fetchCategories()
    } finally {
      setIsLoading(false)
    }
  }, [fetchCategories])

  useEffect(() => {
    console.log('useEffect: fetchOrganization called with orgSlug:', orgSlug)
    fetchOrganization()
  }, [fetchOrganization, orgSlug])

  useEffect(() => {
    console.log('useEffect: organizationId changed to:', organizationId)
    if (organizationId) {
      refreshData()
    }
  }, [organizationId, refreshData])

  const handleFormSuccess = () => {
    setIsAddDialogOpen(false)
    refreshData()
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-600">Manage expense categories</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">Manage expense categories</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
            </DialogHeader>
            <CategoryForm
              organizationId={organizationId}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCategories}</div>
            <p className="text-xs text-muted-foreground">
              All categories created
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Categories</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCategories}</div>
            <p className="text-xs text-muted-foreground">
              Currently in use
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExpenses}</div>
            <p className="text-xs text-muted-foreground">
              Expenses using categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Categories List */}
      <CategoryList
        categories={categories}
        organizationId={organizationId}
        onRefresh={refreshData}
        canEdit={true}
      />
    </div>
  )
}
