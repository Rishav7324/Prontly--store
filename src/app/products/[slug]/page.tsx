import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProductDetailClient } from "@/components/store/ProductDetailClient";
import { generateMeta } from "@/lib/seo/generate-meta";
import { firebaseConfig } from "@/firebase/config";

/**
 * PROXY REDIRECT: Redirects [slug] folder to consolidated [id] route.
 */
export default async function ProductSlugRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/products/${slug}`);
}
