import { MetadataRoute } from 'next';

/**
 * @fileOverview Static Sitemap Configuration
 * 
 * Note: Dynamic fetching from Firestore is disabled here to comply with 
 * the 'client-side only' Firebase architectural constraint.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';

  const routes = [
    '',
    '/products',
    '/blog',
    '/login',
    '/signup',
    '/terms',
    '/privacy',
    '/refund-policy',
    '/delivery-policy',
    '/cookies',
  ].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  return routes;
}
