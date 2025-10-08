'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, PieChart as PieChartIcon, DollarSign, Loader2 } from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, Line, LineChart } from 'recharts'
import { ChartConfig } from '@/components/ui/chart'

// Types for financial data
interface FinancialData {
  monthlyData: Array<{
    month: string
    expenses: number
    income: number
  }>
  categoryData: Array<{
    category: string
    amount: number
    fill: string
  }>
  financialTrend: Array<{
    month: string
    balance: number
  }>
  summary: {
    totalIncome: number
    totalExpenses: number
    netPosition: number
  }
}

// Chart configurations
const monthlyChartConfig = {
  expenses: {
    label: 'Expenses',
    color: 'hsl(var(--chart-1))',
  },
  income: {
    label: 'Income',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig

const categoryChartConfig = {
  amount: {
    label: 'Amount',
  },
} satisfies ChartConfig

const trendChartConfig = {
  balance: {
    label: 'Balance',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig

export default function ReportsPage() {
  const params = useParams()
  const orgSlug = params.orgSlug as string
  
  const [financialData, setFinancialData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [organizationId, setOrganizationId] = useState<string>('')

  // Fetch organization ID
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const response = await fetch(`/api/organizations/${orgSlug}`)
        if (response.ok) {
          const data = await response.json()
          setOrganizationId(data.organization.id)
        }
      } catch (error) {
        console.error('Failed to fetch organization:', error)
      }
    }
    fetchOrganization()
  }, [orgSlug])

  // Fetch financial data
  useEffect(() => {
    const fetchFinancialData = async () => {
      if (!organizationId) return
      
      try {
        setLoading(true)
        const response = await fetch(`/api/reports/financial-summary?organizationId=${organizationId}&months=6`)
        if (response.ok) {
          const data = await response.json()
          setFinancialData(data)
        } else {
          console.error('Failed to fetch financial data')
        }
      } catch (error) {
        console.error('Error fetching financial data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchFinancialData()
  }, [organizationId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600">Generate financial and operational reports</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Loading financial data...</span>
        </div>
      </div>
    )
  }

  if (!financialData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600">Generate financial and operational reports</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500">No financial data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate financial and operational reports</p>
        </div>
      </div>

      {/* Monthly Income vs Expenses Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Monthly Income vs Expenses
          </CardTitle>
          <CardDescription>
            Compare monthly income and expenses for the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={monthlyChartConfig} className="h-[300px] w-full">
            <BarChart data={financialData.monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value)} 
                tick={{ fontSize: 12 }}
                width={80}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />} 
                formatter={(value, name) => [formatCurrency(Number(value)), name]}
              />
              <Bar dataKey="expenses" fill="var(--color-expenses)" />
              <Bar dataKey="income" fill="var(--color-income)" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 xl:grid-cols-2 gap-6">
        {/* Expense Categories Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Expense Categories
            </CardTitle>
            <CardDescription>
              Distribution of expenses by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={categoryChartConfig} className="h-[300px] w-full">
              <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <Pie
                  data={financialData.categoryData}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {financialData.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip 
                  content={<ChartTooltipContent />} 
                  formatter={(value) => [formatCurrency(Number(value)), 'Amount']}
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Financial Trend Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Financial Trend
            </CardTitle>
            <CardDescription>
              Monthly balance trend over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={trendChartConfig} className="h-[300px] w-full">
              <LineChart data={financialData.financialTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)} 
                  tick={{ fontSize: 12 }}
                  width={80}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />} 
                  formatter={(value) => [formatCurrency(Number(value)), 'Balance']}
                />
                <Line 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="var(--color-balance)" 
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-balance)' }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialData.summary.totalIncome)}</div>
            <p className="text-xs text-muted-foreground">
              Total donations received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialData.summary.totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              Approved expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Position</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialData.summary.netPosition)}</div>
            <p className="text-xs text-muted-foreground">
              {financialData.summary.netPosition >= 0 ? 'Positive balance' : 'Negative balance'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
