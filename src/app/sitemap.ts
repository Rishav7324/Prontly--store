import { MetadataRoute } from "next";
import { getDb } from "@/lib/db";
import { products, blogPosts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const revalidate = 3600;

function safeDate(input: unknown): Date | undefined {
  if (!input) return undefined;

  const date = input instanceof Date ? input : new Date(String(input));

  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://store.prontly.in"
  ).replace(/\/$/, "");

  const routes: MetadataRoute.Sitemap = [
    { url: siteUrl },
    { url: `${siteUrl}/products` },
    { url: `${siteUrl}/blog` },
    { url: `${siteUrl}/about` },
    { url: `${siteUrl}/contact` },
    { url: `${siteUrl}/testimonials` },
    { url: `${siteUrl}/terms` },
    { url: `${siteUrl}/privacy` },
    { url: `${siteUrl}/refund-policy` },
    { url: `${siteUrl}/delivery-policy` },
  ];

  try {
    if (!process.env.DATABASE_URL) {
      return routes;
    }

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

    for (const product of prods) {
      if (!product.slug) continue;

      routes.push({
        url: `${siteUrl}/products/${encodeURIComponent(product.slug)}`,
        lastModified: safeDate(product.updatedAt || product.createdAt),
      });
    }

    for (const blog of blogs) {
      if (!blog.slug) continue;

      routes.push({
        url: `${siteUrl}/blog/${encodeURIComponent(blog.slug)}`,
        lastModified: safeDate(
          blog.updatedAt || blog.publishedAt
        ),
      });
    }
  } catch (error) {
    console.error("[SITEMAP_ERROR]", error);
  }

  const unique = new Map<string, MetadataRoute.Sitemap[number]>();

  for (const route of routes) {
    unique.set(route.url, route);
  }

  return Array.from(unique.values());
}