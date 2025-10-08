import { redirect } from 'next/navigation'
import { validateRoleBySlug } from '@/lib/auth-utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HashRecomputeButton } from './hash-recompute-button'
import { 
  Database, 
  Server, 
  Download, 
  Upload
} from "lucide-react"

export default async function TechnicalSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params

  // Check if user has admin or owner role
  const authResult = await validateRoleBySlug(orgSlug, ['ADMIN', 'OWNER'])
  
  if (!authResult.success) {
    redirect(`/${orgSlug}/settings`)
  }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Technical Settings</h1>
        <p className="text-gray-600">
          Advanced technical configuration and maintenance tools
        </p>
        <Badge variant="secondary" className="mt-2">
          Admin & Owner Only
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Database Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Management
            </CardTitle>
            <CardDescription>
              Manage database operations and maintenance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <HashRecomputeButton />
            <Button variant="outline" className="w-full justify-start">
              <Download className="mr-2 h-4 w-4" />
              Export Database
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Upload className="mr-2 h-4 w-4" />
              Import Database
            </Button>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Information
            </CardTitle>
            <CardDescription>
              View system status and configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Database Status</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Connected
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Environment</span>
              <Badge variant="outline">
                {process.env.NODE_ENV || 'development'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Version</span>
              <Badge variant="outline">
                v1.0.0
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
