'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useSqlCollection } from '@/hooks/useSqlCollection';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  ExternalLink,
  Package
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

export default function AdminProducts() {
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  
  // Always try SQL API first (dual-mode API returns Firestore if Neon not set)
  const productsQuery = useMemoFirebase(() => {
    return db ? collection(db, 'products') : null;
  }, [db]);

  const { data: sqlProducts, loading: sqlLoading } = useSqlCollection('/api/products');
  const { data: firestoreProducts, loading: firestoreLoading } = useCollection(!sqlProducts && !sqlLoading ? productsQuery : null);
  const allProducts = sqlProducts && sqlProducts.length > 0 ? (sqlProducts as any) : firestoreProducts;
  const loading = sqlLoading || (!sqlProducts && firestoreLoading);

  const processedProducts = useMemo(() => {
    if (!allProducts) return [];
    
    return [...allProducts]
      .filter(p => 
        (p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categorySlug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.slug?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a: any, b: any) => {
        const dateA = a.createdAt?.toMillis?.() || a.updatedAt?.toMillis?.() || 0;
        const dateB = b.createdAt?.toMillis?.() || b.updatedAt?.toMillis?.() || 0;
        return dateB - dateA;
      });
  }, [allProducts, searchTerm]);

  const deleteProduct = async (id: string, name: string) => {
    if (!user || !confirm('Permanently remove this product?')) return;
    try {
      // Try SQL API first (works for both SQL and Firestore fallback)
      const token = auth?.currentUser ? await auth.currentUser.getIdToken() : '';
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        // Fallback direct Firestore if API fails
        if (!db) throw new Error('No DB');
        const { deleteDoc, doc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'products', id));
      }
      // Log (dual-mode: will use SQL API if configured)
      if (db) {
        await logAdminAction({
          db, adminId: user.uid, adminEmail: user.email || 'unknown',
          action: 'DELETE', resourceType: 'PRODUCT', resourceId: id, details: { name }
        });
      }
      toast({ title: "Product Purged" });
      // Refetch
      window.location.reload();
    } catch (e) {
      toast({ variant: "destructive", title: "Operation Failed" });
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-semibold">Products</h1>
          <p className="text-xs text-muted-foreground">Managing verified digital assets and catalog index.</p>
        </div>
        <Button asChild size="sm" className="h-8 rounded-lg shadow-sm">
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </header>

      <Card className="rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="p-4 border-b">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search by name, slug, or category..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 rounded-lg"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse bg-muted rounded-lg" />
              ))}
            </div>
          ) : processedProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[640px]">
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-20 pl-4">Preview</TableHead>
                    <TableHead>Product Title</TableHead>
                    <TableHead>SEO Slug</TableHead>
                    <TableHead>Value (INR)</TableHead>
                    <TableHead className="text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedProducts.map((product: any) => (
                    <TableRow key={product.id} className="transition-colors group">
                      <TableCell className="pl-4 px-3 py-2">
                        <div className="relative h-9 w-9 rounded-lg bg-muted overflow-hidden border">
                          <Image 
                            src={product.images?.[0] || 'https://picsum.photos/seed/placeholder/100/100'} 
                            alt={product.name} 
                            fill 
                            className="object-cover" 
                          />
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <div className="flex flex-col items-start gap-1">
                          <span className="text-xs font-medium line-clamp-1 max-w-[220px]">{product.name}</span>
                          <Badge variant="outline" className="text-[10px] font-medium line-clamp-1 border-primary/20 text-primary px-1.5 py-0">
                            {product.categorySlug || 'Asset'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <code className="text-xs line-clamp-1 text-muted-foreground bg-muted/50 px-2 py-0.5 rounded font-mono">
                          /{product.slug}
                        </code>
                      </TableCell>
                      <TableCell className="text-xs font-semibold tabular-nums px-3 py-2">
                        ₹{(product.price / 100).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right pr-4 px-3 py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-[10px] font-medium text-muted-foreground p-2">Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild className="rounded-md text-xs cursor-pointer">
                              <Link href={`/admin/products/edit/${product.slug}`} className="flex items-center gap-2">
                                <Edit className="h-4 w-4" /> Edit Product
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="rounded-md text-xs cursor-pointer">
                              <Link href={`/products/${product.slug}`} target="_blank" className="flex items-center gap-2">
                                <ExternalLink className="h-4 w-4" /> Live Preview
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="rounded-md cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive text-xs"
                              onClick={() => deleteProduct(product.id, product.name)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-60 flex-col items-center justify-center text-center p-8">
              <Package className="h-10 w-10 text-muted-foreground mb-3 opacity-20" />
              <h3 className="text-sm font-semibold">Catalog Empty</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">Start defining your digital inventory to begin the marketplace cycle.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
