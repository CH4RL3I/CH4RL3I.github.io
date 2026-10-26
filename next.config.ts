import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // A stray lockfile in the home folder would otherwise be taken as the workspace root.
  turbopack: { root: process.cwd() },
  // No next/image on this site; switching the optimiser off removes its endpoint entirely.
  images: { unoptimized: true },
  async rewrites() {
    // Old URL, linked from the gog-cli Google sign-in notice. Keep it working.
    return [{ source: '/privacy.html', destination: '/privacy' }];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
