
/**
 * @fileOverview Redirect proxy to resolve 'id' vs 'slug' routing conflict.
 * Next.js cannot have sibling [id] and [slug] dynamic segments.
 * All dynamic product routing is consolidated to /products/[id]
 */
import { redirect } from "next/navigation";

export default async function ProductSlugRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/products/${slug}`);
}
