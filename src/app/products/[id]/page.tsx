
import { Metadata } from "next";
import { ProductDetailClient } from "@/components/store/ProductDetailClient";
import { generateMeta } from "@/lib/seo/generate-meta";
import { firebaseConfig } from "@/firebase/config";

/**
 * Server-side metadata generation using REST API to avoid firebase-admin authentication errors.
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const projectId = firebaseConfig.projectId;

  try {
    // Using REST fetch for robust server-side execution in prototype environments
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/products/${id}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      return generateMeta({ 
        title: "Asset Not Found", 
        description: "This digital asset is unavailable.", 
        path: `/products/${id}` 
      });
    }
    
    const data = await res.json();
    const fields = data.fields;
    
    // Extracting fields from Firestore REST format
    const name = fields?.name?.stringValue || "Digital Asset";
    const shortDescription = fields?.shortDescription?.stringValue || "";
    const description = fields?.description?.stringValue || "";
    const images = fields?.images?.arrayValue?.values || [];
    const bannerImage = fields?.bannerImage?.stringValue || (images.length > 0 ? images[0].stringValue : "");

    return generateMeta({
      title: name,
      description: shortDescription || description.replace(/<[^>]*>?/gm, '').slice(0, 150),
      path: `/products/${id}`,
      image: bannerImage,
      type: 'product'
    });
  } catch (error) {
    console.error("Metadata fetch error:", error);
    return generateMeta({ 
      title: "Digital Asset", 
      description: "Discover premium digital assets on Prontly Store.", 
      path: `/products/${id}` 
    });
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetailClient id={id} />;
}
