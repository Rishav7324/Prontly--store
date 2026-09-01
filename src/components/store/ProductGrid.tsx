'use client';

import { ProductCard } from './ProductCard';
import { PackageSearch } from 'lucide-react';

export function ProductGrid({ products, loading }: { products: any[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 min-w-0 max-w-full">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden border border-border/60 bg-white shadow-xs">
            <div className="aspect-[4/5] bg-muted/60 animate-pulse" />
            <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-3 w-14 sm:w-16 bg-muted rounded-md animate-pulse" />
                <div className="h-3 w-6 sm:w-8 bg-muted rounded-md animate-pulse" />
              </div>
              <div className="h-3.5 sm:h-4 w-full bg-muted rounded-md animate-pulse" />
              <div className="h-3 w-3/4 bg-muted rounded-md animate-pulse" />
              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <div className="h-4 w-12 sm:w-16 bg-muted rounded-md animate-pulse" />
                <div className="h-7 w-7 sm:h-8 sm:w-8 bg-muted rounded-lg sm:rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border/80 bg-muted/20 flex flex-col items-center justify-center">
        <div className="h-12 w-12 rounded-2xl bg-white border border-border/60 shadow-xs flex items-center justify-center mb-3">
          <PackageSearch className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-foreground">No digital assets found</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs text-center">
          We couldn't find any products matching your current criteria. Try adjusting your search query or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 min-w-0 max-w-full">
      {products.map((product: any) => (
        <ProductCard
          key={product.id}
          id={product.id}
          slug={product.slug}
          title={product.name}
          price={`₹${(product.price / 100).toLocaleString('en-IN')}`}
          priceRaw={product.price}
          compareAtPrice={product.compareAtPrice}
          category={product.categorySlug || 'Asset'}
          images={product.images || []}
          rating={product.averageRating || 5.0}
          reviewCount={product.reviewCount || 0}
          shortDescription={product.shortDescription}
          isFeatured={product.isFeatured}
        />
      ))}
    </div>
  );
}
