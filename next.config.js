/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['upload.wikimedia.org'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: '*.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: '*.wikipedia.org',
      },
      {
        protocol: 'http',
        hostname: 'upload.wikimedia.org',
      }
    ],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_CONFIG_AVAILABLE: 'true'
  },
  // Increase serverless function timeout (for Vercel deployments)
  experimental: {
    serverComponentsExternalPackages: ['openai'],
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  serverRuntimeConfig: {
    // Will only be available on the server side
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    // Don't put sensitive data here
  },
  // Additional security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 