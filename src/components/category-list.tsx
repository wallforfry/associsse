'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CategoryForm } from '@/components/category-form'
import { Tag, Edit, Trash2, Plus, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  description?: string
  color?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    expenses: number
  }
}

interface CategoryListProps {
  categories: Category[]
  organizationId: string
  onRefresh: () => void
  canEdit?: boolean
}

export function CategoryList({
  categories,
  organizationId,
  onRefresh,
  canEdit = false,
}: CategoryListProps) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) {
      return
    }

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete category')
      }

      toast.success('Category deleted successfully')
      onRefresh()
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete category'
      )
    }
  }

  const handleFormSuccess = () => {
    setIsEditDialogOpen(false)
    setEditingCategory(null)
    onRefresh()
  }

  const handleToggleStatus = async (categoryId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update category status')
      }

      toast.success(`Category ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
      onRefresh()
    } catch (error) {
      console.error('Error updating category status:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to update category status'
      )
    }
  }

  if (categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            No Categories Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            No categories have been created yet. Create your first category to organize expenses.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Categories ({categories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expenses</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {category.color && (
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                        )}
                        {category.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {category.description || (
                        <span className="text-gray-400">No description</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {category.color ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm text-gray-500">
                            {category.color}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">No color</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={category.isActive ? 'default' : 'secondary'}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {category._count?.expenses || 0} expenses
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(category.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleStatus(category.id, category.isActive)}
                            title={category.isActive ? 'Deactivate category' : 'Activate category'}
                          >
                            {category.isActive ? (
                              <ToggleRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        )}
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(category.id)}
                            disabled={category._count?.expenses && category._count.expenses > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm
              organizationId={organizationId}
              initialData={editingCategory}
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
