import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MinioClient } from '@/lib/storage'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Reconstruct the object path from the URL segments
    const objectPath = (await params).path.join('/')
    
    if (!objectPath) {
      return NextResponse.json(
        { message: 'File path is required' },
        { status: 400 }
      )
    }

    // Extract organization ID from the path (first segment)
    const pathSegments = objectPath.split('/')
    const organizationId = pathSegments[0]
    
    if (!organizationId && organizationId !== 'default') {
      return NextResponse.json(
        { message: 'Invalid file path' },
        { status: 400 }
      )
    }

    // Verify user has access to this organization
    const userMembership = await db.organizationMembership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organizationId,
        status: 'ACTIVE'
      }
    })

    if (!userMembership && organizationId !== 'default') {
      return NextResponse.json(
        { message: 'Access denied to this file' },
        { status: 403 }
      )
    }

    // Get the file from Minio
    const bucketName = process.env.MINIO_BUCKET || 'associsse'
    
    try {
      const stream = await MinioClient.getObject(bucketName, objectPath)
      
      // Get object metadata
      const stat = await MinioClient.statObject(bucketName, objectPath)
      
      // Convert stream to buffer
      const chunks: Buffer[] = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }
      const buffer = Buffer.concat(chunks)
      
      // Set appropriate headers
      const headers = new Headers()
      headers.set('Content-Type', stat.metaData['content-type'] || 'application/octet-stream')
      headers.set('Content-Length', buffer.length.toString())
      headers.set('Cache-Control', 'public, max-age=31536000') // Cache for 1 year
      headers.set('X-Content-Type-Options', 'nosniff')
      headers.set('X-Frame-Options', 'DENY')
      headers.set('X-XSS-Protection', '1; mode=block')
      
      // Set ETag for caching
      if (stat.etag) {
        headers.set('ETag', stat.etag)
      }
      
      // Set Last-Modified
      if (stat.lastModified) {
        headers.set('Last-Modified', stat.lastModified.toUTCString())
      }
      
      return new NextResponse(buffer, {
        status: 200,
        headers,
      })
      
    } catch (minioError) {
      console.error('Minio error:', minioError)
      return NextResponse.json(
        { message: 'File not found' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('File proxy error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const objectPath = (await params).path.join('/')
    
    if (!objectPath) {
      return NextResponse.json(
        { message: 'File path is required' },
        { status: 400 }
      )
    }

    // Extract organization ID from the path (first segment)
    const pathSegments = objectPath.split('/')
    const organizationId = pathSegments[0]
    
    if (!organizationId && organizationId !== 'default') {
      return NextResponse.json(
        { message: 'Invalid file path' },
        { status: 400 }
      )
    }

    // Verify user has access to this organization
    const userMembership = await db.organizationMembership.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organizationId,
        status: 'ACTIVE'
      }
    })

    if (!userMembership && organizationId !== 'default') {
      return NextResponse.json(
        { message: 'Access denied to this file' },
        { status: 403 }
      )
    }

    const bucketName = process.env.MINIO_BUCKET || 'associsse'
    
    try {
      const stat = await MinioClient.statObject(bucketName, objectPath)
      
      const headers = new Headers()
      headers.set('Content-Type', stat.metaData['content-type'] || 'application/octet-stream')
      headers.set('Content-Length', stat.size.toString())
      headers.set('Cache-Control', 'public, max-age=31536000')
      headers.set('X-Content-Type-Options', 'nosniff')
      headers.set('X-Frame-Options', 'DENY')
      headers.set('X-XSS-Protection', '1; mode=block')
      
      if (stat.etag) {
        headers.set('ETag', stat.etag)
      }
      
      if (stat.lastModified) {
        headers.set('Last-Modified', stat.lastModified.toUTCString())
      }
      
      return new NextResponse(null, {
        status: 200,
        headers,
      })
      
    } catch (minioError) {
      return NextResponse.json(
        { message: 'File not found' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('File proxy HEAD error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
