/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // Environment variables configuration
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:5000',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  
  // Image optimization for production
  images: {
    unoptimized: true
  },
  
  // Experimental features for better Railway support
  experimental: {
    // Enable server-side environment variables
    serverComponentsExternalPackages: []
  },
  
  // Configure for Railway deployment
  async rewrites() {
    return [
      // Health check rewrite for Railway
      {
        source: '/health',
        destination: '/',
      },
    ]
  }
}

module.exports = nextConfig 