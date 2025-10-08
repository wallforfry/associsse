'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { FileUpload } from '@/components/file-upload'
import { Upload, Link as LinkIcon, X, Check, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { formatAmount } from '@/lib/bank-utils'
import { useParams } from "next/navigation"

interface BankTransaction {
  id: string
  hash: string
  date: string
  valueDate: string
  amount: number
  description: string
  balance: number
  createdAt: string
  expenseAssociations: {
    id: string
    amount: number
    expense: {
      id: string
      description: string
      amountTTC: number
      status: string
      date: string
    }
  }[]
}

interface Expense {
  id: string
  description: string
  amountTTC: number
  status: string
  date: string
}

export default function BanksPage() {
  const params = useParams()
  const orgSlug = params.orgSlug as string
  
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [associateDialogOpen, setAssociateDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<BankTransaction | null>(null)
  const [associating, setAssociating] = useState(false)
  const [organizationId, setOrganizationId] = useState<string>('')
  const [recomputingHashes, setRecomputingHashes] = useState(false)
  const [alertDialog, setAlertDialog] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm?: () => void
  }>({
    open: false,
    title: '',
    description: '',
  })

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await fetch('/api/bank-transactions')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchOrganization = useCallback(async () => {
    const response = await fetch(`/api/organizations/${orgSlug}`)
    if (response.ok) {
      const data = await response.json()
      setOrganizationId(data.organization.id)
    }
  }, [orgSlug])

  const fetchExpenses = useCallback(async () => {
    if (!organizationId) return
    try {
      const response = await fetch(`/api/expenses?organizationId=${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        setExpenses(data)
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error)
    }
  }, [organizationId])

  const refreshAllData = useCallback(async () => {
    await fetchTransactions()
    if (organizationId) {
      await fetchExpenses()
    }
  }, [fetchTransactions, fetchExpenses, organizationId])

  const refreshAllDataAndUpdateSelected = useCallback(async () => {
    await refreshAllData()
    // Update the selected transaction with fresh data if it exists
    if (selectedTransaction) {
      const response = await fetch('/api/bank-transactions')
      if (response.ok) {
        const updatedTransactions = await response.json()
        const updatedTransaction = updatedTransactions.find(
          (t: BankTransaction) => t.id === selectedTransaction.id
        )
        if (updatedTransaction) {
          setSelectedTransaction(updatedTransaction)
        }
      }
    }
  }, [refreshAllData, selectedTransaction])

  const showAlert = (title: string, description: string, onConfirm?: () => void) => {
    setAlertDialog({
      open: true,
      title,
      description,
      onConfirm,
    })
  }

  useEffect(() => {
    fetchOrganization()

    if (organizationId) {
      fetchTransactions()
      fetchExpenses()
    }
  }, [fetchTransactions, fetchExpenses, fetchOrganization, organizationId])

  const handleFileUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/bank-transactions/import', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        await refreshAllData()
        setImportDialogOpen(false)

        return file.name
      } else {
        const error = await response.json()
        console.error('Import failed:', error)
        throw new Error(error.message)
      }
    } catch (error) {
      console.error('Import failed:', error)
      throw new Error('Import failed. Please try again.')
    }
  }

  const getAssociatedAmount = (transaction: BankTransaction) => {
    return transaction.expenseAssociations.reduce((sum, assoc) => sum + Number(assoc.amount), 0)
  }

  const getRemainingAmount = (transaction: BankTransaction) => {
    // For negative transactions (expenses), we need to work with absolute values
    const transactionAmount = Math.abs(Number(transaction.amount))
    const associatedAmount = getAssociatedAmount(transaction)
    return transactionAmount - associatedAmount
  }

  const getAssociationAmount = (expense: Expense, transaction: BankTransaction) => {
    const remainingAmount = getRemainingAmount(transaction)
    return Math.min(Number(expense.amountTTC), remainingAmount)
  }

  const getExpenseRemainingAmount = (expense: Expense) => {
    // Find all associations for this expense across all transactions
    const totalAssociated = transactions.reduce((sum, transaction) => {
      const expenseAssociations = transaction.expenseAssociations.filter(
        assoc => assoc.expense.id === expense.id
      )
      return sum + expenseAssociations.reduce((assocSum, assoc) => assocSum + Number(assoc.amount), 0)
    }, 0)
    
    return Number(expense.amountTTC) - totalAssociated
  }

  const associateExpense = async (expenseId: string, amount: number) => {
    if (!selectedTransaction) return

    setAssociating(true)
    try {
      const response = await fetch(`/api/bank-transactions/${selectedTransaction.id}/associate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expenseId,
          amount,
        }),
      })

      if (response.ok) {
        await refreshAllDataAndUpdateSelected()
      } else {
        const error = await response.json()
        showAlert('Association Failed', `Failed to associate expense: ${error.message}`)
      }
    } catch (error) {
      console.error('Association failed:', error)
      showAlert('Association Failed', 'Failed to associate expense. Please try again.')
    } finally {
      setAssociating(false)
    }
  }

  const removeAssociation = async (associationId: string) => {
    try {
      const response = await fetch(`/api/bank-transactions/associations/${associationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await refreshAllDataAndUpdateSelected()
      } else {
        const error = await response.json()
        showAlert('Remove Association Failed', `Failed to remove association: ${error.message}`)
      }
    } catch (error) {
      console.error('Failed to remove association:', error)
      showAlert('Remove Association Failed', 'Failed to remove association. Please try again.')
    }
  }

  const recomputeHashes = async () => {
    showAlert(
      'Recompute Transaction Hashes',
      'This will recompute hashes for all existing bank transactions. This may take a moment. Continue?',
      async () => {
        setRecomputingHashes(true)
        try {
          const response = await fetch('/api/bank-transactions/recompute-hashes', {
            method: 'POST',
          })

          if (response.ok) {
            const result = await response.json()
            showAlert(
              'Hash Recomputation Completed',
              `Updated: ${result.updatedCount} transactions\nErrors: ${result.errorCount}\nTotal: ${result.totalTransactions}`
            )
            await refreshAllData()
          } else {
            const error = await response.json()
            showAlert('Recomputation Failed', `Failed to recompute hashes: ${error.error}`)
          }
        } catch (error) {
          console.error('Failed to recompute hashes:', error)
          showAlert('Recomputation Failed', 'Failed to recompute hashes. Please try again.')
        } finally {
          setRecomputingHashes(false)
        }
      }
    )
  }


  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: fr })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bank Transactions</h1>
          <p className="text-gray-600">Manage your bank transactions</p>
        </div>
        <div className="text-center py-8">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bank Transactions</h1>
          <p className="text-gray-600">Manage your bank transactions and associate them with expenses</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Bank Transactions</DialogTitle>
                <DialogDescription>
                  Upload a CSV file with your bank transactions. The file should have columns: Date, Date de valeur, Montant, Libellé, Solde
                </DialogDescription>
              </DialogHeader>
              <FileUpload
                onUpload={handleFileUpload}
                accept="text/csv"
                maxSize={5 * 1024 * 1024} // 5MB
              />
            </DialogContent>
          </Dialog>
          
          <Button
            variant="outline"
            onClick={recomputeHashes}
            disabled={recomputingHashes}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${recomputingHashes ? 'animate-spin' : ''}`} />
            {recomputingHashes ? 'Recomputing...' : 'Recompute Hashes'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transactions found. Import a CSV file to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Associated</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => {
                  const associatedAmount = getAssociatedAmount(transaction)
                  const remainingAmount = getRemainingAmount(transaction)
                  const isFullyAssociated = Math.abs(remainingAmount) < 0.01
                  const isPartiallyAssociated = associatedAmount > 0 && !isFullyAssociated

                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDate(transaction.date)}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {transaction.description}
                      </TableCell>
                      <TableCell className={Number(transaction.amount) >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatAmount(Number(transaction.amount))}
                      </TableCell>
                      <TableCell>{formatAmount(Number(transaction.balance))}</TableCell>
                      <TableCell>
                        {associatedAmount > 0 && (
                          <div className="text-sm">
                            <div className="text-green-600">
                              {formatAmount(associatedAmount)}
                            </div>
                            {isPartiallyAssociated && (
                              <div className="text-gray-500">
                                Available: {formatAmount(remainingAmount)}
                              </div>
                            )}
                            {transaction.expenseAssociations.length > 0 && (
                              <div className="text-xs text-gray-400 mt-1">
                                {transaction.expenseAssociations.length} expense{transaction.expenseAssociations.length > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {isFullyAssociated ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Fully Associated
                          </Badge>
                        ) : isPartiallyAssociated ? (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            Partially Associated
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            Not Associated
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTransaction(transaction)
                              setAssociateDialogOpen(true)
                            }}
                          >
                            <LinkIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Associate Expense Dialog */}
      <Dialog open={associateDialogOpen} onOpenChange={(open) => {
        setAssociateDialogOpen(open)
        if (!open) {
          setSelectedTransaction(null)
        }
      }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Associate Expenses</DialogTitle>
            <DialogDescription>
              Associate expenses with transaction: {selectedTransaction?.description}
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Transaction Details</div>
                <div className="text-lg font-semibold">
                  {formatAmount(Number(selectedTransaction.amount))}
                </div>
                <div className="text-sm text-gray-600">
                  Total: {formatAmount(Math.abs(Number(selectedTransaction.amount)))}
                </div>
                <div className="text-sm text-blue-600 font-medium">
                  Remaining to reconcile: {formatAmount(getRemainingAmount(selectedTransaction))}
                </div>
              </div>

              {/* Current Associations */}
              {selectedTransaction.expenseAssociations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Current Associations</h4>
                  <div className="space-y-2">
                    {selectedTransaction.expenseAssociations.map((association) => (
                      <div key={association.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                        <div>
                          <div className="font-medium">{association.expense.description}</div>
                          <div className="text-sm text-gray-600">
                            {formatAmount(Number(association.amount))} • {formatDate(association.expense.date)}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeAssociation(association.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Expenses */}
              <div className="space-y-2">
                <h4 className="font-medium">Available Expenses</h4>
                {Number(selectedTransaction.amount) < 0 ? (
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {expenses
                      .filter(expense => expense.status === 'APPROVED')
                      .filter(expense => getExpenseRemainingAmount(expense) > 0)
                      .map((expense) => {
                      const associationAmount = getAssociationAmount(expense, selectedTransaction)
                      const expenseRemaining = getExpenseRemainingAmount(expense)
                      const canAssociate = associationAmount > 0 && expenseRemaining > 0
                      
                      return (
                        <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{expense.description}</div>
                            <div className="text-sm text-gray-600">
                              Total: {formatAmount(expense.amountTTC)} • {formatDate(expense.date)}
                            </div>
                            <div className="text-sm text-orange-600">
                              Remaining to reconcile: {formatAmount(expenseRemaining)}
                            </div>
                            {canAssociate && (
                              <div className="text-xs text-blue-600 mt-1">
                                Will associate: {formatAmount(associationAmount)}
                              </div>
                            )}
                            {!canAssociate && expenseRemaining <= 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                Fully reconciled
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            disabled={associating || !canAssociate}
                            onClick={() => associateExpense(expense.id, associationAmount)}
                          >
                            {associating ? '...' : <Check className="h-4 w-4" />}
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    Only negative transactions (expenses) can be associated with expense records.
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Alert Dialog */}
      <AlertDialog open={alertDialog.open} onOpenChange={(open) => setAlertDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertDialog.title}</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line">
              {alertDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {alertDialog.onConfirm && (
              <AlertDialogAction onClick={alertDialog.onConfirm}>
                Continue
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
