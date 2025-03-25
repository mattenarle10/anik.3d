/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Completely disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  // Optional: Also disable TypeScript checking during builds for faster builds
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
