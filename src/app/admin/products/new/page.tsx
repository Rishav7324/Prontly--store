
'use client';

import { ProductForm } from '@/components/admin/ProductForm';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewProductPage() {
  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/products"><ChevronLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-headline">Add New Product</h1>
          <p className="text-muted-foreground">List a new digital asset in your marketplace.</p>
        </div>
      </header>

      <ProductForm />
    </div>
  );
}
