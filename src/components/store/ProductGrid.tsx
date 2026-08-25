'use client';

import { ProductCard } from './ProductCard';

export function ProductGrid({ products, loading }: { products: any[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:gap-5 lg:grid-cols-3 xl:grid-cols-4 min-w-0 max-w-full">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="rounded-lg overflow-hidden border border-border/50">
            <div className="aspect-[4/3] bg-muted animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="h-2.5 w-1/3 bg-muted rounded animate-pulse" />
              <div className="h-3 w-full bg-muted rounded animate-pulse" />
              <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-muted rounded animate-pulse mt-3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div className="text-center py-16 rounded-lg border border-dashed border-border bg-muted/30">
        <p className="text-sm text-muted-foreground">No products found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:gap-5 lg:grid-cols-3 xl:grid-cols-4 min-w-0 max-w-full">
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
