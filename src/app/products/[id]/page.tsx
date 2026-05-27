import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetailClient } from '@/components/store/ProductDetailClient';
import { firebaseConfig } from '@/firebase/config';
import { generateMeta } from '@/lib/seo/generate-meta';
import { getProductSchema } from '@/lib/seo/schema-builder';

/**
 * PRODUCTION PRODUCT RESOLVER
 * Fetches product data via SEO slug and hydrates the detail client.
 * Now standardized on [id] for App Router consistency while maintaining slug resolution.
 */
async function getProductData(identifier: string) {
  const projectId = firebaseConfig.projectId;
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

  // 1. Try resolving as SLUG first
  const slugQuery = {
    structuredQuery: {
      from: [{ collectionId: 'products' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'slug' },
          op: 'EQUAL',
          value: { stringValue: identifier }
        }
      },
      limit: 1
    }
  };

  let product: any = null;

  try {
    const slugRes = await fetch(`${baseUrl}:runQuery`, {
      method: 'POST',
      body: JSON.stringify(slugQuery),
      next: { revalidate: 60 }
    });

    if (slugRes.ok) {
      const data = await slugRes.json();
      if (data[0]?.document) {
        const doc = data[0].document;
        const f = doc.fields;
        product = {
          id: doc.name.split('/').pop(),
          slug: f.slug?.stringValue || '',
          name: f.name?.stringValue || '',
          price: parseInt(f.price?.integerValue || '0'),
          categorySlug: f.categorySlug?.stringValue || '',
          description: f.description?.stringValue || '',
          shortDescription: f.shortDescription?.stringValue || '',
          images: f.images?.arrayValue?.values?.map((v: any) => v.stringValue) || [],
          averageRating: parseFloat(f.averageRating?.doubleValue || f.averageRating?.integerValue || '5.0'),
          reviewCount: parseInt(f.reviewCount?.integerValue || '0'),
          salesCount: parseInt(f.salesCount?.integerValue || '0'),
          fileFormat: f.fileFormat?.stringValue || 'SOURCE',
          fileVersion: f.fileVersion?.stringValue || '1.0'
        };
      }
    }
    
    // 2. Fallback to ID if slug lookup failed
    if (!product) {
      const idRes = await fetch(`${baseUrl}/products/${identifier}`, { next: { revalidate: 60 } });
      if (idRes.ok) {
        const doc = await idRes.json();
        const f = doc.fields;
        product = {
          id: doc.name.split('/').pop(),
          slug: f.slug?.stringValue || '',
          name: f.name?.stringValue || '',
          price: parseInt(f.price?.integerValue || '0'),
          categorySlug: f.categorySlug?.stringValue || '',
          description: f.description?.stringValue || '',
          shortDescription: f.shortDescription?.stringValue || '',
          images: f.images?.arrayValue?.values?.map((v: any) => v.stringValue) || [],
          averageRating: parseFloat(f.averageRating?.doubleValue || f.averageRating?.integerValue || '5.0'),
          reviewCount: parseInt(f.reviewCount?.integerValue || '0'),
          salesCount: parseInt(f.salesCount?.integerValue || '0'),
          fileFormat: f.fileFormat?.stringValue || 'SOURCE',
          fileVersion: f.fileVersion?.stringValue || '1.0'
        };
      }
    }

    if (!product) return null;

    // 3. Fetch specific reviews for JSON-LD verification
    const reviewQuery = {
      structuredQuery: {
        from: [{ collectionId: 'reviews' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'productId' },
            op: 'EQUAL',
            value: { stringValue: product.id }
          }
        },
        limit: 5
      }
    };

    const reviewRes = await fetch(`${baseUrl}:runQuery`, {
      method: 'POST',
      body: JSON.stringify(reviewQuery),
      next: { revalidate: 3600 }
    });

    let reviews: any[] = [];
    if (reviewRes.ok) {
      const reviewData = await reviewRes.json();
      reviews = reviewData
        .filter((d: any) => d.document)
        .map((d: any) => {
          const f = d.document.fields;
          return {
            userName: f.userName?.stringValue || 'Verified Buyer',
            rating: parseInt(f.rating?.integerValue || '5'),
            comment: f.comment?.stringValue || '',
            createdAt: f.createdAt?.timestampValue || new Date().toISOString()
          };
        });
    }

    return { product, reviews };
  } catch (error) {
    console.error('[PRODUCT_FETCH_ERROR]:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await getProductData(id);
  
  if (!data?.product) return {};

  const { product } = data;

  return generateMeta({
    title: product.name,
    description: product.shortDescription || `Acquire professional digital assets for your workflow.`,
    path: `/products/${product.slug || product.id}`,
    image: product.images[0],
    price: product.price,
    category: product.categorySlug,
    type: 'product'
  });
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getProductData(id);

  if (!data || !data.product) {
    notFound();
  }

  const { product, reviews } = data;
  const productSchema = getProductSchema(product, reviews);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <ProductDetailClient product={product} />
    </>
  );
}
