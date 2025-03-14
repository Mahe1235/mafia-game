/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // In production builds, don't run ESLint
    ignoreDuringBuilds: true,
    // Disable ESLint errors during development
    dirs: ['pages', 'components', 'lib', 'src'],
  },
  typescript: {
    // In production builds, don't run TypeScript type checking
    ignoreBuildErrors: true,
  },
  
  // Set output mode to recommended version
  output: 'standalone',
  
  // Update to use correct option names for Next.js 15
  experimental: {
    // Next.js 15 no longer supports serverExternalPackages
  },

  // Remove specific pages from static generation
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,

  // Custom handling for 404 routing
  redirects: async () => {
    return [
      {
        source: '/_not-found',
        destination: '/404',
        permanent: false,
      },
    ]
  }
}

module.exports = nextConfig 