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
  }
}

module.exports = nextConfig 