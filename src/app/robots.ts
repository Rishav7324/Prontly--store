import { MetadataRoute } from 'next';

/**
 * @fileOverview Standards-compliant Robots.txt for Google Search Console & Bing Webmaster.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in').replace(/\/$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
