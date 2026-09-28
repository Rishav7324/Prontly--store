import { MetadataRoute } from 'next';
import { isDatabaseConfigured, getDb } from '@/lib/db';
import { products, categories, blogPosts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const revalidate = 3600; // Hourly ISR cache

function safeDate(input: unknown): Date | undefined {
  if (!input) return undefined;
  const d = input instanceof Date ? input : new Date(String(input));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in').replace(/\/$/, '');

  const routes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${siteUrl}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteUrl}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/contact`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/testimonials`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/terms`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${siteUrl}/privacy`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${siteUrl}/refund-policy`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${siteUrl}/delivery-policy`, changeFrequency: 'monthly', priority: 0.4 },
  ];

  if (!isDatabaseConfigured()) {
    return routes;
  }

  try {
    const db = getDb();
    const [prods, cats, blogs] = await Promise.all([
      db
        .select({
          slug: products.slug,
          updatedAt: products.updatedAt,
          createdAt: products.createdAt,
        })
        .from(products)
        .where(eq(products.isPublished, true)),
      db
        .select({
          slug: categories.slug,
          updatedAt: categories.updatedAt,
        })
        .from(categories)
        .where(eq(categories.isActive, true)),
      db
        .select({
          slug: blogPosts.slug,
          updatedAt: blogPosts.updatedAt,
          publishedAt: blogPosts.publishedAt,
        })
        .from(blogPosts)
        .where(eq(blogPosts.status, 'published')),
    ]);

    for (const p of prods) {
      if (!p.slug) continue;
      routes.push({
        url: `${siteUrl}/products/${encodeURIComponent(p.slug)}`,
        lastModified: safeDate(p.updatedAt || p.createdAt),
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    }

    for (const c of cats) {
      if (!c.slug) continue;
      routes.push({
        url: `${siteUrl}/products?category=${encodeURIComponent(c.slug)}`,
        lastModified: safeDate(c.updatedAt),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }

    for (const b of blogs) {
      if (!b.slug) continue;
      routes.push({
        url: `${siteUrl}/blog/${encodeURIComponent(b.slug)}`,
        lastModified: safeDate(b.updatedAt || b.publishedAt),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
  } catch (error) {
    console.error('[DYNAMIC_SITEMAP_FETCH_ERROR]:', error);
  }

  // Deduplicate URLs
  const unique = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const r of routes) {
    unique.set(r.url, r);
  }

  return Array.from(unique.values());
}
