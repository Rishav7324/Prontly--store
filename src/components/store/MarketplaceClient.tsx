"use client";

import { useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductGrid } from '@/components/store/ProductGrid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  X, 
  LayoutGrid, 
  ArrowUpDown, 
  Zap, 
  Clock, 
  Star, 
  SlidersHorizontal,
  Layers,
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface MarketplaceClientProps {
  initialProducts: any[];
  initialCategories: any[];
}

export function MarketplaceClient({ initialProducts, initialCategories }: MarketplaceClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryFilter = searchParams.get('category');
  const tagFilter = searchParams.get('tag');
  const searchQuery = searchParams.get('q') || '';
  const [internalSearch, setInternalSearch] = useState(searchQuery);
  const [sortOrder, setSortOrder] = useState<'newest' | 'price-low' | 'price-high' | 'popular'>('newest');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const products = initialProducts || [];
  const categories = initialCategories || [];

  const filteredProducts = useMemo(() => {
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
    const counts: Record<string, number> = {};
    products.forEach((p) => p.tags?.forEach((t: string) => (counts[t] = (counts[t] || 0) + 1)));
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name]) => name);
  }, [products]);

  const clearFilters = () => {
    setInternalSearch('');
    router.push('/products');
  };

  const removeFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : '/products');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (internalSearch.trim()) {
      params.set('q', internalSearch.trim());
    } else {
      params.delete('q');
    }
    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : '/products');
  };

  const activeCategory = categories.find((c: any) => c.slug === categoryFilter);

  return (
    <div className="space-y-6">
      {/* ── TOP HEADER & BREADCRUMB ──────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-border/50">
        <div className="space-y-1.5">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3 opacity-40" />
            <Link href="/products" className="hover:text-foreground transition-colors">
              Marketplace
            </Link>
            {activeCategory && (
              <>
                <ChevronRight className="h-3 w-3 opacity-40" />
                <span className="text-foreground font-semibold">{activeCategory.name}</span>
              </>
            )}
            {tagFilter && (
              <>
                <ChevronRight className="h-3 w-3 opacity-40" />
                <span className="text-foreground font-semibold">#{tagFilter}</span>
              </>
            )}
          </nav>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-headline">
            {searchQuery ? (
              <>
                Search results for <span className="text-accent">"{searchQuery}"</span>
              </>
            ) : activeCategory ? (
              <span className="flex items-center gap-2">
                <span>{activeCategory.iconEmoji}</span> {activeCategory.name}
              </span>
            ) : (
              'Digital Assets & Templates'
            )}
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'verified asset' : 'verified assets'} available for instant download
          </p>
        </div>

        {/* Search & Mobile Filter Toggle */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search catalog…"
              value={internalSearch}
              onChange={(e) => setInternalSearch(e.target.value)}
              className="w-full h-9.5 bg-white border-border/70 rounded-xl pl-8.5 pr-8 text-xs focus-visible:ring-1 focus-visible:ring-accent"
            />
            {internalSearch && (
              <button
                type="button"
                onClick={() => {
                  setInternalSearch('');
                  removeFilter('q');
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </form>

          {/* Mobile Filter Sheet Trigger */}
          <div className="lg:hidden shrink-0">
            <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-9.5 rounded-xl border-border/80 px-3.5 gap-1.5 text-xs font-semibold">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filters
                  {(categoryFilter || tagFilter) && (
                    <span className="h-2 w-2 rounded-full bg-accent" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-[320px] bg-white p-5 overflow-y-auto">
                <SheetHeader className="pb-4 border-b">
                  <SheetTitle className="text-base font-bold flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" /> Filter Marketplace
                  </SheetTitle>
                </SheetHeader>

                <div className="py-4 space-y-6">
                  {/* Category Filter list */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Categories</h4>
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          removeFilter('category');
                          setIsMobileFilterOpen(false);
                        }}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors',
                          !categoryFilter ? 'bg-zinc-950 text-white' : 'text-muted-foreground hover:bg-muted'
                        )}
                      >
                        <span>All Categories</span>
                        <span className="text-[10px] opacity-70">{products.length}</span>
                      </button>
                      {categories.map((cat: any) => {
                        const count = products.filter((p) => p.categorySlug === cat.slug).length;
                        const active = categoryFilter === cat.slug;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => {
                              const params = new URLSearchParams(searchParams.toString());
                              params.set('category', cat.slug);
                              router.push(`/products?${params.toString()}`);
                              setIsMobileFilterOpen(false);
                            }}
                            className={cn(
                              'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors',
                              active ? 'bg-zinc-950 text-white font-semibold' : 'text-muted-foreground hover:bg-muted'
                            )}
                          >
                            <span className="flex items-center gap-2 truncate">
                              <span>{cat.iconEmoji}</span>
                              <span className="truncate">{cat.name}</span>
                            </span>
                            <span className="text-[10px] opacity-70">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Popular Tags */}
                  {popularTags.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {popularTags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => {
                              const params = new URLSearchParams(searchParams.toString());
                              params.set('tag', tag);
                              router.push(`/products?${params.toString()}`);
                              setIsMobileFilterOpen(false);
                            }}
                            className={cn(
                              'text-xs px-2.5 py-1 rounded-full border transition-colors',
                              tagFilter === tag
                                ? 'bg-zinc-950 text-white border-zinc-950 font-semibold'
                                : 'bg-muted/40 border-border/70 text-muted-foreground hover:border-zinc-950'
                            )}
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sort Order in mobile */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Sort By</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ['newest', 'Newest'],
                        ['popular', 'Most Popular'],
                        ['price-low', 'Price: Low'],
                        ['price-high', 'Price: High'],
                      ].map(([id, label]) => (
                        <button
                          key={id}
                          onClick={() => {
                            setSortOrder(id as any);
                            setIsMobileFilterOpen(false);
                          }}
                          className={cn(
                            'px-3 py-2 rounded-xl text-xs font-medium border text-center transition-colors',
                            sortOrder === id ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-white border-border/70 text-muted-foreground'
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(categoryFilter || tagFilter || searchQuery) && (
                    <Button 
                      variant="outline" 
                      className="w-full text-xs font-semibold rounded-xl text-destructive border-destructive/20 hover:bg-destructive/10"
                      onClick={() => {
                        clearFilters();
                        setIsMobileFilterOpen(false);
                      }}
                    >
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* ── MOBILE HORIZONTAL CATEGORY PILLS ────────────── */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
        <Link
          href="/products"
          className={cn(
            'shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border',
            !categoryFilter
              ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
              : 'bg-white border-border/70 text-muted-foreground hover:border-zinc-900 hover:text-foreground'
          )}
        >
          All Assets ({products.length})
        </Link>
        {categories.map((cat: any) => {
          const active = categoryFilter === cat.slug;
          return (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className={cn(
                'shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                active
                  ? 'bg-zinc-950 text-white border-zinc-950 font-semibold shadow-xs'
                  : 'bg-white border-border/70 text-muted-foreground hover:border-zinc-900 hover:text-foreground'
              )}
            >
              <span>{cat.iconEmoji}</span>
              <span>{cat.name}</span>
            </Link>
          );
        })}
      </div>

      {/* ── MAIN CONTENT (SIDEBAR + GRID) ────────────────── */}
      <div className="flex flex-col lg:flex-row gap-7 min-w-0">
        
        {/* ── DESKTOP SIDEBAR ────────────────────────────── */}
        <aside className="hidden lg:block w-[240px] shrink-0 space-y-5">
          {/* Categories Navigation */}
          <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-xs">
            <h3 className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground px-1 mb-2.5 flex items-center justify-between">
              <span>Categories</span>
              <span className="text-[10px] font-semibold">{categories.length}</span>
            </h3>
            <nav className="space-y-1">
              <Link
                href="/products"
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all',
                  !categoryFilter
                    ? 'bg-zinc-950 text-white shadow-xs'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                )}
              >
                <span className="flex items-center gap-2">
                  <LayoutGrid className="h-3.5 w-3.5" /> All Assets
                </span>
                <span className="text-[10px] tabular-nums opacity-70">{products.length}</span>
              </Link>
              {categories.map((cat: any) => {
                const count = products.filter((p) => p.categorySlug === cat.slug).length;
                const active = categoryFilter === cat.slug;
                return (
                  <Link
                    key={cat.id}
                    href={`/products?category=${cat.slug}`}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all',
                      active
                        ? 'bg-zinc-950 text-white font-semibold shadow-xs'
                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                    )}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="text-sm leading-none shrink-0">{cat.iconEmoji}</span>
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <span className="text-[10px] tabular-nums opacity-70 shrink-0 ml-2">{count}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Popular Tag Cloud */}
          {popularTags.length > 0 && (
            <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-xs">
              <h3 className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground px-1 mb-2.5">
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
                        'rounded-full text-[11px] font-medium px-2.5 py-1 cursor-pointer transition-all border-border/70',
                        tagFilter === tag
                          ? 'bg-zinc-950 text-white border-zinc-950 font-semibold'
                          : 'bg-muted/30 hover:border-zinc-900 hover:bg-white'
                      )}
                    >
                      #{tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Value Guarantee Card */}
          <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-amber-500/5 via-violet-500/5 to-transparent p-4">
            <p className="text-xs font-bold flex items-center gap-1.5 text-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Lifetime Guarantee
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
              One-time payment with instant Cloudflare R2 downloads and 30-day money-back guarantee.
            </p>
          </div>
        </aside>

        {/* ── PRODUCTS MAIN COLUMN ───────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">
          
          {/* Sorting and Active Filter Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-border/60 shadow-xs">
            
            {/* Active Filter Badges */}
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              <span className="text-xs font-semibold text-muted-foreground mr-1">Active:</span>
              {!categoryFilter && !tagFilter && !searchQuery && (
                <span className="text-xs text-muted-foreground font-medium">All products shown</span>
              )}
              {categoryFilter && (
                <Badge
                  variant="secondary"
                  className="gap-1 pr-1.5 rounded-full text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 h-7"
                >
                  <span className="pl-1 capitalize">{activeCategory?.name || categoryFilter}</span>
                  <button
                    onClick={() => removeFilter('category')}
                    aria-label="Remove category filter"
                    className="ml-1 h-4 w-4 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {tagFilter && (
                <Badge
                  variant="secondary"
                  className="gap-1 pr-1.5 rounded-full text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 h-7"
                >
                  <span className="pl-1">#{tagFilter}</span>
                  <button
                    onClick={() => removeFilter('tag')}
                    aria-label="Remove tag filter"
                    className="ml-1 h-4 w-4 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {searchQuery && (
                <Badge
                  variant="secondary"
                  className="gap-1 pr-1.5 rounded-full text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 h-7"
                >
                  <span className="pl-1">"{searchQuery}"</span>
                  <button
                    onClick={() => removeFilter('q')}
                    aria-label="Remove search filter"
                    className="ml-1 h-4 w-4 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {(categoryFilter || tagFilter || searchQuery) && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-semibold text-muted-foreground hover:text-destructive ml-2 underline underline-offset-2 transition-colors"
                >
                  Reset all
                </button>
              )}
            </div>

            {/* Desktop Sort Pills */}
            <div className="hidden sm:flex items-center gap-1 bg-muted/60 p-1 rounded-xl shrink-0">
              {([
                ['newest', 'Newest', Clock],
                ['popular', 'Popular', Star],
                ['price-low', 'Price: Low', ArrowUpDown],
                ['price-high', 'Price: High', ArrowUpDown],
              ] as const).map(([id, label, Icon]) => (
                <button
                  key={id}
                  onClick={() => setSortOrder(id)}
                  className={cn(
                    'inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all',
                    sortOrder === id
                      ? 'bg-white shadow-xs text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-3 w-3 opacity-70" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid Layout */}
          <ProductGrid products={filteredProducts} />

          {/* Empty search state */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-border/80 bg-muted/20">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-white border border-border/60 shadow-xs flex items-center justify-center mb-3">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-base text-foreground">No matches found</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
                We couldn't find any products matching your current combination of filters.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="mt-4 h-9 rounded-xl text-xs font-semibold border-border/80 hover:bg-muted"
              >
                Clear all filters
              </Button>
            </div>
          )}

          {/* Product Count Footer */}
          {filteredProducts.length > 0 && (
            <div className="pt-6 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
              <p>Showing {filteredProducts.length} of {products.length} assets</p>
              <p className="flex items-center gap-1 font-medium">
                <Zap className="h-3.5 w-3.5 text-amber-500" /> Instant fulfillment enabled
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
