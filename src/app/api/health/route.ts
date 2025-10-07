import { NextResponse } from 'next/server'
import { initializeStorage } from '@/lib/storage'

export async function GET() {
  try {
    // Initialize storage on health check
    await initializeStorage()
    
    return NextResponse.json({
      status: 'healthy',
      storage: 'initialized',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      storage: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
