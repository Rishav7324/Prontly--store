import { MetadataRoute } from 'next';

/**
 * @fileOverview Dynamic Robots.txt Configuration
 * Optimizes crawl budget for ecommerce while excluding admin/auth paths.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';

  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/products',
        '/blog',
        '/api/og', // Allow OG generator for social previewers
      ],
      disallow: [
        '/admin/',
        '/dashboard/',
        '/api/',
        '/checkout',
        '/cart',
        '/login',
        '/signup',
        '/reset-password',
        '/forgot-password',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
