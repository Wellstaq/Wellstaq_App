import path from 'node:path';
import type {NextConfig} from 'next';

const monorepoRoot = path.join(__dirname, '../..');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    // This deployment's Vercel project uses the multi-service feature
    // (host-based rewrites to per-app "services" in the root vercel.json).
    // Next's built-in /_next/image optimization route doesn't get forwarded
    // correctly across that service boundary and 404s in production, so
    // images are served unoptimized (the raw remote URL) instead of routed
    // through the optimizer. Revisit if Vercel fixes this for multi-service.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'df1bgz4t3wxg5.cloudfront.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // No `output: 'standalone'` here: that packaging is for self-hosting
  // outside Vercel (e.g. Docker). Vercel builds its own equivalent output,
  // and setting 'standalone' on top of it breaks Next's internal routes —
  // notably `/_next/image`, which 404s in production even though the
  // source image and the configured remotePatterns are both correct.
  outputFileTracingRoot: monorepoRoot,
  turbopack: {root: monorepoRoot},
  transpilePackages: ['motion', '@wellstaq/ui'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {key: 'X-Content-Type-Options', value: 'nosniff'},
          {key: 'X-Frame-Options', value: 'DENY'},
          {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
          {key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)'},
        ],
      },
    ];
  },
};

export default nextConfig;
