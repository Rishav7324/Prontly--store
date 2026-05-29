
'use client';

import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: any[];
  loading?: boolean;
}

export function ProductGrid({ products, loading }: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-[480px] rounded-[2rem] bg-porcelain-white animate-pulse border border-stone-gray/10" />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-32 border-2 border-dashed rounded-[3rem] bg-porcelain-white/50 border-stone-gray/20">
        <p className="text-slate-blue font-medium">No digital assets matching your parameters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
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
