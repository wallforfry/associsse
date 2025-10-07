'use client'

import { useState } from 'react'
import { FileUpload } from './file-upload'
import { toast } from 'sonner'

interface ProfileImageUploadProps {
  currentImage?: string | null
  onImageChange: (imageUrl: string | null) => void
  disabled?: boolean
}

export function ProfileImageUpload({
  currentImage,
  onImageChange,
  disabled = false,
}: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = async (file: File): Promise<string> => {
    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'profile')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Upload failed')
      }

      const data = await response.json()
      onImageChange(data.url)
      return data.url
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = async () => {
    try {
      // For now, we'll just remove it from the form
      // In the future, we could delete it from storage
      onImageChange(null)
    } catch (error) {
      console.error('Remove error:', error)
      toast.error('Failed to remove profile image')
    }
  }

  return (
    <div className="space-y-4">
      <FileUpload
        onUpload={handleUpload}
        onRemove={handleRemove}
        currentUrl={currentImage}
        accept="image/*"
        maxSize={5}
        placeholder="Upload profile image"
        disabled={disabled || isUploading}
        className="w-full"
      />
      <div className="text-xs text-gray-500 text-center">
        <p>Recommended: 200x200px, PNG or JPG</p>
        <p>Maximum file size: 5MB</p>
      </div>
    </div>
  )
}
