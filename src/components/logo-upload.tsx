'use client'

import { useState } from 'react'
import { FileUpload } from './file-upload'
import { toast } from 'sonner'

interface LogoUploadProps {
  currentLogo?: string | null
  onLogoChange: (logoUrl: string | null) => void
  organizationId?: string
  disabled?: boolean
}

export function LogoUpload({
  currentLogo,
  onLogoChange,
  organizationId,
  disabled = false,
}: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = async (file: File): Promise<string> => {
    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'logo')
      if (organizationId) {
        formData.append('organizationId', organizationId)
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Upload failed')
      }

      const data = await response.json()
      onLogoChange(data.url)
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
      // If we have a current logo, we could delete it from storage
      // For now, we'll just remove it from the form
      onLogoChange(null)
    } catch (error) {
      console.error('Remove error:', error)
      toast.error('Failed to remove logo')
    }
  }

  return (
    <div className="space-y-4">
      <FileUpload
        onUpload={handleUpload}
        onRemove={handleRemove}
        currentUrl={currentLogo}
        accept="image/*"
        maxSize={5}
        placeholder="Upload organization logo"
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
