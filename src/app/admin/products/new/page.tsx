'use client';

import { ProductForm } from '@/components/admin/ProductForm';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Button variant="outline" size="icon" asChild className="h-9 w-9 rounded-lg bg-background">
          <Link href="/admin/products"><ChevronLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-lg md:text-xl font-semibold">New Product</h1>
          <p className="text-xs text-muted-foreground mt-0.5">List a new digital asset in your marketplace.</p>
        </div>
      </header>

      <ProductForm />
    </div>
  );
}
