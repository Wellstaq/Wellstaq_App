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
    // Confirmed (not just suspected) via a real deploy: this Vercel
    // project's multi-service setup (host-based rewrites to per-app
    // "services" in the root vercel.json) doesn't forward Next's built-in
    // /_next/image route correctly -- it 404s in production. Toggled this
    // off then back on across two separate live deploys to be sure; the
    // 404 reappeared the moment the optimizer was re-enabled. Serve raw
    // remote URLs instead of routing through the optimizer.
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
