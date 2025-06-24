/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // Image optimization for production
  images: {
    unoptimized: true
  },
  
  // Disable telemetry
  telemetry: {
    disabled: true
  }
}

module.exports = nextConfig 