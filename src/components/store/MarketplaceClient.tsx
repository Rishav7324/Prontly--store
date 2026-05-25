'use client';

import { useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductGrid } from '@/components/store/ProductGrid';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, QueryConstraint } from 'firebase/firestore';
import { Filter, SlidersHorizontal, ChevronRight, LayoutGrid, List, Search, Loader2, Tag as TagIcon, X } from 'lucide-react';
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
  const db = useFirestore();
  
  // Real-time categories for dynamic counts
  const categoriesQuery = useMemoFirebase(() => {
    return db ? collection(db, 'categories') : null;
  }, [db]);
  const { data: realTimeCategories } = useCollection(categoriesQuery);
  const categories = realTimeCategories || initialCategories;

  // Fetch Products with optional filtering
  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    const constraints: QueryConstraint[] = [];
    
    if (categoryFilter) {
      constraints.push(where('categorySlug', '==', categoryFilter));
    }
    
    if (!searchQuery) {
      constraints.push(orderBy('createdAt', 'desc'));
    }
    
    return query(collection(db, 'products'), ...constraints);
  }, [db, categoryFilter, searchQuery]);

  const { data: realTimeProducts, loading } = useCollection(productsQuery);
  const products = realTimeProducts || initialProducts;

  // Client-side filtering for tags and search query
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let result = products;

    if (tagFilter) {
      result = result.filter(p => p.tags?.includes(tagFilter));
    }

    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.shortDescription?.toLowerCase().includes(term) ||
        p.tags?.some((t: string) => t.toLowerCase().includes(term))
      );
    }
    
    return result;
  }, [products, searchQuery, tagFilter]);

  // Derive top tags from products
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
      .slice(0, 10)
      .map(([name]) => name);
  }, [products]);

  const removeTag = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('tag');
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-8 md:flex-row">
      {/* Sidebar / Filters */}
      <aside className="w-full md:w-64 space-y-10 flex-shrink-0">
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Categories</h3>
            <div className="space-y-1">
              <Button 
                asChild 
                variant={!categoryFilter ? "secondary" : "ghost"} 
                className="w-full justify-start font-medium h-9 rounded-lg"
              >
                <Link href="/products">All Assets</Link>
              </Button>
              {categories?.map((cat: any) => (
                <Button 
                  key={cat.id}
                  asChild 
                  variant={categoryFilter === cat.slug ? "secondary" : "ghost"} 
                  className="w-full justify-start font-medium h-9 rounded-lg"
                >
                  <Link href={`/products?category=${cat.slug}`}>
                    <span className="mr-2">{cat.iconEmoji}</span> {cat.name}
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          {popularTags.length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <TagIcon className="h-3 w-3" />
                Popular Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {popularTags.map(tag => (
                  <Link 
                    key={tag} 
                    href={`/products?${new URLSearchParams({ ...Object.fromEntries(searchParams.entries()), tag }).toString()}`}
                  >
                    <Badge 
                      variant={tagFilter === tag ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer hover:bg-primary hover:text-white transition-colors py-1 px-3 border-white/10",
                        tagFilter === tag ? "bg-primary text-white" : "bg-white/5 text-muted-foreground"
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

        <Card className="bg-primary/5 border-primary/20 rounded-2xl">
          <CardContent className="pt-6">
            <h4 className="font-bold mb-2">B2B GST Support</h4>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">Need a GST invoice for your business? All our premium assets are eligible for input tax credit.</p>
            <Button variant="link" className="p-0 text-primary h-auto text-xs font-bold uppercase tracking-widest">Learn More</Button>
          </CardContent>
        </Card>
      </aside>

      {/* Main Content */}
      <div className="flex-1 space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Link href="/" className="hover:text-foreground">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">Marketplace</span>
              {categoryFilter && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <span className="capitalize">{categoryFilter}</span>
                </>
              )}
            </div>
            <h1 className="text-4xl font-bold font-headline">
              {searchQuery ? `Results for "${searchQuery}"` : (
                categoryFilter ? (
                  categories?.find((c: any) => c.slug === categoryFilter)?.name || categoryFilter
                ) : "Digital Inventory"
              )}
            </h1>
            
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {tagFilter && (
                <Badge className="bg-primary/20 text-primary border-primary/30 py-1.5 px-4 gap-2 rounded-full font-bold">
                  Tag: {tagFilter}
                  <button onClick={removeTag}><X className="h-3 w-3" /></button>
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="outline" className="py-1.5 px-4 gap-2 rounded-full border-white/10">
                  Search: {searchQuery}
                  <Link href="/products"><X className="h-3 w-3" /></Link>
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 rounded-full border-white/10">
              <SlidersHorizontal className="h-4 w-4" />
              Sort
            </Button>
          </div>
        </header>

        <ProductGrid products={filteredProducts} loading={loading && products.length === 0} />
        
        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-32 bg-muted/10 border-dashed border-2 rounded-[3rem] border-white/5">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-6 opacity-20" />
            <h3 className="text-2xl font-bold font-headline">No matching assets</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">Try adjusting your filters, removing tags, or searching for broader keywords.</p>
            <Button variant="outline" asChild className="mt-8 rounded-full px-8 border-white/10">
              <Link href="/products">Reset All Filters</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
