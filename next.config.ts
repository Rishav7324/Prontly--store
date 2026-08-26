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
    ],
  },
};

export default nextConfig;
