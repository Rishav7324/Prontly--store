import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetailClient } from '@/components/store/ProductDetailClient';
import { firebaseConfig } from '@/firebase/config';
import { generateMeta } from '@/lib/seo/generate-meta';
import { getProductSchema, getBreadcrumbSchema } from '@/lib/seo/schema-builder';
import { isDatabaseConfigured, getDb } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * PRODUCTION PRODUCT RESOLVER — SQL first, Firestore fallback
 */
async function getProductBySlug(slug: string) {
  if (isDatabaseConfigured()) {
    try {
      const db = getDb();
      const [p] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
      if (p) {
        return {
          id: p.id,
          slug: p.slug,
          name: p.name,
          price: p.price,
          categorySlug: p.categorySlug || '',
          description: p.description || '',
          shortDescription: p.shortDescription || '',
          images: Array.isArray(p.images) ? p.images : [],
          averageRating: (p.averageRating ?? 50) / 10,
          reviewCount: p.reviewCount || 0,
          salesCount: p.salesCount || 0,
          fileFormat: p.fileFormat || 'SOURCE',
          fileVersion: p.fileVersion || '1.0',
        };
      }
      // try by id (uuid)
      const [byId] = await db.select().from(products).where(eq(products.id, slug)).limit(1);
      if (byId) {
        return {
          id: byId.id,
          slug: byId.slug,
          name: byId.name,
          price: byId.price,
          categorySlug: byId.categorySlug || '',
          description: byId.description || '',
          shortDescription: byId.shortDescription || '',
          images: Array.isArray(byId.images) ? byId.images : [],
          averageRating: (byId.averageRating ?? 50) / 10,
          reviewCount: byId.reviewCount || 0,
          salesCount: byId.salesCount || 0,
          fileFormat: byId.fileFormat || 'SOURCE',
          fileVersion: byId.fileVersion || '1.0',
        };
      }
    } catch (e) {
      console.error('[RESOLVER_SQL_FAULT]:', e);
    }
  }

  const projectId = firebaseConfig.projectId;
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  const query = {
    structuredQuery: { from: [{ collectionId: 'products' }], where: { fieldFilter: { field: { fieldPath: 'slug' }, op: 'EQUAL', value: { stringValue: slug } } }, limit: 1 },
  };
  try {
    const res = await fetch(`${baseUrl}:runQuery`, { method: 'POST', body: JSON.stringify(query), next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      if (data[0]?.document) {
        const doc = data[0].document;
        const fields = doc.fields;
        return {
          id: doc.name.split('/').pop(),
          slug: fields.slug?.stringValue || '',
          name: fields.name?.stringValue || '',
          price: parseInt(fields.price?.integerValue || '0'),
          categorySlug: fields.categorySlug?.stringValue || '',
          description: fields.description?.stringValue || '',
          shortDescription: fields.shortDescription?.stringValue || '',
          images: fields.images?.arrayValue?.values?.map((v: any) => v.stringValue) || [],
          averageRating: parseFloat(fields.averageRating?.doubleValue || fields.averageRating?.integerValue || '5.0'),
          reviewCount: parseInt(fields.reviewCount?.integerValue || '0'),
          salesCount: parseInt(fields.salesCount?.integerValue || '0'),
          fileFormat: fields.fileFormat?.stringValue || 'SOURCE',
          fileVersion: fields.fileVersion?.stringValue || '1.0'
        };
      }
    }
    const idRes = await fetch(`${baseUrl}/products/${slug}`, { next: { revalidate: 60 } });
    if (idRes.ok) {
      const doc = await idRes.json();
      const fields = doc.fields;
      return {
        id: doc.name.split('/').pop(),
        slug: fields.slug?.stringValue || '',
        name: fields.name?.stringValue || '',
        price: parseInt(fields.price?.integerValue || '0'),
        categorySlug: fields.categorySlug?.stringValue || '',
        description: fields.description?.stringValue || '',
        shortDescription: fields.shortDescription?.stringValue || '',
        images: fields.images?.arrayValue?.values?.map((v: any) => v.stringValue) || [],
        averageRating: parseFloat(fields.averageRating?.doubleValue || fields.averageRating?.integerValue || '5.0'),
        reviewCount: parseInt(fields.reviewCount?.integerValue || '0'),
        salesCount: parseInt(fields.salesCount?.integerValue || '0'),
        fileFormat: fields.fileFormat?.stringValue || 'SOURCE',
        fileVersion: fields.fileVersion?.stringValue || '1.0'
      };
    }
  } catch (error) {
    console.error('[RESOLVER_FAULT]:', error);
  }
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  
  if (!product) return {};

  return generateMeta({
    title: product.name,
    description: product.shortDescription || `Acquire professional digital assets for your workflow.`,
    path: `/products/${slug}`,
    image: product.images[0],
    price: product.price,
    category: product.categorySlug,
    type: 'product'
  });
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // averageRating is already on a 0–5 scale from getProductBySlug (SQL path divides by 10,
  // Firestore path parses the stored double) and schema-builder emits it as-is.
  const productSchema = getProductSchema(product);
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/products' },
    { name: product.name, path: `/products/${slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProductDetailClient product={product} />
    </>
  );
}
