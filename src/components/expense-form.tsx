'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileUpload } from '@/components/file-upload'
import { createExpenseSchema, CreateExpenseInput } from '@/lib/validations'
import { toast } from 'sonner'
import { Calendar, DollarSign, FileText, Tag } from 'lucide-react'

interface Category {
  id: string
  name: string
  color?: string
}

interface ExpenseFormProps {
  organizationId: string
  categories: Category[]
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: Partial<CreateExpenseInput> & { id?: string; date?: string | Date }
  isEditing?: boolean
}

export function ExpenseForm({
  organizationId,
  categories,
  onSuccess,
  onCancel,
  initialData,
  isEditing = false,
}: ExpenseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: initialData ? {
      description: initialData.description || '',
      amountTTC: initialData.amountTTC || 0,
      taxesAmount: initialData.taxesAmount || 0,
      date: initialData.date 
        ? (initialData.date instanceof Date 
            ? initialData.date.toISOString().split('T')[0]
            : typeof initialData.date === 'string' && (initialData.date as string).includes('T')
              ? (initialData.date as string).split('T')[0]
              : initialData.date)
        : new Date().toISOString().split('T')[0],
      categoryId: initialData.categoryId || '',
      receipt: initialData.receipt || '',
    } : {
      description: '',
      amountTTC: 0,
      taxesAmount: 0,
      date: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
      categoryId: '',
      receipt: '',
    },
  })

  const watchedAmountTTC = watch('amountTTC')
  const watchedTaxesAmount = watch('taxesAmount')

  // Calculate net amount (TTC - taxes)
  const netAmount = watchedAmountTTC - watchedTaxesAmount

  useEffect(() => {
    if (initialData) {
      const formattedData = {
        description: initialData.description || '',
        amountTTC: initialData.amountTTC || 0,
        taxesAmount: initialData.taxesAmount || 0,
        categoryId: initialData.categoryId || '',
        receipt: initialData.receipt || '',
        date: initialData.date 
          ? (initialData.date instanceof Date 
              ? initialData.date.toISOString().split('T')[0]
              : typeof initialData.date === 'string' && (initialData.date as string).includes('T')
                ? (initialData.date as string).split('T')[0]
                : initialData.date)
          : new Date().toISOString().split('T')[0]
      }
      
      // Use setTimeout to ensure the form is ready
      setTimeout(() => {
        reset(formattedData)
        
        // Also set values individually to ensure they stick
        setValue('description', formattedData.description)
        setValue('amountTTC', formattedData.amountTTC)
        setValue('taxesAmount', formattedData.taxesAmount)
        setValue('categoryId', formattedData.categoryId)
        setValue('receipt', formattedData.receipt)
        setValue('date', formattedData.date)
      }, 0)
      
      if (initialData.receipt) {
        setReceiptUrl(initialData.receipt)
      }
    }
  }, [initialData, reset])

  // Sync receiptUrl state with form field
  useEffect(() => {
    setValue('receipt', receiptUrl || null)
  }, [receiptUrl, setValue])


  const handleFileUpload = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('organizationId', organizationId)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    const data = await response.json()
    
    setReceiptUrl(data.url)

    return data.url
  }

  const handleFileRemove = () => {
    setReceiptUrl(null)
    setValue('receipt', null)
  }

  const onSubmit = async (data: unknown) => {
    setIsSubmitting(true)

    try {
      const payload = {
        ...(data as Record<string, unknown>),
        organizationId,
      }

      const url = isEditing && initialData?.id 
        ? `/api/expenses/${initialData.id}`
        : '/api/expenses'
      
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save expense')
      }

      toast.success(
        isEditing ? 'Expense updated successfully' : 'Expense created successfully'
      )
      
      onSuccess?.()
    } catch (error) {
      console.error('Error saving expense:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to save expense'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          {isEditing ? 'Edit Expense' : 'Add New Expense'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Description *
            </Label>
            <Textarea
              id="description"
              placeholder="Enter expense description..."
              {...register('description')}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="categoryId" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Category
            </Label>
            <Select
              value={watch('categoryId')}
              onValueChange={(value) => setValue('categoryId', value)}
            >
              <SelectTrigger className={errors.categoryId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      {category.color && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-sm text-red-500">{errors.categoryId.message}</p>
            )}
          </div>

          {/* Amount TTC */}
          <div className="space-y-2">
            <Label htmlFor="amountTTC" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Amount TTC (including taxes) *
            </Label>
            <Input
              id="amountTTC"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register('amountTTC', { valueAsNumber: true })}
              className={errors.amountTTC ? 'border-red-500' : ''}
            />
            {errors.amountTTC && (
              <p className="text-sm text-red-500">{errors.amountTTC.message}</p>
            )}
          </div>

          {/* Taxes Amount */}
          <div className="space-y-2">
            <Label htmlFor="taxesAmount" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Taxes Amount *
            </Label>
            <Input
              id="taxesAmount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register('taxesAmount', { valueAsNumber: true })}
              className={errors.taxesAmount ? 'border-red-500' : ''}
            />
            {errors.taxesAmount && (
              <p className="text-sm text-red-500">{errors.taxesAmount.message}</p>
            )}
          </div>

          {/* Net Amount (calculated) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Net Amount (calculated)
            </Label>
            <Input
              value={netAmount.toFixed(2)}
              readOnly
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">
              Net amount = TTC amount - taxes amount
            </p>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date *
            </Label>
            <Input
              id="date"
              type="date"
              {...register('date')}
              className={errors.date ? 'border-red-500' : ''}
            />
            {errors.date && (
              <p className="text-sm text-red-500">{errors.date.message}</p>
            )}
          </div>

          {/* Receipt Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Receipt
            </Label>
            <FileUpload
              onUpload={handleFileUpload}
              onRemove={handleFileRemove}
              currentUrl={receiptUrl}
              accept="image/*,application/pdf"
              maxSize={10}
              placeholder="Upload receipt (image or PDF)"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting
                ? isEditing
                  ? 'Updating...'
                  : 'Creating...'
                : isEditing
                ? 'Update Expense'
                : 'Create Expense'}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
