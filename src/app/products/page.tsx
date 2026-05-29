import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MarketplaceClient } from '@/components/store/MarketplaceClient';
import { firebaseConfig } from '@/firebase/config';
import { generateMeta } from '@/lib/seo/generate-meta';
import { getCollectionSchema } from '@/lib/seo/schema-builder';

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

    // 2. Fetch All Products (with slug)
    const prodRes = await fetch(`${baseUrl}/products?pageSize=100`, { next: { revalidate: 3600 } });
    const prodData = await prodRes.json();
    const products = (prodData.documents || []).map((doc: any) => {
      const fields = doc.fields || {};
      
      // SAFETY: Robust mapping for potentially missing or differently typed Firestore fields
      return {
        id: doc.name.split('/').pop(),
        slug: fields.slug?.stringValue || "",
        name: fields.name?.stringValue || "Untitled Asset",
        price: parseInt(fields.price?.integerValue || fields.price?.doubleValue?.toString() || "0"),
        categorySlug: fields.categorySlug?.stringValue || "",
        images: fields.images?.arrayValue?.values?.map((v: any) => v.stringValue) || [],
        averageRating: parseFloat(fields.averageRating?.doubleValue || fields.averageRating?.integerValue || "5.0"),
        salesCount: parseInt(fields.salesCount?.integerValue || fields.salesCount?.doubleValue?.toString() || "0"),
        shortDescription: fields.shortDescription?.stringValue || ""
      };
    });

    return { categories, products };
  } catch (error) {
    console.error('[MARKETPLACE_DATA_FETCH_ERROR]:', error);
    return { categories: [], products: [] };
  }
}

export async function generateMetadata({ searchParams }: MarketplacePageProps): Promise<Metadata> {
  const { category, q } = await searchParams;
  
  let title = "Browse All AI Prompts & Templates";
  let description = "Shop premium AI prompts, UI kits and creator templates. Hand-tested for GPT-4o, Midjourney and Claude. Instant delivery.";

  if (category) {
    title = `${category.toString().toUpperCase()} AI Prompts & Assets`;
    description = `Premium ${category} digital assets and templates optimized for your workflow. Instant download with lifetime updates.`;
  }

  if (q) {
    title = `Search results for "${q}"`;
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <MarketplaceClient 
          initialProducts={products} 
          initialCategories={categories} 
        />
      </main>
      <Footer />
    </div>
  );
}
