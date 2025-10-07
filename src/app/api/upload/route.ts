import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MinioClient } from '@/lib/storage'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/csv']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: 'Invalid file type. Only images or PDFs are allowed.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExtension}`
    
    // Create folder structure: organizationId/type/filename
    const organizationId = formData.get('organizationId') as string || 'default'
    const fileType = formData.get('type') as string || 'general'
    const objectName = `${organizationId}/${fileType}/${fileName}`

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload to Minio
    await MinioClient.putObject(
      process.env.MINIO_BUCKET || 'associsse',
      objectName,
      buffer,
      buffer.length,
      {
        'Content-Type': file.type,
        'Content-Length': buffer.length.toString(),
      }
    )

    // Generate proxy URL instead of direct Minio URL
    const proxyUrl = `/api/files/${objectName}`

    return NextResponse.json({
      message: 'File uploaded successfully',
      url: proxyUrl,
      fileName: fileName,
      objectName: objectName,
      size: file.size,
      type: file.type,
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const objectName = searchParams.get('objectName')

    if (!objectName) {
      return NextResponse.json(
        { message: 'No object name provided' },
        { status: 400 }
      )
    }

    // Delete from Minio
    await MinioClient.removeObject(
      process.env.MINIO_BUCKET || 'associsse',
      objectName
    )

    return NextResponse.json({
      message: 'File deleted successfully'
    })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
