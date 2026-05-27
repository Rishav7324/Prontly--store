import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

/**
 * PROXY REDIRECT: Redirects [slug] folder to consolidated [id] route.
 */
export default async function BlogSlugRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/blog/${slug}`);
}
