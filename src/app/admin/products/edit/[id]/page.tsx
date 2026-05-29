'use client';

import { use } from 'react';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ProductForm } from '@/components/admin/ProductForm';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const db = useFirestore();
  
  const productRef = db ? doc(db, 'products', id) : null;
  const { data: product, loading } = useDoc(productRef as any);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/admin/products"><ChevronLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-headline text-midnight-ink">Forge Core: Edit Asset</h1>
          <p className="text-slate-blue text-xs font-mono uppercase tracking-widest font-bold">Resource Index: {id}</p>
        </div>
      </header>

      <ProductForm initialData={product} id={id} />
    </div>
  );
}