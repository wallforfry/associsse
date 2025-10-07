'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, Image as ImageIcon, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onUpload: (file: File) => Promise<string>
  onRemove?: () => void
  currentUrl?: string | null
  accept?: string
  maxSize?: number // in MB
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function FileUpload({
  onUpload,
  onRemove,
  currentUrl,
  accept = 'image/*',
  maxSize = 5,
  className,
  placeholder = 'Click to upload or drag and drop',
  disabled = false,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update previewUrl when currentUrl changes
  useEffect(() => {
    setPreviewUrl(currentUrl || null)
  }, [currentUrl])

  // Prevent default drag behaviors on the entire page
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
    }
    
    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
    }

    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('drop', handleDrop)

    return () => {
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('drop', handleDrop)
    }
  }, [])

  const handleFileSelect = async (file: File) => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSize}MB`)
      return
    }

    // Validate file type
    if (accept && accept !== '*') {
      const acceptedTypes = accept.split(',').map(type => type.trim())
      const isAccepted = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          const category = type.replace('/*', '')
          return file.type.startsWith(category + '/')
        }
        return file.type === type
      })
      
      if (!isAccepted) {
        toast.error(`Invalid file type. Accepted types: ${accept}`)
        return
      }
    }

    setIsUploading(true)
    
    try {
      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)

      // Upload file
      const uploadedUrl = await onUpload(file)
      
      // Update preview with actual URL
      setPreviewUrl(uploadedUrl)
      
      toast.success('File uploaded successfully')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload file')
      setPreviewUrl(currentUrl || null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Only set drag over to false if we're leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragOver(false)
    }
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    onRemove?.()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const getFileIcon = () => {
    if (previewUrl) {
      if (previewUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return <ImageIcon className="h-8 w-8 text-gray-400" />
      }
      return <FileText className="h-8 w-8 text-gray-400" />
    }
    return <Upload className="h-8 w-8 text-gray-400" />
  }

  const getFileName = (url: string) => {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      const filename = pathname.split('/').pop() || 'file'
      return filename
    } catch {
      return 'file'
    }
  }

  const isImageFile = (url: string) => {
    return url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
  }

  const isPdfFile = (url: string) => {
    return url.match(/\.pdf$/i)
  }

  return (
    <div className={cn('w-full', className)}>

          <div
            className={cn(
              'relative flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-gray-400',
              disabled && 'opacity-50 cursor-not-allowed',
              previewUrl && 'h-48'
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onClick={handleClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileInputChange}
              className="hidden"
              disabled={disabled}
            />

            {previewUrl ? (
              <div className="relative w-full h-full">
                {isImageFile(previewUrl) ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div 
                    className="w-full h-full flex flex-col items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (isPdfFile(previewUrl)) {
                        window.open(previewUrl, '_blank')
                      }
                    }}
                  >
                    <FileText className="h-12 w-12 text-gray-500 mb-2" />
                    <p className="text-sm font-medium text-gray-700 text-center px-2">
                      {getFileName(previewUrl)}
                    </p>
                    {isPdfFile(previewUrl) && (
                      <p className="text-xs text-gray-500 mt-1">PDF Document - Click to view</p>
                    )}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                  <div className="opacity-0 hover:opacity-100 transition-opacity flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleClick()
                      }}
                      disabled={disabled || isUploading}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Replace
                    </Button>
                    {onRemove && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemove()
                        }}
                        disabled={disabled || isUploading}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
                      <p className="text-sm">Uploading...</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                {isDragOver ? (
                  <div className="flex flex-col items-center">
                    <Upload className="h-8 w-8 text-primary mb-2" />
                    <p className="text-sm text-primary font-medium">
                      Drop file here
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    {getFileIcon()}
                    <p className="text-sm text-gray-500 mt-2">
                      {isUploading ? 'Uploading...' : placeholder}
                    </p>
                    {maxSize && (
                      <p className="text-xs text-gray-400 mt-1">
                        Max size: {maxSize}MB
                      </p>
                    )}
                    {isUploading && (
                      <div className="mt-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mx-auto"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
    </div>
  )
}
