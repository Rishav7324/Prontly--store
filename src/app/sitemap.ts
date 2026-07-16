import { MetadataRoute } from "next";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
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
    const db = getAdminDb();

    const products = await db
      .collection("products")
      .select("slug", "updatedAt")
      .get();

    products.docs.forEach((doc) => {
      const data = doc.data();

      if (!data.slug) return;

      sitemap.push({
        url: `${siteUrl}/products/${data.slug}`,
        lastModified: data.updatedAt?.toDate?.() ?? now,
        changeFrequency: "weekly",
        priority: 0.9,
      });
    });

    const blogs = await db
      .collection("blog_posts")
      .select("slug", "updatedAt", "publishedAt")
      .get();

    blogs.docs.forEach((doc) => {
      const data = doc.data();

      if (!data.slug) return;

      sitemap.push({
        url: `${siteUrl}/blog/${data.slug}`,
        lastModified:
          data.updatedAt?.toDate?.() ??
          data.publishedAt?.toDate?.() ??
          now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    });

    const unique = new Map<string, MetadataRoute.Sitemap[number]>();

    sitemap.forEach((item) => unique.set(item.url, item));

    return [...unique.values()];
  } catch (error) {
    console.error("Sitemap generation failed:", error);
    return sitemap;
  }
}