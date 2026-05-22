import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/dashboard/',
        '/api/',
        '/checkout',
        '/cart',
        '/login',
        '/signup',
        '/forgot-password',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
