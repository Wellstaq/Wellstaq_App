import path from 'node:path';
import type {NextConfig} from 'next';

const monorepoRoot = path.join(__dirname, '../..');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
  outputFileTracingRoot: monorepoRoot,
  turbopack: {root: monorepoRoot},
  transpilePackages: ['motion', '@wellstaq/ui'],
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [
      {protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**'},
      {protocol: 'https', hostname: 'df1bgz4t3wxg5.cloudfront.net', pathname: '/**'},
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {key: 'X-Content-Type-Options', value: 'nosniff'},
          {key: 'X-Frame-Options', value: 'DENY'},
          {key: 'Referrer-Policy', value: 'no-referrer'},
          {key: 'X-Robots-Tag', value: 'noindex, nofollow'},
          {key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()'},
          {key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains'},
        ],
      },
    ];
  },
};

export default nextConfig;
