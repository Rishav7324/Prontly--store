'use client';

import { use } from 'react';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ProductForm } from '@/components/admin/ProductForm';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function EditProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const db = useFirestore();
  
  // Note: For editing in admin, we generally use the document ID. 
  // If slug is passed, it should correspond to the document ID or be resolved.
  const productRef = db ? doc(db, 'products', slug) : null;
  const { data: product, loading } = useDoc(productRef as any);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/products"><ChevronLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-headline">Edit Product</h1>
          <p className="text-muted-foreground text-xs font-mono uppercase">ID: {slug}</p>
        </div>
      </header>

      <ProductForm initialData={product} id={slug} />
    </div>
  );
}
