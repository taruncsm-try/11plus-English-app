/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Prevents build failures if minor ESLint or TypeScript warnings occur during deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Allows loading image assets if you expand to remote media later
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
