import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: {
    authInterrupts: true,
  },
  transpilePackages: ['@schooz/database'],
};

export default nextConfig;
