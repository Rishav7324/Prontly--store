"use client";

import { useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductGrid } from '@/components/store/ProductGrid';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Filter, 
  SlidersHorizontal, 
  ChevronRight, 
  Search, 
  Tag as TagIcon, 
  X, 
  LayoutGrid, 
  ArrowUpDown,
  Zap,
  Info,
  ExternalLink,
  Loader2,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

  // Optimized Filtering Logic
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let result = [...products];

    // Search logic
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name?.toLowerCase().includes(term) || 
        p.shortDescription?.toLowerCase().includes(term) ||
        p.tags?.some((t: string) => t.toLowerCase().includes(term))
      );
    }

    // Category logic
    if (categoryFilter) {
      result = result.filter(p => p.categorySlug === categoryFilter);
    }

    // Tag logic
    if (tagFilter) {
      result = result.filter(p => p.tags?.includes(tagFilter));
    }

    // Sorting logic
    switch (sortOrder) {
      case 'price-low': result.sort((a, b) => a.price - b.price); break;
      case 'price-high': result.sort((a, b) => b.price - a.price); break;
      case 'popular': result.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0)); break;
      case 'newest': 
      default:
        // Already handled by server fetch usually, but secondary sort here
        break;
    }
    
    return result;
  }, [products, categoryFilter, searchQuery, tagFilter, sortOrder]);

  const popularTags = useMemo(() => {
    if (!products) return [];
    const counts: Record<string, number> = {};
    products.forEach(p => {
      p.tags?.forEach((t: string) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name]) => name);
  }, [products]);

  const clearFilters = () => {
    router.push('/products');
  };

  const removeFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-12 lg:flex-row">
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-full lg:w-72 space-y-12 flex-shrink-0">
        <div className="space-y-10">
          {/* Categories */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="h-1 w-4 bg-primary rounded-full" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-midnight-ink">Categories</h3>
            </div>
            <div className="space-y-1.5">
              <Button 
                asChild 
                variant="ghost" 
                className={cn(
                  "w-full justify-start h-10 rounded-xl px-4 text-xs font-bold transition-all",
                  !categoryFilter ? "bg-primary/5 text-primary border border-primary/10" : "text-slate-blue hover:bg-muted/50"
                )}
              >
                <Link href="/products" className="flex items-center justify-between">
                  <span className="flex items-center gap-3"><LayoutGrid className="h-4 w-4" /> All Assets</span>
                  <span className="text-[9px] opacity-40">{products.length}</span>
                </Link>
              </Button>
              {categories?.map((cat: any) => (
                <Button 
                  key={cat.id}
                  asChild 
                  variant="ghost" 
                  className={cn(
                    "w-full justify-start h-10 rounded-xl px-4 text-xs font-bold transition-all",
                    categoryFilter === cat.slug ? "bg-primary/5 text-primary border border-primary/10" : "text-slate-blue hover:bg-muted/50"
                  )}
                >
                  <Link href={`/products?category=${cat.slug}`} className="flex items-center justify-between">
                    <span className="flex items-center gap-3"><span className="text-base grayscale group-hover:grayscale-0">{cat.iconEmoji}</span> {cat.name}</span>
                    <span className="text-[9px] opacity-40">
                      {products.filter(p => p.categorySlug === cat.slug).length}
                    </span>
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          {/* Metadata Index (Tags) */}
          {popularTags.length > 0 && (
            <div>
               <div className="flex items-center gap-2 mb-6">
                <div className="h-1 w-4 bg-slate-200 rounded-full" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-midnight-ink">Market Index</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularTags.map(tag => (
                  <Link 
                    key={tag} 
                    href={`/products?${new URLSearchParams({ ...Object.fromEntries(searchParams.entries()), tag }).toString()}`}
                  >
                    <Badge 
                      variant="outline"
                      className={cn(
                        "cursor-pointer transition-all py-1.5 px-3 rounded-lg border-stone-gray/10 text-[10px] font-bold uppercase tracking-tight",
                        tagFilter === tag 
                          ? "bg-midnight-ink text-white border-midnight-ink shadow-lg scale-105" 
                          : "bg-white text-slate-blue hover:border-primary/30 hover:text-primary"
                      )}
                    >
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Enterprise Solutions */}
        <Card className="bg-midnight-ink text-white rounded-[2rem] overflow-hidden border-none shadow-2xl relative group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap className="h-16 w-16" />
          </div>
          <CardContent className="p-8 space-y-5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white/10 rounded-full">
               <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
               <span className="text-[8px] font-black uppercase tracking-widest">Enterprise Support</span>
            </div>
            <div className="space-y-2">
              <h4 className="font-headline text-xl font-bold leading-tight">Custom Solutions.</h4>
              <p className="text-[11px] text-white/60 leading-relaxed font-medium">Need specialized licensing or bulk seat synchronization for your professional team?</p>
            </div>
            <Button variant="outline" className="w-full h-10 border-white/20 hover:bg-white hover:text-midnight-ink rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all">
              Launch Inquiry
            </Button>
          </CardContent>
        </Card>
      </aside>

      {/* 2. PRODUCT CATALOG TERMINAL */}
      <div className="flex-1 space-y-10">
        <header className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <nav className="flex items-center gap-2 text-[9px] font-black text-ghost-gray uppercase tracking-widest mb-1 opacity-60">
                <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                <ChevronRight className="h-2.5 w-2.5" />
                <span className="text-midnight-ink">Catalog</span>
                {categoryFilter && (
                  <>
                    <ChevronRight className="h-2.5 w-2.5" />
                    <span className="text-primary">{categoryFilter}</span>
                  </>
                )}
              </nav>
              <h1 className="text-3xl md:text-5xl font-bold font-headline tracking-tighter text-midnight-ink">
                {searchQuery ? `Search: "${searchQuery}"` : (
                  categoryFilter ? (
                    categories?.find((c: any) => c.slug === categoryFilter)?.name || categoryFilter
                  ) : "Product Catalog."
                )}
              </h1>
              <p className="text-sm text-slate-blue font-medium">Verified source files for professional creation.</p>
            </div>

            <div className="flex items-center gap-3">
               <div className="bg-muted/50 rounded-xl p-1 flex border border-stone-gray/5 shadow-inner">
                  {[
                    { id: 'newest', label: 'Recent', icon: Clock },
                    { id: 'popular', label: 'Hot', icon: Zap },
                    { id: 'price-low', label: 'Value', icon: ArrowUpDown },
                  ].map((opt) => (
                    <Button
                      key={opt.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => setSortOrder(opt.id as any)}
                      className={cn(
                        "h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest gap-2 transition-all",
                        sortOrder === opt.id ? "bg-white text-primary shadow-sm" : "text-ghost-gray hover:text-midnight-ink"
                      )}
                    >
                      <opt.icon className="h-3 w-3" />
                      {opt.label}
                    </Button>
                  ))}
               </div>
            </div>
          </div>

          {/* ACTIVE FILTER LEDGER */}
          {(categoryFilter || tagFilter || searchQuery) && (
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-stone-gray/5">
               <span className="text-[10px] font-black uppercase text-ghost-gray tracking-widest mr-2">Active Filters:</span>
               
               {categoryFilter && (
                 <Badge className="bg-primary/5 text-primary border border-primary/20 h-8 pl-3 pr-1.5 rounded-xl font-bold gap-2">
                   Category: {categoryFilter}
                   <button onClick={() => removeFilter('category')} className="h-5 w-5 rounded-lg hover:bg-primary/10 flex items-center justify-center transition-colors"><X className="h-3 w-3" /></button>
                 </Badge>
               )}
               
               {tagFilter && (
                 <Badge className="bg-midnight-ink/5 text-midnight-ink border border-midnight-ink/10 h-8 pl-3 pr-1.5 rounded-xl font-bold gap-2">
                   Tag: {tagFilter}
                   <button onClick={() => removeFilter('tag')} className="h-5 w-5 rounded-lg hover:bg-midnight-ink/10 flex items-center justify-center transition-colors"><X className="h-3 w-3" /></button>
                 </Badge>
               )}
               
               {searchQuery && (
                 <Badge className="bg-deep-violet/5 text-deep-violet border border-deep-violet/10 h-8 pl-3 pr-1.5 rounded-xl font-bold gap-2">
                   Query: {searchQuery}
                   <Link href="/products" className="h-5 w-5 rounded-lg hover:bg-deep-violet/10 flex items-center justify-center transition-colors"><X className="h-3 w-3" /></Link>
                 </Badge>
               )}

               <Button variant="ghost" onClick={clearFilters} className="text-[9px] font-black uppercase text-rose-500 tracking-widest h-8 px-3 rounded-xl hover:bg-rose-50">
                 Clear Filters
               </Button>

               <div className="ml-auto text-[9px] font-black uppercase tracking-widest text-ghost-gray opacity-40">
                  {filteredProducts.length} Results Logged
               </div>
            </div>
          )}
        </header>

        <ProductGrid products={filteredProducts} />
        
        {/* EMPTY STATE TERMINAL */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-40 bg-muted/10 border-dashed border-2 rounded-[3.5rem] border-stone-gray/10 shadow-inner">
            <div className="h-24 w-24 rounded-[2.5rem] bg-white flex items-center justify-center mx-auto mb-8 shadow-xl border border-stone-gray/5">
              <Search className="h-10 w-10 text-ghost-gray opacity-20" />
            </div>
            <h3 className="text-3xl font-bold font-headline text-midnight-ink mb-4">No matching products.</h3>
            <p className="text-slate-blue text-sm max-w-sm mx-auto leading-relaxed mb-10">Your current parameters returned zero matches. Adjust your filters or explore our full catalog.</p>
            <Button variant="outline" onClick={clearFilters} className="rounded-xl h-12 px-10 border-stone-gray/20 font-bold text-xs uppercase tracking-widest hover:bg-midnight-ink hover:text-white transition-all shadow-sm">
              Reset Product Feed
            </Button>
          </div>
        )}

        {/* FEED FOOTER */}
        {filteredProducts.length > 0 && (
           <div className="pt-20 border-t border-stone-gray/5 flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                 <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-ghost-gray">End of Catalog</span>
                 <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              </div>
              <p className="text-xs text-muted-foreground italic">Verified for professional production standards.</p>
           </div>
        )}
      </div>
    </div>
  );
}