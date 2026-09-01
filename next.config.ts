import type { NextConfig } from 'next';
import { existsSync } from 'fs';

// Local (phone/proot) builds need an explicit Turbopack root; Vercel does not.
const localTurbopackRoot = existsSync('/public/Prontly--store/package.json')
  ? { turbopack: { root: '/public' } }
  : {};

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  ...localTurbopackRoot,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  serverExternalPackages: [
    'genkit',
    '@genkit-ai/core',
    '@genkit-ai/google-genai',
    'firebase-admin',
    '@aws-sdk/client-s3',
    '@aws-sdk/s3-request-presigner',
    'sharp',
    '@opentelemetry/instrumentation',
    'require-in-the-middle',
    'import-in-the-middle',
  ],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.prontly.in',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
