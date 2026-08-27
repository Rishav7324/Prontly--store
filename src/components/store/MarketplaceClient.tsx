"use client";

import { useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductGrid } from '@/components/store/ProductGrid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Search,
  X,
  LayoutGrid,
  ArrowUpDown,
  Zap,
  Clock,
  Star,
  Package,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface MarketplaceClientProps {
  initialProducts: any[];
  initialCategories: any[];
}

export function MarketplaceClient({ initialProducts, initialCategories }: MarketplaceClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryFilter = searchParams.get('category');
  const tagFilter = searchParams.get('tag');
  const searchQuery = searchParams.get('q');
  const [sortOrder, setSortOrder] = useState<'newest' | 'price-low' | 'price-high' | 'popular'>('newest');

  const products = initialProducts;
  const categories = initialCategories;

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let result = [...products];
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(term) ||
          p.shortDescription?.toLowerCase().includes(term) ||
          p.tags?.some((t: string) => t.toLowerCase().includes(term))
      );
    }
    if (categoryFilter) result = result.filter((p) => p.categorySlug === categoryFilter);
    if (tagFilter) result = result.filter((p) => p.tags?.includes(tagFilter));
    switch (sortOrder) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        result.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
        break;
      default:
        break;
    }
    return result;
  }, [products, categoryFilter, searchQuery, tagFilter, sortOrder]);

  const popularTags = useMemo(() => {
    if (!products) return [];
    const counts: Record<string, number> = {};
    products.forEach((p) => p.tags?.forEach((t: string) => (counts[t] = (counts[t] || 0) + 1)));
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name]) => name);
  }, [products]);

  const clearFilters = () => router.push('/products');
  const removeFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : '/products');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 min-w-0">
      {/* ── SIDEBAR ──────────────────────────────── */}
      <aside className="w-full lg:w-60 shrink-0 space-y-6">
        {/* Categories */}
        <div>
          <h3 className="text-xs font-semibold mb-3 px-1">Categories</h3>
          <div className="space-y-1">
            <Link
              href="/products"
              className={cn(
                'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                !categoryFilter ? 'bg-accent text-white' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="flex items-center gap-2">
                <LayoutGrid className="h-3.5 w-3.5" /> All Assets
              </span>
              <span className="text-[10px] opacity-60">{products.length}</span>
            </Link>
            {categories?.map((cat: any) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                  categoryFilter === cat.slug ? 'bg-accent text-white' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm leading-none">{cat.iconEmoji}</span> {cat.name}
                </span>
                <span className="text-[10px] opacity-60">{products.filter((p) => p.categorySlug === cat.slug).length}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Tags */}
        {popularTags.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold mb-3 px-1">Popular Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {popularTags.map((tag) => (
                <Link
                  key={tag}
                  href={`/products?tag=${encodeURIComponent(tag)}${categoryFilter ? `&category=${categoryFilter}` : ''}`}
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      'rounded-full text-[11px] font-medium px-2.5 py-1 cursor-pointer transition-colors',
                      tagFilter === tag ? 'bg-zinc-900 text-white border-zinc-900' : 'hover:border-accent hover:text-accent'
                    )}
                  >
                    {tag}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Info card */}
        <div className="rounded-xl border bg-muted/40 p-4 space-y-2 hidden lg:block">
          <p className="text-xs font-semibold flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-accent" /> Instant Delivery
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Pay once, download instantly. Perpetual license with lifetime updates.
          </p>
        </div>
      </aside>

      {/* ── MAIN ───────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Link href="/" className="hover:text-foreground">Home</Link>
              <span>/</span>
              <span className="text-foreground font-medium">Catalog</span>
              {categoryFilter && (
                <>
                  <span>/</span>
                  <span className="text-accent capitalize">{categoryFilter}</span>
                </>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              {searchQuery ? (
                <>
                  Search: <span className="text-accent">"{searchQuery}"</span>
                </>
              ) : categoryFilter ? (
                <span className="capitalize">{categories?.find((c: any) => c.slug === categoryFilter)?.name || categoryFilter}</span>
              ) : (
                'All Products'
              )}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
              {categoryFilter || tagFilter || searchQuery ? ' • filtered' : ' • verified quality'}
            </p>
          </div>

          <div className="flex items-center gap-1 bg-muted rounded-lg p-1 shrink-0">
            {([
              ['newest', 'Recent', Clock],
              ['popular', 'Popular', Star],
              ['price-low', 'Price', ArrowUpDown],
            ] as const).map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setSortOrder(id)}
                className={cn(
                  'inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  sortOrder === id ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Active filters */}
        {(categoryFilter || tagFilter || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 py-3 border-y">
            <span className="text-xs text-muted-foreground mr-1">Filters:</span>
            {categoryFilter && (
              <Badge variant="secondary" className="gap-1 pr-1 rounded-full text-xs font-medium">
                {categoryFilter}
                <button onClick={() => removeFilter('category')} className="ml-1 h-4 w-4 rounded-full hover:bg-black/10 flex items-center justify-center">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {tagFilter && (
              <Badge variant="secondary" className="gap-1 pr-1 rounded-full text-xs font-medium">
                #{tagFilter}
                <button onClick={() => removeFilter('tag')} className="ml-1 h-4 w-4 rounded-full hover:bg-black/10 flex items-center justify-center">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary" className="gap-1 pr-1 rounded-full text-xs font-medium">
                "{searchQuery}"
                <button onClick={() => removeFilter('q')} className="ml-1 h-4 w-4 rounded-full hover:bg-black/10 flex items-center justify-center">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <button onClick={clearFilters} className="text-xs font-medium text-destructive hover:underline ml-2">
              Clear all
            </button>
          </div>
        )}

        {/* Grid */}
        <ProductGrid products={filteredProducts} />

        {/* Empty */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-16 rounded-xl border border-dashed bg-muted/30">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-sm">No products found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">Try adjusting your search or filters to find what you're looking for.</p>
            <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4 h-8 rounded-lg text-xs">
              Clear filters
            </Button>
          </div>
        )}

        {/* Footer */}
        {filteredProducts.length > 0 && (
          <div className="pt-8 border-t flex flex-col items-center gap-2 text-center">
            <p className="text-xs text-muted-foreground">
              Showing {filteredProducts.length} of {products.length} products • End of catalog
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
