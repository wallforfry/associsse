'use client'

import { useEffect, useState } from 'react'
import { Activity, User } from '@prisma/client'
import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Receipt,
  Plus,
  CheckCircle,
  XCircle,
  Users,
  Building,
  LogIn,
  LogOut,
} from 'lucide-react'

interface ActivityWithUser extends Activity {
  user: Pick<User, 'id' | 'name' | 'email' | 'image'>
}

interface ActivityListProps {
  orgSlug: string
  limit?: number
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'EXPENSE_CREATED':
      return <Receipt className="h-4 w-4 text-blue-500" />
    case 'EXPENSE_APPROVED':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'EXPENSE_REJECTED':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'CATEGORY_CREATED':
      return <Plus className="h-4 w-4 text-purple-500" />
    case 'MEMBER_JOINED':
      return <Users className="h-4 w-4 text-green-500" />
    case 'ORGANIZATION_UPDATED':
      return <Building className="h-4 w-4 text-orange-500" />
    case 'USER_LOGIN':
      return <LogIn className="h-4 w-4 text-blue-500" />
    case 'USER_LOGOUT':
      return <LogOut className="h-4 w-4 text-gray-500" />
    default:
      return <Receipt className="h-4 w-4 text-gray-500" />
  }
}

const getActivityBadgeVariant = (type: string) => {
  switch (type) {
    case 'EXPENSE_APPROVED':
    case 'MEMBER_JOINED':
      return 'default'
    case 'EXPENSE_REJECTED':
      return 'destructive'
    case 'EXPENSE_CREATED':
    case 'CATEGORY_CREATED':
      return 'secondary'
    default:
      return 'outline'
  }
}

export function ActivityList({ orgSlug, limit = 10 }: ActivityListProps) {
  const [activities, setActivities] = useState<ActivityWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/activities?orgSlug=${orgSlug}&limit=${limit}`
        )
        
        if (!response.ok) {
          throw new Error('Failed to fetch activities')
        }
        
        const data = await response.json()
        setActivities(data.activities || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [orgSlug, limit])

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start space-x-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-red-600">Error loading activities: {error}</p>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Receipt className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No recent activity
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Start by creating an expense or category.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={activity.user.image || undefined} />
            <AvatarFallback>
              {activity.user.name
                ? activity.user.name.charAt(0).toUpperCase()
                : activity.user.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              {getActivityIcon(activity.type)}
              <p className="text-sm text-gray-900 truncate">
                {activity.description}
              </p>
              <Badge
                variant={getActivityBadgeVariant(activity.type)}
                className="text-xs"
              >
                {activity.type.replace(/_/g, ' ').toLowerCase()}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatDistanceToNow(new Date(activity.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
