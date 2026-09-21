import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typedRoutes: true,
  transpilePackages: ['@schooz/database'],
};

export default nextConfig;
