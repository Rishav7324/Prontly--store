import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProductDetailClient } from "@/components/store/ProductDetailClient";
import { generateMeta } from "@/lib/seo/generate-meta";
import { getAdminDb } from "@/lib/firebase-admin";
import { getProductSchema, getBreadcrumbSchema } from "@/lib/seo/schema-builder";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Server-side data fetcher using Firebase Admin SDK.
 * Optimized for Next.js 15 App Router.
 */
async function getProduct(slug: string) {
  console.log(`[ROUTING]: Resolving product for identifier: "${slug}"`);
  const db = getAdminDb();
  
  try {
    // 1. Primary Lookup: Query by SLUG
    const snapshot = await db.collection('products')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }

    // 2. Fallback: Lookup by ID (Legacy URL support)
    const idDoc = await db.collection('products').doc(slug).get();
    if (idDoc.exists) {
      const data = idDoc.data();
      // If product has a slug, redirect to the SEO-friendly URL
      if (data?.slug) {
        return { id: idDoc.id, ...data, needsRedirect: true, targetSlug: data.slug };
      }
      return { id: idDoc.id, ...data };
    }

    return null;
  } catch (error: any) {
    console.error(`[ROUTING_ERROR]: Firestore lookup failed:`, error.message);
    return null;
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product: any = await getProduct(slug);

  if (!product) {
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

  // Handle Legacy ID Redirect to maintain SEO
  if (product.needsRedirect && product.targetSlug) {
    console.log(`[REDIRECT]: Moving legacy ID to slug: /products/${product.targetSlug}`);
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
        <ProductDetailClient id={product.id} />
        <Footer />
      </div>
    </>
  );
}
