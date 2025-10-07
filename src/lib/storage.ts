import { Client } from 'minio'

// Only initialize MinioClient if environment variables are available
let MinioClient: Client | null = null

function getMinioClient(): Client {
  if (!MinioClient) {
    const endPoint = process.env.MINIO_ENDPOINT
    const accessKey = process.env.MINIO_ACCESS_KEY
    const secretKey = process.env.MINIO_SECRET_KEY
    
    if (!endPoint || !accessKey || !secretKey) {
      throw new Error('Minio configuration is not available. Please check your environment variables.')
    }
    
    MinioClient = new Client({
      endPoint,
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey,
      secretKey,
    })
  }
  
  return MinioClient
}

const BUCKET_NAME = process.env.MINIO_BUCKET || 'associsse'

// Initialize bucket if it doesn't exist
export async function initializeStorage() {
  try {
    console.log('Initializing Minio storage...')
    const client = getMinioClient()
    
    // Check if bucket exists
    const exists = await client.bucketExists(BUCKET_NAME)
    
    if (!exists) {
      console.log(`Creating bucket: ${BUCKET_NAME}`)
      await client.makeBucket(BUCKET_NAME, 'us-east-1')
      console.log(`✅ Bucket ${BUCKET_NAME} created successfully`)
    } else {
      console.log(`✅ Bucket ${BUCKET_NAME} already exists`)
    }
    
    // Test connection by listing buckets
    const buckets = await client.listBuckets()
    console.log(`✅ Storage initialized successfully. Available buckets: ${buckets.length}`)
    
    return true
  } catch (error) {
    console.error('❌ Error initializing storage:', error)
    throw error
  }
}

export interface UploadOptions {
  organizationId: string
  folder?: string
  fileName: string
  contentType?: string
}

export async function uploadFile(
  file: Buffer,
  options: UploadOptions
): Promise<string> {
  const { organizationId, folder = 'uploads', fileName, contentType } = options
  const objectName = `${organizationId}/${folder}/${fileName}`
  
  try {
    const client = getMinioClient()
    await client.putObject(BUCKET_NAME, objectName, file, file.length, {
      'Content-Type': contentType || 'application/octet-stream',
    })
    
    return objectName
  } catch (error) {
    console.error('Error uploading file:', error)
    throw new Error('Failed to upload file')
  }
}

export async function getFileUrl(objectName: string): Promise<string> {
  try {
    const client = getMinioClient()
    return await client.presignedGetObject(BUCKET_NAME, objectName, 24 * 60 * 60) // 24 hours
  } catch (error) {
    console.error('Error getting file URL:', error)
    throw new Error('Failed to get file URL')
  }
}

export async function deleteFile(objectName: string): Promise<void> {
  try {
    const client = getMinioClient()
    await client.removeObject(BUCKET_NAME, objectName)
  } catch (error) {
    console.error('Error deleting file:', error)
    throw new Error('Failed to delete file')
  }
}

// Export the getter function instead of the client directly
export { getMinioClient as MinioClient }
