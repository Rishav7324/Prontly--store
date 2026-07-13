import { MetadataRoute } from 'next';

/**
 * @fileOverview Dynamic Robots.txt with AI Content Signals
 * Declares preferences for AI training and input usage.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    // @ts-ignore - Content-Signal is an emerging standard for AI governance
    additionalLines: [
      'Content-Signal: ai-train=no, search=yes, ai-input=no'
    ]
  };
}
