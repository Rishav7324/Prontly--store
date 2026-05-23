
import { Metadata } from "next";
import { ProductDetailClient } from "@/components/store/ProductDetailClient";
import { generateMeta } from "@/lib/seo/generate-meta";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Server-side metadata generation for robust OpenGraph support.
 * This ensures platforms like WhatsApp/X see a beautiful card.
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  if (getApps().length === 0) {
    initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
  const db = getFirestore();
  const productDoc = await db.collection("products").doc(id).get();
  const product = productDoc.data();

  if (!product) return generateMeta({ title: "Asset Not Found", description: "This digital asset is unavailable.", path: `/products/${id}` });

  return generateMeta({
    title: product.name,
    description: product.shortDescription || product.description?.replace(/<[^>]*>?/gm, '').slice(0, 150),
    path: `/products/${id}`,
    image: product.bannerImage || product.images?.[0], // Fallback to generator handled in generateMeta
    type: 'product'
  });
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetailClient id={id} />;
}
