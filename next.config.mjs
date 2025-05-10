/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Proxy API requests to the backend during development
  async rewrites() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    return [
      // Forward /api/v1/speech/* routes to our internal Next.js API routes
      // These routes will NOT be proxied to the backend
      {
        source: '/api/v1/speech/:path*',
        destination: '/api/v1/speech/:path*',
      },
      // Forward all other API requests to the backend
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
