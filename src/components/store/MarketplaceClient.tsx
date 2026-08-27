"use client";

import { useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductGrid } from '@/components/store/ProductGrid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, X, LayoutGrid, ArrowUpDown, Zap, Clock, Star } from 'lucide-react';
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
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-7 min-w-0">
      {/* ── SIDEBAR ──────────────────────────────── */}
      <aside className="w-full lg:w-[220px] shrink-0 space-y-5">
        {/* Categories — compact vertical nav */}
        <div className="rounded-lg border border-border/60 bg-white shadow-sm p-3">
          <h3 className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground px-1 mb-2">
            Categories
          </h3>
          <nav className="space-y-0.5">
            <Link
              href="/products"
              className={cn(
                'flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
                !categoryFilter
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <span className="flex items-center gap-2">
                <LayoutGrid className="h-3.5 w-3.5 shrink-0" /> All Assets
              </span>
              <span className="text-[10px] leading-none tabular-nums opacity-60">{products.length}</span>
            </Link>
            {categories?.map((cat: any) => {
              const count = products.filter((p) => p.categorySlug === cat.slug).length;
              const active = categoryFilter === cat.slug;
              return (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className={cn(
                    'flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
                    active
                      ? 'bg-zinc-900 text-white shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-[13px] leading-none shrink-0">{cat.iconEmoji}</span>
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <span className="text-[10px] leading-none tabular-nums opacity-60 shrink-0 ml-2">{count}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Tags — small pills */}
        {popularTags.length > 0 && (
          <div className="rounded-lg border border-border/60 bg-white shadow-sm p-3">
            <h3 className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground px-1 mb-2">
              Popular Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {popularTags.map((tag) => (
                <Link
                  key={tag}
                  href={`/products?tag=${encodeURIComponent(tag)}${categoryFilter ? `&category=${categoryFilter}` : ''}`}
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      'rounded-full text-[11px] font-medium px-2.5 py-0.5 cursor-pointer transition-colors border-border/60',
                      tagFilter === tag
                        ? 'bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800 hover:text-white'
                        : 'bg-white hover:border-zinc-900 hover:text-zinc-900'
                    )}
                  >
                    {tag}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Info card — compact */}
        <div className="rounded-lg border border-border/60 bg-muted/30 p-3 hidden lg:block">
          <p className="text-xs font-semibold flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-accent" /> Instant Delivery
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
            Pay once, download instantly. Perpetual license with lifetime updates.
          </p>
        </div>
      </aside>

      {/* ── MAIN ───────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Header — breadcrumb + title + sort pills */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="min-w-0">
            <nav className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1.5 flex-wrap">
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <span className="opacity-40">/</span>
              <Link href="/products" className="hover:text-foreground transition-colors">
                Catalog
              </Link>
              {categoryFilter && (
                <>
                  <span className="opacity-40">/</span>
                  <span className="text-foreground font-medium capitalize">{categoryFilter}</span>
                </>
              )}
              {tagFilter && (
                <>
                  <span className="opacity-40">/</span>
                  <span className="text-foreground font-medium">#{tagFilter}</span>
                </>
              )}
            </nav>
            <h1 className="text-lg md:text-xl font-bold tracking-tight leading-tight">
              {searchQuery ? (
                <>
                  Search: <span className="text-accent">"{searchQuery}"</span>
                </>
              ) : categoryFilter ? (
                <span className="capitalize">
                  {categories?.find((c: any) => c.slug === categoryFilter)?.name || categoryFilter}
                </span>
              ) : (
                'All Products'
              )}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
              {categoryFilter || tagFilter || searchQuery ? ' • filtered' : ' • verified quality'}
            </p>
          </div>

          {/* Sort pills — small */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1 shrink-0 self-start sm:self-auto">
            {([
              ['newest', 'Recent', Clock],
              ['popular', 'Popular', Star],
              ['price-low', 'Price', ArrowUpDown],
            ] as const).map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setSortOrder(id)}
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                  sortOrder === id
                    ? 'bg-white shadow-sm text-foreground border border-border/60'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Active filters — removable badges */}
        {(categoryFilter || tagFilter || searchQuery) && (
          <div className="flex flex-wrap items-center gap-1.5 py-2.5 border-y border-border/60">
            <span className="text-[11px] font-medium text-muted-foreground mr-1">Filters:</span>
            {categoryFilter && (
              <Badge
                variant="secondary"
                className="gap-1 pr-1 rounded-full text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 h-6"
              >
                <span className="pl-1 capitalize">{categoryFilter}</span>
                <button
                  onClick={() => removeFilter('category')}
                  aria-label="Remove category filter"
                  className="ml-1 h-4 w-4 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {tagFilter && (
              <Badge
                variant="secondary"
                className="gap-1 pr-1 rounded-full text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 h-6"
              >
                <span className="pl-1">#{tagFilter}</span>
                <button
                  onClick={() => removeFilter('tag')}
                  aria-label="Remove tag filter"
                  className="ml-1 h-4 w-4 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {searchQuery && (
              <Badge
                variant="secondary"
                className="gap-1 pr-1 rounded-full text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 h-6"
              >
                <span className="pl-1">"{searchQuery}"</span>
                <button
                  onClick={() => removeFilter('q')}
                  aria-label="Remove search filter"
                  className="ml-1 h-4 w-4 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <button
              onClick={clearFilters}
              className="text-xs font-medium text-muted-foreground hover:text-destructive ml-1 underline-offset-2 hover:underline transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Grid */}
        <ProductGrid products={filteredProducts} />

        {/* Empty — compact */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-10 rounded-lg border border-dashed border-border/60 bg-muted/20">
            <div className="mx-auto h-10 w-10 rounded-full bg-white border border-border/60 shadow-sm flex items-center justify-center mb-2.5">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-sm">No products found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Try adjusting your search or filters to find what you're looking for.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="mt-3 h-7 rounded-lg text-xs border-border/60"
            >
              Clear filters
            </Button>
          </div>
        )}

        {/* Footer — minimal */}
        {filteredProducts.length > 0 && (
          <div className="pt-4 border-t border-border/60 flex justify-center">
            <p className="text-[11px] text-muted-foreground">
              Showing {filteredProducts.length} of {products.length} products
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
