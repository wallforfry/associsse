import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PiggyBank, Plus } from 'lucide-react'

export default function AccountingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accounting</h1>
          <p className="text-gray-600">Manage your chart of accounts and transactions</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Transaction
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            Accounting Setup
          </CardTitle>
          <CardDescription>
            Set up your chart of accounts and start recording transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button className="w-full justify-start">
              <Plus className="mr-2 h-4 w-4" />
              Set Up Chart of Accounts
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Plus className="mr-2 h-4 w-4" />
              Record Transaction
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
