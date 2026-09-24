import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: {
    authInterrupts: true,
    serverActions: { bodySizeLimit: '11mb' },
  },
  transpilePackages: ['@schooz/database'],
};

export default nextConfig;
