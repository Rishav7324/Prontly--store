import { Metadata } from "next";
import { ProductDetailClient } from "@/components/store/ProductDetailClient";
import { generateMeta } from "@/lib/seo/generate-meta";
import { firebaseConfig } from "@/firebase/config";
import { getProductSchema, getBreadcrumbSchema } from "@/lib/seo/schema-builder";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

async function getProductData(id: string) {
  const projectId = firebaseConfig.projectId;
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/products/${id}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  
  // Transform REST format to plain JS object
  return {
    id: id,
    name: data.fields?.name?.stringValue || "Digital Asset",
    shortDescription: data.fields?.shortDescription?.stringValue || "",
    description: data.fields?.description?.stringValue || "",
    price: parseInt(data.fields?.price?.integerValue || "0"),
    compareAtPrice: parseInt(data.fields?.compareAtPrice?.integerValue || "0"),
    categorySlug: data.fields?.categorySlug?.stringValue || "Asset",
    images: data.fields?.images?.arrayValue?.values?.map((v: any) => v.stringValue) || [],
    bannerImage: data.fields?.bannerImage?.stringValue || "",
  };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductData(id);

  if (!product) {
    return generateMeta({ 
      title: "Asset Not Found", 
      description: "This digital asset is unavailable.", 
      path: `/products/${id}` 
    });
  }

  return generateMeta({
    title: product.name,
    description: product.shortDescription || product.description.replace(/<[^>]*>?/gm, '').slice(0, 150),
    path: `/products/${id}`,
    image: product.bannerImage || product.images[0],
    type: 'product'
  });
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductData(id);

  if (!product) {
    return <div className="min-h-screen flex items-center justify-center font-headline text-3xl">Asset not found.</div>;
  }

  const productSchema = getProductSchema(product);
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Marketplace', path: '/products' },
    { name: product.categorySlug, path: `/products?category=${product.categorySlug}` },
    { name: product.name, path: `/products/${id}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([productSchema, breadcrumbSchema]) }}
      />
      <ProductDetailClient id={id} />
    </>
  );
}
