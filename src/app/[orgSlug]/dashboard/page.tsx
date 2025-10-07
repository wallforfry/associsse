import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  DollarSign, 
  Users, 
  Activity,
  Plus,
  Heart,
  Receipt,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'
import { ActivityList } from '@/components/activity-list'

interface DashboardPageProps {
  params: {
    orgSlug: string
  }
}

export default function DashboardPage({ params }: DashboardPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your organization dashboard</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground">
              +0% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground">
              No expenses recorded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              You are the owner
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
