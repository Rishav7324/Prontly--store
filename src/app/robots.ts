import { MetadataRoute } from 'next';

/**
 * @fileOverview Dynamic Robots.txt Configuration
 * Optimizes crawl budget for e-commerce while excluding admin/auth paths.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/dashboard/',
          '/_next/',
          '/auth/'
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
