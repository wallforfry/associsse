import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PiggyBank, Plus, Receipt } from "lucide-react"
import Link from "next/link"

export default function AccountingPage({
  params,
}: {
  params: { orgSlug: string }
}) {
  const { orgSlug } = params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Accounting</h1>
        <p className="text-gray-600">Manage your financial accounting</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="justify-between">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Expenses
            </CardTitle>
            <CardDescription>Set up and manage your expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/${orgSlug}/accounting/expenses`}>
              <Button variant="outline" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Set Up Expenses
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="justify-between">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5" />
              Banks
            </CardTitle>
            <CardDescription>
              Record and manage your banks transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/${orgSlug}/accounting/banks`}>
              <Button variant="outline" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                New Transaction
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
