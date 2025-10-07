'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ExpenseForm } from '@/components/expense-form'
import { FileText, Edit, Trash2, Eye, Check, X } from 'lucide-react'
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

interface ExpenseListProps {
  expenses: Expense[]
  categories: Category[]
  organizationId: string
  onRefresh: () => void
  canEdit?: boolean
  canApprove?: boolean
}

export function ExpenseList({
  expenses,
  categories,
  organizationId,
  onRefresh,
  canEdit = false,
  canApprove = false,
}: ExpenseListProps) {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const getStatusBadge = (status: Expense['status']) => {
    const variants = {
      PENDING: 'secondary',
      APPROVED: 'default',
      REJECTED: 'destructive',
      PAID: 'default',
    } as const

    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      PAID: 'bg-blue-100 text-blue-800',
    }

    return (
      <Badge className={colors[status]} variant={variants[status]}>
        {status}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return
    }

    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete expense')
      }

      toast.success('Expense deleted successfully')
      onRefresh()
    } catch (error) {
      console.error('Error deleting expense:', error)
      toast.error('Failed to delete expense')
    }
  }

  const handleApprove = async (expenseId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error('Failed to update expense status')
      }

      toast.success(`Expense ${status.toLowerCase()} successfully`)
      onRefresh()
    } catch (error) {
      console.error('Error updating expense status:', error)
      toast.error('Failed to update expense status')
    }
  }

  const handleFormSuccess = () => {
    setIsEditDialogOpen(false)
    setEditingExpense(null)
    onRefresh()
  }

  if (expenses.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            No Expenses Found
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">
            No expenses have been created yet. Create your first expense to get started.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Expenses ({expenses.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount TTC</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => {                  
                  return (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">
                        {expense.description}
                      </TableCell>
                      <TableCell>
                        {expense.category ? (
                          <div className="flex items-center gap-2">
                            {expense.category.color && (
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: expense.category.color }}
                              />
                            )}
                            {expense.category.name}
                          </div>
                        ) : (
                          <span className="text-gray-400">No category</span>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(expense.amountTTC)}</TableCell>
                      <TableCell>{formatDate(expense.date)}</TableCell>
                      <TableCell>{getStatusBadge(expense.status)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {expense.createdBy.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {expense.createdBy.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {expense.receipt ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(expense.receipt, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        ) : (
                          <span className="text-gray-400">No receipt</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {canEdit && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(expense)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canEdit && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(expense.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          {canApprove && expense.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApprove(expense.id, 'APPROVED')}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApprove(expense.id, 'REJECTED')}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          {editingExpense && (
            <ExpenseForm
              organizationId={organizationId}
              categories={categories}
              initialData={{
                ...editingExpense,
                categoryId: editingExpense.category?.id || '',
                date: new Date(editingExpense.date),
              }}
              isEditing={true}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
