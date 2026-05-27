import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProductDetailClient } from "@/components/store/ProductDetailClient";
import { generateMeta } from "@/lib/seo/generate-meta";
import { firebaseConfig } from "@/firebase/config";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getProduct(idOrSlug: string) {
  const projectId = firebaseConfig.projectId;
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  
  // 1. Try Exact Slug Match
  const slugQuery = {
    structuredQuery: {
      from: [{ collectionId: 'products' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'slug' },
          op: 'EQUAL',
          value: { stringValue: idOrSlug }
        }
      },
      limit: 1
    }
  };

  const slugRes = await fetch(`${baseUrl}:runQuery`, {
    method: 'POST',
    body: JSON.stringify(slugQuery),
    next: { revalidate: 60 }
  });

  const slugData = await slugRes.json();
  if (slugData?.[0]?.document) {
    const doc = slugData[0].document;
    const fields = doc.fields;
    return {
      id: doc.name.split('/').pop(),
      name: fields.name?.stringValue || "",
      slug: fields.slug?.stringValue || "",
      description: fields.description?.stringValue || "",
      shortDescription: fields.shortDescription?.stringValue || "",
      price: parseInt(fields.price?.integerValue || "0"),
      categorySlug: fields.categorySlug?.stringValue || "Asset",
      images: fields.images?.arrayValue?.values?.map((v: any) => v.stringValue) || [],
      averageRating: parseFloat(fields.averageRating?.doubleValue || fields.averageRating?.integerValue || "5.0"),
      reviewCount: parseInt(fields.reviewCount?.integerValue || "0"),
      salesCount: parseInt(fields.salesCount?.integerValue || "0"),
      fileFormat: fields.fileFormat?.stringValue || "",
      fileVersion: fields.fileVersion?.stringValue || "1.0",
    };
  }

  // 2. Fallback to Direct ID Lookup
  const idRes = await fetch(`${baseUrl}/products/${idOrSlug}`, { next: { revalidate: 60 } });
  if (idRes.ok) {
    const doc = await idRes.json();
    const fields = doc.fields;
    const product = {
      id: doc.name.split('/').pop(),
      name: fields.name?.stringValue || "",
      slug: fields.slug?.stringValue || "",
      description: fields.description?.stringValue || "",
      shortDescription: fields.shortDescription?.stringValue || "",
      price: parseInt(fields.price?.integerValue || "0"),
      categorySlug: fields.categorySlug?.stringValue || "Asset",
      images: fields.images?.arrayValue?.values?.map((v: any) => v.stringValue) || [],
      averageRating: parseFloat(fields.averageRating?.doubleValue || fields.averageRating?.integerValue || "5.0"),
      reviewCount: parseInt(fields.reviewCount?.integerValue || "0"),
      salesCount: parseInt(fields.salesCount?.integerValue || "0"),
      fileFormat: fields.fileFormat?.stringValue || "",
      fileVersion: fields.fileVersion?.stringValue || "1.0",
    };

    // SEO REDIRECT: If found by ID but slug exists, redirect to slug URL
    if (product.slug && product.slug !== idOrSlug) {
      return { redirect: `/products/${product.slug}` };
    }
    return product;
  }

  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  
  if (!product || 'redirect' in product) {
    return generateMeta({ title: "Product Not Found", description: "", path: "/products" });
  }

  return generateMeta({
    title: product.name,
    description: product.shortDescription || product.description?.replace(/<[^>]*>?/gm, '').slice(0, 160),
    path: `/products/${product.slug || product.id}`,
    image: product.images?.[0],
    price: product.price,
    category: product.categorySlug,
    type: 'product'
  });
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getProduct(id);

  if (!result) notFound();
  if ('redirect' in result) redirect(result.redirect);

  return <ProductDetailClient product={result} />;
}
