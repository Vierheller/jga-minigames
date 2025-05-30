import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // GitHub Pages deployment configuration
  basePath: process.env.NODE_ENV === 'production' ? '/jga-minigames' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/jga-minigames/' : '',
  // Ensure CSS is properly handled in static export
  experimental: {
    optimizeCss: false, // Disable CSS optimization that can cause issues with static export
  },
  // Force static generation
  distDir: 'out',
};

export default nextConfig;
