import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, Plus } from 'lucide-react'

export default function DonationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Donations</h1>
          <p className="text-gray-600">Track and manage donations</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Record Donation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            No Donations Yet
          </CardTitle>
          <CardDescription>
            Start recording donations to track your fundraising progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Record Donation
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
