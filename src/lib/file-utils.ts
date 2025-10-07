/**
 * Convert Minio URLs to proxy URLs to avoid CORS issues
 */
export function getProxyUrl(minioUrl: string | null | undefined): string | null {
  if (!minioUrl) return null
  
  // If it's already a proxy URL, return as is
  if (minioUrl.startsWith('/api/files/')) {
    return minioUrl
  }
  
  // Extract object name from Minio URL
  // Format: http://minio:9000/bucket/objectName
  const url = new URL(minioUrl)
  const pathParts = url.pathname.split('/').filter(Boolean)
  
  if (pathParts.length < 2) {
    console.warn('Invalid Minio URL format:', minioUrl)
    return null
  }
  
  // Remove bucket name (first part) and join the rest
  const objectName = pathParts.slice(1).join('/')
  
  return `/api/files/${objectName}`
}

/**
 * Get the object name from a Minio URL
 */
export function getObjectNameFromUrl(minioUrl: string): string | null {
  try {
    const url = new URL(minioUrl)
    const pathParts = url.pathname.split('/').filter(Boolean)
    
    if (pathParts.length < 2) {
      return null
    }
    
    // Remove bucket name (first part) and join the rest
    return pathParts.slice(1).join('/')
  } catch {
    return null
  }
}

/**
 * Generate a proxy URL from object name
 */
export function getProxyUrlFromObjectName(objectName: string): string {
  return `/api/files/${objectName}`
}
