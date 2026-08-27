import { MetadataRoute } from "next";
import { getDb } from "@/lib/db";
import { products, blogPosts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://store.prontly.in"
  ).replace(/\/$/, "");

  const now = new Date();

  const sitemap: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
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
      priority: 0.5,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/testimonials`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/wishlist`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${siteUrl}/refund-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${siteUrl}/delivery-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  try {
    const db = getDb();
    const prods = await db
      .select({ slug: products.slug, updatedAt: products.updatedAt })
      .from(products)
      .where(eq(products.isPublished, true));
    for (const p of prods) {
      if (!p.slug) continue;
      sitemap.push({
        url: `${siteUrl}/products/${p.slug}`,
        lastModified: p.updatedAt ?? now,
        changeFrequency: "weekly",
        priority: 0.9,
      });
    }
    const blogs = await db
      .select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt, publishedAt: blogPosts.publishedAt })
      .from(blogPosts)
      .where(eq(blogPosts.status, "published"));
    for (const b of blogs) {
      if (!b.slug) continue;
      sitemap.push({
        url: `${siteUrl}/blog/${b.slug}`,
        lastModified: b.updatedAt ?? b.publishedAt ?? now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }

    const unique = new Map<string, MetadataRoute.Sitemap[number]>();

    sitemap.forEach((item) => unique.set(item.url, item));

    return [...unique.values()];
  } catch (error) {
    console.error("Sitemap generation failed:", error);
    return sitemap;
  }
}