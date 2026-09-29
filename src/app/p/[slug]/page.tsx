import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductLandingClient } from '@/components/landing/ProductLandingClient';
import { firebaseConfig } from '@/firebase/config';
import { generateMeta } from '@/lib/seo/generate-meta';
import { getProductSchema, getBreadcrumbSchema } from '@/lib/seo/schema-builder';
import { isDatabaseConfigured, getDb } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * High-Converting Ad Landing Page Resolver (SQL First, Firestore Fallback)
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
          compareAtPrice: p.compareAtPrice || 0,
          categorySlug: p.categorySlug || 'asset',
          description: p.description || '',
          shortDescription: p.shortDescription || '',
          images: Array.isArray(p.images) ? p.images : [],
          bannerImage: p.bannerImage || '',
          averageRating: (p.averageRating ?? 50) / 10,
          reviewCount: p.reviewCount || 0,
          salesCount: p.salesCount || 0,
          fileFormat: p.fileFormat || 'ZIP',
          fileVersion: p.fileVersion || '1.0',
          fileSize: p.fileSize || 0,
        };
      }
      // Check by UUID id
      const [byId] = await db.select().from(products).where(eq(products.id, slug)).limit(1);
      if (byId) {
        return {
          id: byId.id,
          slug: byId.slug,
          name: byId.name,
          price: byId.price,
          compareAtPrice: byId.compareAtPrice || 0,
          categorySlug: byId.categorySlug || 'asset',
          description: byId.description || '',
          shortDescription: byId.shortDescription || '',
          images: Array.isArray(byId.images) ? byId.images : [],
          bannerImage: byId.bannerImage || '',
          averageRating: (byId.averageRating ?? 50) / 10,
          reviewCount: byId.reviewCount || 0,
          salesCount: byId.salesCount || 0,
          fileFormat: byId.fileFormat || 'ZIP',
          fileVersion: byId.fileVersion || '1.0',
          fileSize: byId.fileSize || 0,
        };
      }
    } catch (e) {
      console.error('[LANDING_RESOLVER_SQL_FAULT]:', e);
    }
  }

  // Firestore fallback
  const projectId = firebaseConfig.projectId;
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  const query = {
    structuredQuery: {
      from: [{ collectionId: 'products' }],
      where: { fieldFilter: { field: { fieldPath: 'slug' }, op: 'EQUAL', value: { stringValue: slug } } },
      limit: 1,
    },
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
          compareAtPrice: parseInt(fields.compareAtPrice?.integerValue || '0'),
          categorySlug: fields.categorySlug?.stringValue || 'asset',
          description: fields.description?.stringValue || '',
          shortDescription: fields.shortDescription?.stringValue || '',
          images: fields.images?.arrayValue?.values?.map((v: any) => v.stringValue) || [],
          bannerImage: fields.bannerImage?.stringValue || '',
          averageRating: parseFloat(fields.averageRating?.doubleValue || fields.averageRating?.integerValue || '5.0'),
          reviewCount: parseInt(fields.reviewCount?.integerValue || '0'),
          salesCount: parseInt(fields.salesCount?.integerValue || '0'),
          fileFormat: fields.fileFormat?.stringValue || 'ZIP',
          fileVersion: fields.fileVersion?.stringValue || '1.0',
          fileSize: parseInt(fields.fileSize?.integerValue || '0'),
        };
      }
    }
  } catch (error) {
    console.error('[LANDING_RESOLVER_FAULT]:', error);
  }
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return {};

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';
  const priceInRupees = Math.round(product.price > 1000 ? product.price / 100 : product.price);

  const ogParams = new URLSearchParams({
    title: product.name,
    category: product.categorySlug || 'Digital Asset',
    type: 'Asset',
    price: priceInRupees.toString(),
  });
  const generatedOgImage = `${SITE_URL.replace(/\/$/, '')}/api/og?${ogParams.toString()}`;

  return generateMeta({
    title: `${product.name} — Instant Download`,
    description: product.shortDescription || `Download ${product.name} instantly with commercial license included.`,
    path: `/p/${slug}`,
    image: generatedOgImage,
    price: product.price,
    category: product.categorySlug,
    type: 'product',
  });
}

export default async function ProductAdLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const productSchema = getProductSchema(product);
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/products' },
    { name: product.name, path: `/p/${slug}` },
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
      <ProductLandingClient product={product} />
    </>
  );
}
