'use client';

import { ProductCard } from './ProductCard';

export function ProductGrid({ products, loading }: { products: any[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4 min-w-0 max-w-full">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="rounded-lg overflow-hidden border border-border/60 bg-white shadow-sm">
            <div className="aspect-[3/4] bg-muted animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="h-2 w-12 bg-muted rounded animate-pulse" />
              <div className="h-3 w-full bg-muted rounded animate-pulse" />
              <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
              <div className="flex items-center justify-between pt-2">
                <div className="h-3.5 w-14 bg-muted rounded animate-pulse" />
                <div className="h-7 w-7 bg-muted rounded-md animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div className="text-center py-10 rounded-lg border border-dashed border-border/60 bg-muted/20">
        <p className="text-xs font-medium text-muted-foreground">No products found.</p>
        <p className="text-[11px] text-muted-foreground/70 mt-1">Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4 min-w-0 max-w-full">
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
