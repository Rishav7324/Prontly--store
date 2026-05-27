'use client';

import { use, useMemo } from 'react';
import { ProductForm } from '@/components/admin/ProductForm';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const db = useFirestore();
  const productRef = useMemo(() => (db ? doc(db, 'products', id) : null), [db, id]);
  const { data: product, loading } = useDoc(productRef);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/products"><ChevronLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-headline">Edit Product</h1>
          <p className="text-muted-foreground">Updating: <span className="text-primary">{product?.name}</span></p>
        </div>
      </header>

      {product && <ProductForm initialData={product} id={id} />}
    </div>
  );
}
