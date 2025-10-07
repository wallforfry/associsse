import { Client } from 'minio'

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT!,
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
})

const BUCKET_NAME = process.env.MINIO_BUCKET || 'associsse'

// Initialize bucket if it doesn't exist
export async function initializeStorage() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME)
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1')
      console.log(`Bucket ${BUCKET_NAME} created successfully`)
    }
  } catch (error) {
    console.error('Error initializing storage:', error)
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
    await minioClient.putObject(BUCKET_NAME, objectName, file, {
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
    return await minioClient.presignedGetObject(BUCKET_NAME, objectName, 24 * 60 * 60) // 24 hours
  } catch (error) {
    console.error('Error getting file URL:', error)
    throw new Error('Failed to get file URL')
  }
}

export async function deleteFile(objectName: string): Promise<void> {
  try {
    await minioClient.removeObject(BUCKET_NAME, objectName)
  } catch (error) {
    console.error('Error deleting file:', error)
    throw new Error('Failed to delete file')
  }
}

export { minioClient }
