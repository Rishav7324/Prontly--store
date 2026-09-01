'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUser, useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
  Package,
  Layers,
  X,
  Sparkles
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import Link from 'next/link';
import { logAdminAction } from '@/lib/admin-logs';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { adminJsonFetcher, adminFetch } from '@/lib/auth/admin-fetch';

export default function AdminProducts() {
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useUser();
  const auth = useAuth();
  const queryClient = useQueryClient();

  const { data: allProducts = [], isLoading: loading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => adminJsonFetcher('/api/products'),
    refetchInterval: 15000,
  });

  const processedProducts = useMemo(() => {
    return [...(allProducts as any[])]
      .filter(p =>
        (p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categorySlug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.slug?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
        return dateB - dateA;
      });
  }, [allProducts, searchTerm]);

  const deleteProduct = async (id: string, name: string) => {
    if (!user || !confirm(`Permanently delete "${name}" from the store catalog?`)) return;
    try {
      const token = auth?.currentUser ? await auth.currentUser.getIdToken() : '';
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok && res.status !== 404) throw new Error('Delete failed');
      logAdminAction({
        adminId: user.uid, adminEmail: user.email || 'unknown',
        action: 'DELETE', resourceType: 'PRODUCT', resourceId: id, details: { name }
      });
      toast({ title: "Product Deleted", description: `${name} has been removed.` });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } catch (e) {
      toast({ variant: "destructive", title: "Operation Failed", description: "Could not remove product from database." });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold text-accent mb-1.5 uppercase">
            CATALOG MANAGEMENT
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-headline">
            Products Catalog
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage, publish, and price digital assets, prompts, and templates.
          </p>
        </div>

        <Button asChild size="sm" className="h-10 rounded-2xl px-4 text-xs font-bold bg-zinc-950 text-white hover:bg-zinc-800 shadow-md active:scale-[0.98] transition-all">
          <Link href="/admin/products/new">
            <Plus className="mr-1.5 h-4 w-4" />
            Add New Product
          </Link>
        </Button>
      </div>

      {/* Main card */}
      <Card className="rounded-3xl border border-border/80 bg-white shadow-xs overflow-hidden">
        
        {/* Search header bar */}
        <CardHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products by title, slug, category…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9.5 pr-8 h-10 rounded-2xl bg-white border-border/80 text-xs focus-visible:ring-1 focus-visible:ring-accent shadow-2xs"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <p className="text-xs text-muted-foreground font-medium shrink-0">
              Showing {processedProducts.length} of {allProducts.length} products
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 w-full animate-pulse bg-muted rounded-2xl" />
              ))}
            </div>
          ) : processedProducts.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="px-6 py-3.5 text-xs font-bold text-muted-foreground w-20">Preview</TableHead>
                      <TableHead className="px-6 py-3.5 text-xs font-bold text-muted-foreground">Product Name</TableHead>
                      <TableHead className="px-6 py-3.5 text-xs font-bold text-muted-foreground">URL Slug</TableHead>
                      <TableHead className="px-6 py-3.5 text-xs font-bold text-muted-foreground">Price</TableHead>
                      <TableHead className="px-6 py-3.5 text-xs font-bold text-muted-foreground">Downloads</TableHead>
                      <TableHead className="px-6 py-3.5 text-right text-xs font-bold text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedProducts.map((product: any) => (
                      <TableRow key={product.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="px-6 py-3.5">
                          <div className="relative h-15 w-12 aspect-[4/5] rounded-xl bg-muted overflow-hidden border border-border/70 shadow-2xs">
                            <Image
                              src={product.images?.[0] || 'https://picsum.photos/seed/placeholder/100/100'}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-3.5">
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-xs sm:text-sm font-bold text-foreground line-clamp-1 max-w-[280px]">
                              {product.name}
                            </span>
                            <Badge variant="secondary" className="text-[10px] font-semibold bg-accent/10 text-accent px-2 py-0.5 rounded-full capitalize">
                              {product.categorySlug || 'Asset'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-3.5">
                          <code className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md font-mono border border-border/50">
                            /{product.slug}
                          </code>
                        </TableCell>
                        <TableCell className="px-6 py-3.5 text-sm font-extrabold tabular-nums text-foreground font-headline">
                          ₹{((product.price || 0) / 100).toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="px-6 py-3.5 text-xs font-semibold text-muted-foreground tabular-nums">
                          {product.salesCount || 0} sales
                        </TableCell>
                        <TableCell className="px-6 py-3.5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8.5 w-8.5 rounded-xl border border-transparent hover:border-border/70">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-2xl p-1.5 shadow-lg border-border/80">
                              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">Options</DropdownMenuLabel>
                              <DropdownMenuItem asChild className="rounded-xl text-xs font-medium cursor-pointer p-2">
                                <Link href={`/admin/products/edit/${product.slug}`} className="flex items-center gap-2">
                                  <Edit className="h-4 w-4 text-accent" /> Edit Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild className="rounded-xl text-xs font-medium cursor-pointer p-2">
                                <Link href={`/products/${product.slug}`} target="_blank" className="flex items-center gap-2">
                                  <ExternalLink className="h-4 w-4 text-muted-foreground" /> Storefront Preview
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="rounded-xl cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive text-xs font-semibold p-2"
                                onClick={() => deleteProduct(product.id, product.name)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Product
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-border/60">
                {processedProducts.map((product: any) => (
                  <div key={product.id} className="p-4 space-y-3 hover:bg-muted/30 transition-colors">
                    <div className="flex gap-3.5">
                      <div className="relative h-16 w-16 rounded-xl bg-muted overflow-hidden border border-border/70 shrink-0">
                        <Image
                          src={product.images?.[0] || 'https://picsum.photos/seed/placeholder/100/100'}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-accent">{product.categorySlug || 'Asset'}</span>
                        <h3 className="text-xs font-bold text-foreground line-clamp-1 leading-snug">{product.name}</h3>
                        <p className="text-sm font-extrabold text-foreground font-headline">
                          ₹{((product.price || 0) / 100).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                      <span className="text-muted-foreground text-[11px] font-mono">/{product.slug}</span>
                      <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm" className="h-8 rounded-xl text-xs px-2.5">
                          <Link href={`/admin/products/edit/${product.slug}`}>Edit</Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="h-8 rounded-xl text-xs px-2.5">
                          <Link href={`/products/${product.slug}`} target="_blank">Preview</Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl text-destructive hover:bg-destructive/10"
                          onClick={() => deleteProduct(product.id, product.name)}
                          aria-label="Delete product"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-56 flex-col items-center justify-center text-center p-8">
              <Package className="h-12 w-12 text-muted-foreground mb-3 opacity-25" />
              <h3 className="text-sm font-bold text-foreground">No Products Found</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                {searchTerm ? 'Try tweaking your search query.' : 'Get started by creating your first digital asset.'}
              </p>
              <Button asChild size="sm" className="mt-4 rounded-xl text-xs font-semibold bg-zinc-950 text-white">
                <Link href="/admin/products/new">Create Product</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
