'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProductForm } from '@/components/admin/ProductForm';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

/**
 * @fileOverview Product Edit Resolver
 * Loads by slug or ID via GET /api/products/[id-or-slug].
 */
export default function EditProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const res = await fetch(`/api/products/${encodeURIComponent(slug)}`);
      if (res.status === 404) return null;
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load product');
      return json.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!product && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-3">
        <AlertCircle className="h-10 w-10 text-destructive opacity-40" />
        <h2 className="text-lg md:text-xl font-semibold">Product not found</h2>
        <p className="text-xs text-muted-foreground">The asset with identifier &quot;{slug}&quot; could not be resolved.</p>
        <Button asChild variant="outline" className="h-9 rounded-lg text-xs">
          <Link href="/admin/products">Back to Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Button variant="outline" size="icon" asChild className="h-9 w-9 rounded-lg bg-background">
          <Link href="/admin/products"><ChevronLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-lg md:text-xl font-semibold">Edit Product</h1>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 font-mono truncate">
            ID: {product?.id}
          </p>
        </div>
      </header>

      {/* Passing a key forces re-render when data is ready, solving hydration issues */}
      <ProductForm
        key={product?.id || 'loading'}
        initialData={product}
        id={product?.id}
      />
    </div>
  );
}
