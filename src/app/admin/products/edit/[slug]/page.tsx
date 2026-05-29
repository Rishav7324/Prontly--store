'use client';

import { use, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { ProductForm } from '@/components/admin/ProductForm';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function EditProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const db = useFirestore();
  
  // Resolve the document ID by querying the slug
  const productQuery = useMemoFirebase(() => {
    return db ? query(collection(db, 'products'), where('slug', '==', slug), limit(1)) : null;
  }, [db, slug]);

  const { data: products, loading } = useCollection(productQuery);
  const product = products?.[0];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive opacity-50" />
        <h2 className="text-xl font-bold">Product not found</h2>
        <p className="text-muted-foreground">The product with slug "{slug}" does not exist.</p>
        <Button asChild variant="outline">
          <Link href="/admin/products">Back to Registry</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/admin/products"><ChevronLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-headline">Edit Product</h1>
          <p className="text-muted-foreground text-xs font-mono uppercase">Identifier: {slug}</p>
        </div>
      </header>

      {/* Crucial: Pass the actual Firestore doc ID to the form for updates */}
      <ProductForm initialData={product} id={product.id} />
    </div>
  );
}
