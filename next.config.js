/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // In production builds, don't run ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // In production builds, don't run TypeScript type checking
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig 