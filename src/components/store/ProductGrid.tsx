'use client';

import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: any[];
  loading?: boolean;
}

export function ProductGrid({ products, loading }: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-[280px] sm:h-[320px] rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed rounded-[2rem] sm:rounded-3xl bg-muted/20">
        <p className="text-muted-foreground text-sm">No assets found in this collection.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
      {products.map((product: any) => (
        <ProductCard 
          key={product.id} 
          id={product.id}
          title={product.name}
          price={`₹${(product.price / 100).toLocaleString('en-IN')}`}
          priceRaw={product.price}
          compareAtPrice={product.compareAtPrice}
          category={product.categorySlug || 'Asset'}
          imageUrl={product.images?.[0] || 'https://picsum.photos/seed/placeholder/600/400'}
          rating={product.averageRating || 5.0}
          sales={product.salesCount?.toString() || '0'}
        />
      ))}
    </div>
  );
}
