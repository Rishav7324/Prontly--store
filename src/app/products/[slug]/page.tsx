import { Metadata } from "next";
import { redirect } from "next/navigation";
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
 * Server-side data fetcher using Firestore REST API.
 * Supports Slug lookup and fallback ID lookup for redirects.
 */
async function getProductData(slug: string) {
  const projectId = firebaseConfig.projectId;
  
  // 1. Try finding by SLUG using structured query
  const queryBody = {
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
  };

  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`,
    { 
      method: 'POST',
      body: JSON.stringify(queryBody),
      next: { revalidate: 3600 } 
    }
  );

  if (res.ok) {
    const results = await res.json();
    const doc = results[0]?.document;
    if (doc) return transformDoc(doc);
  }

  // 2. FALLBACK: If slug query fails, check if slug is actually an ID (Legacy support)
  const idRes = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/products/${slug}`,
    { next: { revalidate: 3600 } }
  );

  if (idRes.ok) {
    const doc = await idRes.json();
    return transformDoc(doc);
  }

  return null;
}

function transformDoc(doc: any) {
  const fields = doc.fields || {};
  return {
    id: doc.name.split('/').pop(),
    name: fields.name?.stringValue || "Digital Asset",
    slug: fields.slug?.stringValue || "",
    shortDescription: fields.shortDescription?.stringValue || "",
    description: fields.description?.stringValue || "",
    price: parseInt(fields.price?.integerValue || "0"),
    compareAtPrice: parseInt(fields.compareAtPrice?.integerValue || "0"),
    categorySlug: fields.categorySlug?.stringValue || "Asset",
    images: fields.images?.arrayValue?.values?.map((v: any) => v.stringValue) || [],
    bannerImage: fields.bannerImage?.stringValue || "",
    averageRating: parseFloat(fields.averageRating?.doubleValue || fields.averageRating?.integerValue || "5.0"),
    reviewCount: parseInt(fields.reviewCount?.integerValue || "0"),
    salesCount: parseInt(fields.salesCount?.integerValue || "0"),
  };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductData(slug);

  if (!product) {
    return generateMeta({ 
      title: "Asset Not Found", 
      description: "This digital asset is unavailable.", 
      path: `/products/${slug}` 
    });
  }

  return generateMeta({
    title: product.name,
    description: product.shortDescription || product.description.replace(/<[^>]*>?/gm, '').slice(0, 150),
    path: `/products/${product.slug || product.id}`,
    image: product.bannerImage || product.images[0],
    price: product.price,
    category: product.categorySlug,
    type: 'product'
  });
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductData(slug);

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <h1 className="text-4xl font-bold font-headline mb-4">Asset not found.</h1>
          <p className="text-muted-foreground mb-8">The digital product you are looking for has moved or is no longer available.</p>
          <a href="/products" className="text-primary font-bold hover:underline">Browse Marketplace →</a>
        </main>
        <Footer />
      </div>
    );
  }

  // REDIRECT LOGIC: If the URL param was an ID but we have a slug, redirect to SEO URL
  if (product.slug && slug === product.id) {
    redirect(`/products/${product.slug}`);
  }

  const productSchema = getProductSchema(product);
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Marketplace', path: '/products' },
    { name: product.categorySlug, path: `/products?category=${product.categorySlug}` },
    { name: product.name, path: `/products/${product.slug || product.id}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([productSchema, breadcrumbSchema]) }}
      />
      <ProductDetailClient id={product.id} />
    </>
  );
}
