import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    success: true,
    status: 'healthy',
    message: 'Frontend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
  })
} 