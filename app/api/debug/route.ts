import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
      PORT: process.env.PORT,
      HOSTNAME: process.env.HOSTNAME,
    };

    return NextResponse.json({
      success: true,
      message: 'Debug endpoint working',
      timestamp: new Date().toISOString(),
      environment: envVars,
      process: {
        version: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
} 