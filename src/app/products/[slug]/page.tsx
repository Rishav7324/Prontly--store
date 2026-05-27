
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProductDetailClient } from "@/components/store/ProductDetailClient";
import { generateMeta } from "@/lib/seo/generate-meta";
import { firebaseConfig } from "@/firebase/config";
import { getProductSchema, getBreadcrumbSchema } from "@/lib/seo/schema-builder";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * High-reliability product resolver using Firestore REST API.
 * Optimized for Next.js 15 Server Components.
 */
async function getProduct(slug: string) {
  const projectId = firebaseConfig.projectId;
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

  try {
    // 1. Primary Lookup: Query by SLUG using runQuery
    const queryRes = await fetch(`${baseUrl}:runQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'products' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'slug' },
              op: 'EQUAL',
              value: { stringValue: slug }
            }
          },
          limit: 1
        }
      }),
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (queryRes.ok) {
      const results = await queryRes.json();
      const doc = results[0]?.document;
      if (doc) {
        const fields = doc.fields || {};
        return {
          id: doc.name.split('/').pop(),
          name: fields.name?.stringValue || "",
          slug: fields.slug?.stringValue || "",
          price: parseInt(fields.price?.integerValue || "0"),
          compareAtPrice: parseInt(fields.compareAtPrice?.integerValue || "0"),
          categorySlug: fields.categorySlug?.stringValue || "",
          images: fields.images?.arrayValue?.values?.map((v: any) => v.stringValue) || [],
          shortDescription: fields.shortDescription?.stringValue || "",
          description: fields.description?.stringValue || "",
          bannerImage: fields.bannerImage?.stringValue || "",
          averageRating: parseFloat(fields.averageRating?.doubleValue || fields.averageRating?.integerValue || "5.0"),
          reviewCount: parseInt(fields.reviewCount?.integerValue || "0"),
          salesCount: parseInt(fields.salesCount?.integerValue || "0"),
          tags: fields.tags?.arrayValue?.values?.map((v: any) => v.stringValue) || [],
          fileFormat: fields.fileFormat?.stringValue || "",
          fileVersion: fields.fileVersion || "1.0"
        };
      }
    }

    // 2. Fallback: Lookup by ID (Legacy URL support)
    const idRes = await fetch(`${baseUrl}/products/${slug}`, {
      next: { revalidate: 3600 }
    });

    if (idRes.ok) {
      const doc = await idRes.json();
      const fields = doc.fields || {};
      const actualSlug = fields.slug?.stringValue;
      
      // If product has a slug, redirect to the SEO-friendly URL
      if (actualSlug && actualSlug !== slug) {
        return { needsRedirect: true, targetSlug: actualSlug };
      }

      return {
        id: doc.name.split('/').pop(),
        name: fields.name?.stringValue || "",
        slug: fields.slug?.stringValue || "",
        price: parseInt(fields.price?.integerValue || "0"),
        categorySlug: fields.categorySlug?.stringValue || "",
        images: fields.images?.arrayValue?.values?.map((v: any) => v.stringValue) || []
      };
    }

    return null;
  } catch (error) {
    console.error(`[RESOLVER_ERROR]:`, error);
    return null;
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product: any = await getProduct(slug);

  if (!product || product.needsRedirect) {
    return generateMeta({ 
      title: "Asset Not Found", 
      description: "This digital asset is unavailable.", 
      path: `/products/${slug}`,
      noIndex: true
    });
  }

  return generateMeta({
    title: product.name,
    description: product.shortDescription || product.description?.replace(/<[^>]*>?/gm, '').slice(0, 150) || "",
    path: `/products/${product.slug || product.id}`,
    image: product.bannerImage || product.images?.[0],
    price: product.price,
    category: product.categorySlug,
    type: 'product'
  });
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product: any = await getProduct(slug);

  if (!product) {
    notFound();
  }

  // Handle Legacy ID Redirect
  if (product.needsRedirect && product.targetSlug) {
    redirect(`/products/${product.targetSlug}`);
  }

  const productSchema = getProductSchema(product);
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Marketplace', path: '/products' },
    { name: product.categorySlug || 'Assets', path: `/products?category=${product.categorySlug}` },
    { name: product.name, path: `/products/${product.slug || product.id}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([productSchema, breadcrumbSchema]) }}
      />
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        {/* Pass actual document ID to client for standard reference lookups */}
        <ProductDetailClient id={product.id} />
        <Footer />
      </div>
    </>
  );
}
