
/**
 * @fileOverview Redirect proxy to resolve 'id' vs 'slug' routing conflict.
 * All dynamic blog routing is consolidated to /blog/[id]
 */
import { redirect } from "next/navigation";

export default async function BlogSlugRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/blog/${slug}`);
}
