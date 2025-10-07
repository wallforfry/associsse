'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DollarSign, 
  Users, 
  Activity,
  Receipt,
  PiggyBank} from 'lucide-react'
import { ActivityList } from '@/components/activity-list'
import { formatAmount } from '@/lib/bank-utils'

interface DashboardPageProps {
  params: {
    orgSlug: string
  }
}

interface DashboardStats {
  totalExpenses: number
  monthlyExpenses: number
  bankBalance: number
  teamMembers: number
  monthlyChange: number
}

export default function DashboardPage({ params }: DashboardPageProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalExpenses: 0,
    monthlyExpenses: 0,
    bankBalance: 0,
    teamMembers: 1,
    monthlyChange: 0
  })
  const [loading, setLoading] = useState(true)

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch organization info first to get organizationId
      const orgResponse = await fetch(`/api/organizations/${params.orgSlug}`)
      const orgData = orgResponse.ok ? await orgResponse.json() : { organization: { id: null, memberships: [] } }
      
      if (!orgData.organization?.id) {
        console.error('Failed to get organization ID')
        return
      }
      
      // Fetch expenses with organizationId
      const expensesResponse = await fetch(`/api/expenses?organizationId=${orgData.organization.id}`)
      if (!expensesResponse.ok) {
        console.error('Failed to fetch expenses:', expensesResponse.status, await expensesResponse.text())
      }
      const expenses = expensesResponse.ok ? await expensesResponse.json() : []
      
      // Fetch bank transactions
      const bankResponse = await fetch('/api/bank-transactions')
      if (!bankResponse.ok) {
        console.error('Failed to fetch bank transactions:', bankResponse.status, await bankResponse.text())
      }
      const bankTransactions = bankResponse.ok ? await bankResponse.json() : []
      
      
      // Calculate stats
      const totalExpenses = expenses.reduce((sum: number, expense: { amountTTC: number }) => sum + Number(expense.amountTTC), 0)
      
      // Calculate monthly expenses (current month)
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const monthlyExpenses = expenses
        .filter((expense: { date: string }) => {
          const expenseDate = new Date(expense.date)
          return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
        })
        .reduce((sum: number, expense: { amountTTC: number }) => sum + Number(expense.amountTTC), 0)
      
      // Calculate bank balance (latest transaction balance)
      const bankBalance = bankTransactions.length > 0 
        ? Number(bankTransactions[0].balance) 
        : 0
      
      // Count team members
      const teamMembers = orgData.organization?.memberships?.length || 1
      
      // Calculate monthly change (simplified - could be enhanced with previous month data)
      const monthlyChange = monthlyExpenses > 0 ? 0 : 0 // Placeholder for now
      
      setStats({
        totalExpenses,
        monthlyExpenses,
        bankBalance,
        teamMembers,
        monthlyChange
      })
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }, [params.orgSlug])

  useEffect(() => {
    fetchDashboardStats()
  }, [fetchDashboardStats])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your organization dashboard</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : formatAmount(stats.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.monthlyChange >= 0 ? '+' : ''}{stats.monthlyChange}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : formatAmount(stats.monthlyExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.monthlyExpenses === 0 ? 'No expenses this month' : 'Current month total'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bank Balance</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : formatAmount(stats.bankBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.bankBalance === 0 ? 'No bank transactions recorded' : 'Latest balance'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.teamMembers}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.teamMembers === 1 ? 'You are the owner' : `${stats.teamMembers} members`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Projects
            </CardTitle>
            <CardDescription>
              Manage your fundraising projects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${params.orgSlug}/projects`}>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href={`/${params.orgSlug}/projects`}>
                View All Projects
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Donations
            </CardTitle>
            <CardDescription>
              Track and manage donations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${params.orgSlug}/donations`}>
                <Plus className="mr-2 h-4 w-4" />
                Record Donation
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href={`/${params.orgSlug}/donations`}>
                View All Donations
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Reports
            </CardTitle>
            <CardDescription>
              Generate financial reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/${params.orgSlug}/reports`}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Generate Report
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href={`/${params.orgSlug}/reports`}>
                View All Reports
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div> */}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Your organization&apos;s recent activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityList orgSlug={params.orgSlug} limit={10} />
        </CardContent>
      </Card>
    </div>
  )
}
