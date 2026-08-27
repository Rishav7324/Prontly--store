import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MarketplaceClient } from '@/components/store/MarketplaceClient';
import { generateMeta } from '@/lib/seo/generate-meta';
import { getCollectionSchema, getBreadcrumbSchema } from '@/lib/seo/schema-builder';
import { isDatabaseConfigured, getDb } from '@/lib/db';
import { products as productsTable, categories as categoriesTable } from '@/lib/db/schema';

interface MarketplacePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getInitialData() {
  if (isDatabaseConfigured()) {
    try {
      const db = getDb();
      const [cats, prods] = await Promise.all([
        db.select().from(categoriesTable),
        db.select().from(productsTable),
      ]);
      return {
        categories: cats.map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          iconEmoji: c.iconEmoji || '📦',
          description: c.description || '',
        })),
        products: prods.map((p: any) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          price: p.price,
          compareAtPrice: p.compareAtPrice || 0,
          categorySlug: p.categorySlug || 'asset',
          images: Array.isArray(p.images) ? p.images : [],
          averageRating: (p.averageRating ?? 50) / 10,
          reviewCount: p.reviewCount || 0,
          salesCount: p.salesCount || 0,
          shortDescription: p.shortDescription || '',
          tags: Array.isArray(p.tags) ? p.tags : [],
          isFeatured: p.isFeatured || false,
        })),
      };
    } catch (e) {
      console.error('[CATALOG_SQL_ERROR]:', e);
    }
  }

  // Fallback: Firestore REST (for local dev without DATABASE_URL)
  const { firebaseConfig } = await import('@/firebase/config');
  const projectId = firebaseConfig.projectId;
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  try {
    const [catRes, prodRes] = await Promise.all([
      fetch(`${baseUrl}/categories`, { next: { revalidate: 3600 } }),
      fetch(`${baseUrl}/products?pageSize=100`, { next: { revalidate: 3600 } }),
    ]);
    const catData = await catRes.json();
    const prodData = await prodRes.json();
    const categories = (catData.documents || []).map((doc: any) => {
      const f = doc.fields || {};
      return {
        id: doc.name.split('/').pop(),
        name: f.name?.stringValue || '',
        slug: f.slug?.stringValue || '',
        iconEmoji: f.iconEmoji?.stringValue || '📦',
        description: f.description?.stringValue || '',
      };
    });
    const products = (prodData.documents || []).map((doc: any) => {
      const f = doc.fields || {};
      return {
        id: doc.name.split('/').pop(),
        slug: f.slug?.stringValue || '',
        name: f.name?.stringValue || 'Untitled Asset',
        price: parseInt(f.price?.integerValue || '0'),
        compareAtPrice: parseInt(f.compareAtPrice?.integerValue || '0'),
        categorySlug: f.categorySlug?.stringValue || 'asset',
        images: f.images?.arrayValue?.values?.map((v: any) => v.stringValue) || [],
        averageRating: parseFloat(f.averageRating?.doubleValue || '5'),
        reviewCount: parseInt(f.reviewCount?.integerValue || '0'),
        salesCount: parseInt(f.salesCount?.integerValue || '0'),
        shortDescription: f.shortDescription?.stringValue || '',
        tags: f.tags?.arrayValue?.values?.map((v: any) => v.stringValue) || [],
        isFeatured: f.isFeatured?.booleanValue || false,
      };
    });
    return { categories, products };
  } catch (error) {
    console.error('[CATALOG_DATA_FETCH_ERROR]:', error);
    return { categories: [], products: [] };
  }
}

export async function generateMetadata({ searchParams }: MarketplacePageProps): Promise<Metadata> {
  const sParams = await searchParams;
  const category = sParams.category as string | undefined;
  const q = sParams.q as string | undefined;
  let title = 'Product Catalog | Premium Assets & Templates';
  let description = 'Acquire professional-grade AI prompts, UI systems, and technical documentation. Instant electronic fulfillment with perpetual licensing.';
  if (category) {
    title = `${category.charAt(0).toUpperCase() + category.slice(1)} Assets — Prontly`;
    description = `Browse our specialized collection of ${category} assets. Built for professional performance.`;
  }
  if (q) title = `Search results for "${q}" — Catalog`;
  return generateMeta({ title, description, path: '/products' });
}

export default async function ProductListingPage({ searchParams }: MarketplacePageProps) {
  const sParams = await searchParams;
  const category = sParams.category as string | undefined;
  const { categories, products } = await getInitialData();

  const collectionSchema = getCollectionSchema(category || 'Product Catalog', products);
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Catalog', path: '/products' },
    ...(category ? [{ name: category.charAt(0).toUpperCase() + category.slice(1), path: `/products?category=${category}` }] : []),
  ]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Navbar />
      <main className="flex-1 container-page pt-20 pb-12">
        <MarketplaceClient initialProducts={products} initialCategories={categories} />
      </main>
      <Footer />
    </div>
  );
}
