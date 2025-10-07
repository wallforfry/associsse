'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createCategorySchema, CreateCategoryInput } from '@/lib/validations'
import { toast } from 'sonner'
import { Tag, Palette } from 'lucide-react'

interface CategoryFormProps {
  organizationId: string
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: Partial<CreateCategoryInput> & { id?: string }
  isEditing?: boolean
}

const predefinedColors = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
  '#84cc16', // lime
  '#f59e0b', // amber
  '#10b981', // emerald
]

export function CategoryForm({
  organizationId,
  onSuccess,
  onCancel,
  initialData,
  isEditing = false,
}: CategoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedColor, setSelectedColor] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema) as any,
    defaultValues: {
      name: '',
      description: '',
      color: '',
      ...initialData,
    },
  })

  const watchedColor = watch('color')

  useEffect(() => {
    if (initialData) {
      reset(initialData)
      if (initialData.color) {
        setSelectedColor(initialData.color)
      }
    }
  }, [initialData, reset])

  useEffect(() => {
    setValue('color', selectedColor)
  }, [selectedColor, setValue])

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)

    try {
      const payload = {
        ...data,
        organizationId,
      }

      const url = isEditing && initialData?.id 
        ? `/api/categories/${initialData.id}`
        : '/api/categories'
      
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
        throw new Error(error.error || 'Failed to save category')
      }

      toast.success(
        isEditing ? 'Category updated successfully' : 'Category created successfully'
      )
      
      onSuccess?.()
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to save category'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          {isEditing ? 'Edit Category' : 'Add New Category'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Category Name *
            </Label>
            <Input
              id="name"
              placeholder="Enter category name..."
              {...register('name')}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Enter category description (optional)..."
              {...register('description')}
              className={errors.description ? 'border-red-500' : ''}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Color
            </Label>
            <div className="grid grid-cols-6 gap-2">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color
                      ? 'border-gray-800 scale-110'
                      : 'border-gray-300 hover:border-gray-500'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                  title={color}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-16 h-8 p-1 border rounded"
              />
              <span className="text-sm text-gray-500">
                {selectedColor || 'No color selected'}
              </span>
            </div>
          </div>

          {/* Color Preview */}
          {selectedColor && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: selectedColor }}
                />
                <span className="font-medium">
                  {watch('name') || 'Category Name'}
                </span>
              </div>
            </div>
          )}

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
                ? 'Update Category'
                : 'Create Category'}
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
