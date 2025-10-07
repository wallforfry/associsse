'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ExpenseForm } from '@/components/expense-form'
import { ExpenseList } from '@/components/expense-list'
import { Receipt, Plus, DollarSign, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  color?: string
}

interface Expense {
  id: string
  description: string
  amountTTC: number
  taxesAmount: number
  date: string
  receipt?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID'
  createdAt: string
  category?: Category
  createdBy: {
    id: string
    name?: string
    email: string
  }
}

export default function ExpensesPage() {
  const params = useParams()
  const orgSlug = params.orgSlug as string

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [organizationId, setOrganizationId] = useState<string>('')

  // Calculate totals
  const totalTTC = expenses.reduce((sum, expense) => sum + expense.amountTTC, 0)
  const totalTaxes = expenses.reduce((sum, expense) => sum + expense.taxesAmount, 0)
  const totalNet = totalTTC - totalTaxes
  const pendingExpenses = expenses.filter(e => e.status === 'PENDING').length

  const fetchOrganization = async () => {
    try {
      const response = await fetch(`/api/organizations/${orgSlug}`)
      if (response.ok) {
        const data = await response.json()
        setOrganizationId(data.organization.id)
      } else {
        console.error('Failed to fetch organization:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching organization:', error)
    }
  }

  const fetchExpenses = async () => {
    if (!organizationId) {
      return
    }

    try {
      const response = await fetch(`/api/expenses?organizationId=${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        setExpenses(data)
      } else {
        console.error('Failed to fetch expenses:', response.status, response.statusText)
        throw new Error('Failed to fetch expenses')
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
      toast.error('Failed to load expenses')
    }
  }

  const fetchCategories = async () => {
    if (!organizationId) {
      return
    }

    try {
      const response = await fetch(`/api/categories?organizationId=${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      } else {
        console.error('Failed to fetch categories:', response.status, response.statusText)
        throw new Error('Failed to fetch categories')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
    }
  }

  const refreshData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([fetchExpenses(), fetchCategories()])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganization()
  }, [orgSlug])

  useEffect(() => {
    if (organizationId) {
      refreshData()
    }
  }, [organizationId])

  const handleFormSuccess = () => {
    setIsAddDialogOpen(false)
    refreshData()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
            <p className="text-gray-600">Track and manage organization expenses</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
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
          <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600">Track and manage organization expenses</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
            </DialogHeader>
            <ExpenseForm
              organizationId={organizationId}
              categories={categories}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total TTC</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalTTC)}</div>
            <p className="text-xs text-muted-foreground">
              Including all taxes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Taxes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalTaxes)}</div>
            <p className="text-xs text-muted-foreground">
              Tax amount paid
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Amount</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalNet)}</div>
            <p className="text-xs text-muted-foreground">
              TTC minus taxes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingExpenses}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expenses List */}
      <ExpenseList
        expenses={expenses}
        categories={categories}
        organizationId={organizationId}
        onRefresh={refreshData}
        canEdit={true}
        canApprove={true}
      />
    </div>
  )
}
