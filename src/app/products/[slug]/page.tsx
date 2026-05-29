import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetailClient } from '@/components/store/ProductDetailClient';
import { firebaseConfig } from '@/firebase/config';
import { generateMeta } from '@/lib/seo/generate-meta';

/**
 * PRODUCTION PRODUCT RESOLVER
 */
async function getProductBySlug(slug: string) {
  const projectId = firebaseConfig.projectId;
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

  const query = {
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

  try {
    const res = await fetch(`${baseUrl}:runQuery`, {
      method: 'POST',
      body: JSON.stringify(query),
      next: { revalidate: 60 }
    });

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
    
    // Fallback lookup by ID
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

  return <ProductDetailClient product={product} />;
}
