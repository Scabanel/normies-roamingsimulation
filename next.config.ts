import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Prevent Next.js from trying to bundle native Node modules
  serverExternalPackages: ['better-sqlite3'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.normies.art',
      },
    ],
  },
}

export default nextConfig
