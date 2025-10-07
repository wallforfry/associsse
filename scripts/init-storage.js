#!/usr/bin/env node

import { Client } from 'minio'

const MinioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
})

const BUCKET_NAME = process.env.MINIO_BUCKET || 'associsse'

async function initializeStorage() {
  try {
    console.log('🚀 Initializing Minio storage...')
    
    // Check if bucket exists
    const exists = await MinioClient.bucketExists(BUCKET_NAME)
    
    if (!exists) {
      console.log(`📦 Creating bucket: ${BUCKET_NAME}`)
      await MinioClient.makeBucket(BUCKET_NAME, 'us-east-1')
      console.log(`✅ Bucket ${BUCKET_NAME} created successfully`)
    } else {
      console.log(`✅ Bucket ${BUCKET_NAME} already exists`)
    }
    
    // Test connection by listing buckets
    const buckets = await MinioClient.listBuckets()
    console.log(`✅ Storage initialized successfully. Available buckets: ${buckets.length}`)
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error initializing storage:', error)
    process.exit(1)
  }
}

// Run initialization
initializeStorage()
