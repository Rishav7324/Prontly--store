'use client';

import { use, useMemo } from 'react';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, doc } from 'firebase/firestore';
import { ProductForm } from '@/components/admin/ProductForm';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

/**
 * @fileOverview Product Edit Resolver
 * Handles dual resolution (Slug or ID) to ensure data is always found.
 */
export default function EditProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const db = useFirestore();
  
  // 1. Attempt lookup by Slug field
  const slugQuery = useMemoFirebase(() => {
    return db ? query(collection(db, 'products'), where('slug', '==', slug), limit(1)) : null;
  }, [db, slug]);

  const { data: slugResults, loading: slugLoading } = useCollection(slugQuery);
  
  // 2. Fallback: Attempt lookup by direct Document ID
  const idRef = useMemoFirebase(() => {
    return db ? doc(db, 'products', slug) : null;
  }, [db, slug]);

  const { data: idResult, loading: idLoading } = useDoc(idRef);

  // Resolve the actual product data from either source
  const product = (slugResults && slugResults.length > 0) ? slugResults[0] : (idResult || null);
  const isLoading = slugLoading && idLoading;

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!product && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive opacity-50" />
        <h2 className="text-xl font-bold text-midnight-ink">Product not found</h2>
        <p className="text-muted-foreground text-sm">The asset with identifier "{slug}" could not be resolved.</p>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/admin/products">Return to Catalog</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full bg-muted/30 h-10 w-10">
          <Link href="/admin/products"><ChevronLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-headline text-midnight-ink">Modify Asset</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
            Index UID: {product?.id}
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
