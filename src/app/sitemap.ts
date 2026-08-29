import { MetadataRoute } from "next";
import { getDb } from "@/lib/db";
import { products, blogPosts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const revalidate = 3600;
export const maxDuration = 30;

/**
 * Safe helper to ensure valid W3C Date objects for Google Search Console.
 */
function safeDate(input: any, fallback: Date): Date {
  if (!input) return fallback;
  try {
    const d = input instanceof Date ? input : new Date(input);
    return isNaN(d.getTime()) ? fallback : d;
  } catch {
    return fallback;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://store.prontly.in"
  ).replace(/\/$/, "");

  const now = new Date();

  // 1. Core Evergreen Pages with strict priority & valid timestamps
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/products`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/testimonials`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/refund-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/delivery-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // 2. Add Dynamic Products from Neon Database
  try {
    if (process.env.DATABASE_URL) {
      const db = getDb();
      
      const [prods, blogs] = await Promise.all([
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
            slug: blogPosts.slug,
            updatedAt: blogPosts.updatedAt,
            publishedAt: blogPosts.publishedAt,
          })
          .from(blogPosts)
          .where(eq(blogPosts.status, "published")),
      ]);

      for (const p of prods) {
        if (!p.slug) continue;
        routes.push({
          url: `${siteUrl}/products/${encodeURIComponent(p.slug)}`,
          lastModified: safeDate(p.updatedAt || p.createdAt, now),
          changeFrequency: "weekly",
          priority: 0.85,
        });
      }

      for (const b of blogs) {
        if (!b.slug) continue;
        routes.push({
          url: `${siteUrl}/blog/${encodeURIComponent(b.slug)}`,
          lastModified: safeDate(b.updatedAt || b.publishedAt, now),
          changeFrequency: "monthly",
          priority: 0.75,
        });
      }
    }
  } catch (error) {
    console.warn("[SITEMAP_DYNAMIC_WARN]: Falling back to static routes only", error);
  }

  // 3. Deduplicate by URL
  const uniqueMap = new Map<string, MetadataRoute.Sitemap[number]>();
  routes.forEach((item) => uniqueMap.set(item.url, item));
  return Array.from(uniqueMap.values());
}