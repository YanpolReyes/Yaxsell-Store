import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Build ID único por deploy → Vercel invalida Full Route Cache automáticamente
  generateBuildId: async () => {
    return `deploy-${Date.now()}`;
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http',  hostname: '**' },
    ],
  },
  async headers() {
    return [
      {
        // HTML pages — ISR: cachear 60s en edge, refrescar al volver
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=60, stale-while-revalidate=60',
          },
        ],
      },
      {
        // API routes — nunca cachear
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
      {
        // JS/CSS assets ya tienen hash en el nombre — cachearlos sí
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
