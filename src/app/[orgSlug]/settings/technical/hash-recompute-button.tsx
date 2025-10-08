'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
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
import { RefreshCw } from "lucide-react"

export function HashRecomputeButton() {
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

  const showAlert = (title: string, description: string, onConfirm?: () => void) => {
    setAlertDialog({
      open: true,
      title,
      description,
      onConfirm,
    })
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

  return (
    <>
      <Button 
        variant="outline" 
        className="w-full justify-start"
        onClick={recomputeHashes}
        disabled={recomputingHashes}
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${recomputingHashes ? 'animate-spin' : ''}`} />
        {recomputingHashes ? 'Recomputing...' : 'Recompute Transaction Hashes'}
      </Button>

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
    </>
  )
}
