'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
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
  Package,
  Zap
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
  const db = useFirestore();
  
  // CRITICAL: We remove the server-side orderBy to prevent document exclusion due to missing fields.
  // We handle sorting on the client-side for maximum resilience.
  const productsQuery = useMemoFirebase(() => {
    return db ? collection(db, 'products') : null;
  }, [db]);

  const { data: allProducts, loading } = useCollection(productsQuery);

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
    if (!db || !user || !confirm('Permanently remove this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      await logAdminAction({
        db, adminId: user.uid, adminEmail: user.email || 'unknown',
        action: 'DELETE', resourceType: 'PRODUCT', resourceId: id, details: { name }
      });
      toast({ title: "Product Purged" });
    } catch (e) {
      toast({ variant: "destructive", title: "Operation Failed" });
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline text-midnight-ink">Product Inventory</h1>
          <p className="text-muted-foreground">Managing verified digital assets and catalog index.</p>
        </div>
        <Button asChild className="rounded-xl shadow-lg shadow-primary/20">
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </header>

      <Card className="rounded-[2rem] border-white/5 bg-card/30 overflow-hidden shadow-sm">
        <CardHeader className="p-4 border-b border-white/5">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search by name, slug, or category..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-11 bg-background/50 rounded-xl border-white/5"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 w-full animate-pulse bg-muted rounded-2xl" />
              ))}
            </div>
          ) : processedProducts.length > 0 ? (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-white/5">
                  <TableHead className="w-20 pl-8">Preview</TableHead>
                  <TableHead>Product Title</TableHead>
                  <TableHead>SEO Slug</TableHead>
                  <TableHead>Value (INR)</TableHead>
                  <TableHead className="text-right pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedProducts.map((product: any) => (
                  <TableRow key={product.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                    <TableCell className="pl-8">
                      <div className="relative h-12 w-12 rounded-xl bg-muted overflow-hidden border border-white/5">
                        <Image 
                          src={product.images?.[0] || 'https://picsum.photos/seed/placeholder/100/100'} 
                          alt={product.name} 
                          fill 
                          className="object-cover" 
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-midnight-ink">{product.name}</span>
                        <Badge variant="outline" className="w-fit text-[9px] uppercase font-black tracking-widest mt-1 border-primary/20 text-primary">
                          {product.categorySlug || 'Asset'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded font-mono">
                        /{product.slug}
                      </code>
                    </TableCell>
                    <TableCell className="font-headline font-bold text-lg tabular-nums">
                      ₹{(product.price / 100).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-xl">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-card border-white/10 rounded-2xl p-2 shadow-2xl">
                          <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest p-3">Admin Terminal</DropdownMenuLabel>
                          <DropdownMenuItem asChild className="rounded-xl focus:bg-primary/10 focus:text-primary p-3 cursor-pointer">
                            <Link href={`/admin/products/edit/${product.slug}`} className="flex items-center">
                              <Edit className="mr-3 h-4 w-4" /> Modify Product
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="rounded-xl focus:bg-primary/10 focus:text-primary p-3 cursor-pointer">
                            <Link href={`/products/${product.slug}`} target="_blank" className="flex items-center">
                              <ExternalLink className="mr-3 h-4 w-4" /> Live Preview
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/5" />
                          <DropdownMenuItem 
                            className="rounded-xl focus:bg-destructive/10 focus:text-destructive p-3 cursor-pointer text-destructive"
                            onClick={() => deleteProduct(product.id, product.name)}
                          >
                            <Trash2 className="mr-3 h-4 w-4" /> Purge Record
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-60 flex-col items-center justify-center text-center p-8">
              <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-10" />
              <h3 className="text-xl font-bold font-headline">Catalog Empty</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">Start defining your digital inventory to begin the marketplace cycle.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}