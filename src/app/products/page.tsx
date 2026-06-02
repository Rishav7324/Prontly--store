import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MarketplaceClient } from '@/components/store/MarketplaceClient';
import { firebaseConfig } from '@/firebase/config';
import { generateMeta } from '@/lib/seo/generate-meta';
import { getCollectionSchema, getBreadcrumbSchema } from '@/lib/seo/schema-builder';

interface MarketplacePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getInitialData() {
  const projectId = firebaseConfig.projectId;
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  
  try {
    // 1. Fetch Categories
    const catRes = await fetch(`${baseUrl}/categories`, { next: { revalidate: 3600 } });
    const catData = await catRes.json();
    const categories = (catData.documents || []).map((doc: any) => {
      const fields = doc.fields || {};
      return {
        id: doc.name.split('/').pop(),
        name: fields.name?.stringValue || "",
        slug: fields.slug?.stringValue || "",
        iconEmoji: fields.iconEmoji?.stringValue || "📦",
        description: fields.description?.stringValue || ""
      };
    });

    // 2. Fetch All Products
    const prodRes = await fetch(`${baseUrl}/products?pageSize=100`, { next: { revalidate: 3600 } });
    const prodData = await prodRes.json();
    const products = (prodData.documents || []).map((doc: any) => {
      const fields = doc.fields || {};
      
      return {
        id: doc.name.split('/').pop(),
        slug: fields.slug?.stringValue || "",
        name: fields.name?.stringValue || "Untitled Asset",
        price: parseInt(fields.price?.integerValue || fields.price?.doubleValue?.toString() || "0"),
        compareAtPrice: parseInt(fields.compareAtPrice?.integerValue || fields.compareAtPrice?.doubleValue?.toString() || "0"),
        categorySlug: fields.categorySlug?.stringValue || "asset",
        images: fields.images?.arrayValue?.values?.map((v: any) => v.stringValue) || [],
        averageRating: parseFloat(fields.averageRating?.doubleValue || fields.averageRating?.integerValue || "5.0"),
        reviewCount: parseInt(fields.reviewCount?.integerValue || "0"),
        salesCount: parseInt(fields.salesCount?.integerValue || "0"),
        shortDescription: fields.shortDescription?.stringValue || "",
        tags: fields.tags?.arrayValue?.values?.map((v: any) => v.stringValue) || [],
        isFeatured: fields.isFeatured?.booleanValue || false
      };
    });

    return { categories, products };
  } catch (error) {
    console.error('[MARKETPLACE_DATA_FETCH_ERROR]:', error);
    return { categories: [], products: [] };
  }
}

export async function generateMetadata({ searchParams }: MarketplacePageProps): Promise<Metadata> {
  const sParams = await searchParams;
  const category = sParams.category as string | undefined;
  const q = sParams.q as string | undefined;
  
  let title = "Digital Marketplace | Elite Assets & Templates";
  let description = "Acquire professional-grade AI prompts, UI systems, and technical documentation. Instant electronic fulfillment with perpetual licensing.";

  if (category) {
    title = `${category.charAt(0).toUpperCase() + category.slice(1)} Assets — Prontly`;
    description = `Browse our specialized inventory of ${category} assets. Engineered for performance and architectural scale.`;
  }

  if (q) {
    title = `Search results for "${q}" — Marketplace`;
  }

  return generateMeta({
    title,
    description,
    path: '/products'
  });
}

export default async function ProductListingPage({ searchParams }: MarketplacePageProps) {
  const sParams = await searchParams;
  const category = sParams.category as string | undefined;
  const { categories, products } = await getInitialData();

  const collectionSchema = getCollectionSchema(category || "Digital Inventory", products);
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Marketplace", path: "/products" },
    ...(category ? [{ name: category.charAt(0).toUpperCase() + category.slice(1), path: `/products?category=${category}` }] : [])
  ]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Navbar />
      <main className="flex-1 container mx-auto px-4 pt-32 pb-24 max-w-7xl">
        <MarketplaceClient 
          initialProducts={products} 
          initialCategories={categories} 
        />
      </main>
      <Footer />
    </div>
  );
}
