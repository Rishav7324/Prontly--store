
'use client';

import { use } from 'react';
import { redirect } from 'next/navigation';

/**
 * Standardize dynamic path names. 
 * This file redirects to the [id] path to resolve parameter naming conflicts.
 */
export default function EditProductRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  redirect(`/admin/products/edit/${slug}`);
}
