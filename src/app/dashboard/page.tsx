'use client';

import { useMemo, useState } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Package, ExternalLink, Settings, LogOut, LayoutDashboard, ShoppingBag, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useUser, useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { format } from 'date-fns';
import { getDownloadUrl } from '@/app/actions/r2-actions';
import { toast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const ordersQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [db, user]);

  const { data: orders, loading: ordersLoading } = useCollection(ordersQuery);

  const handleSignOut = async () => {
    if (auth) await signOut(auth);
  };

  const handleDownload = async (productId: string, productName: string) => {
    if (!db) return;
    setDownloadingId(productId);
    try {
      // 1. Fetch product to get the fileKey
      const prodSnap = await getDoc(doc(db, 'products', productId));
      if (!prodSnap.exists()) throw new Error("Product not found");
      
      const product = prodSnap.data();
      if (!product.fileKey) {
        toast({ variant: "destructive", title: "Asset Unavailable", description: "This product doesn't have a download file attached yet." });
        return;
      }

      // 2. Get signed URL from R2
      const { url } = await getDownloadUrl(product.fileKey);
      
      // 3. Trigger download
      window.open(url, '_blank');
      toast({ title: "Download Started", description: `Preparing ${productName}...` });
    } catch (error) {
      toast({ variant: "destructive", title: "Download Failed", description: "Could not retrieve your digital asset." });
    } finally {
      setDownloadingId(null);
    }
  };

  // Extract all purchased items for the "Library" section
  const libraryItems = useMemo(() => {
    if (!orders) return [];
    const itemsMap = new Map();
    orders.forEach((order: any) => {
      if (order.status !== 'paid' && order.status !== 'delivered') return;
      order.items?.forEach((item: any) => {
        if (!itemsMap.has(item.productId)) {
          itemsMap.set(item.productId, {
            ...item,
            purchaseDate: order.createdAt,
            orderId: order.id
          });
        }
      });
    });
    return Array.from(itemsMap.values());
  }, [orders]);

  const totalSpent = useMemo(() => {
    if (!orders) return 0;
    return orders.reduce((sum, order) => sum + (order.total || 0), 0);
  }, [orders]);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <h1 className="text-2xl font-bold mb-4">Please sign in to view your dashboard</h1>
        <Button asChild><Link href="/login">Sign In</Link></Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12 flex-1">
        <div className="flex flex-col md:flex-row gap-8">
          
          <aside className="w-full md:w-64 space-y-2">
            <Button variant="secondary" className="w-full justify-start gap-3 bg-primary/10 text-primary hover:bg-primary/20">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3" asChild>
              <Link href="/dashboard/settings"><Settings className="h-4 w-4" /> Settings</Link>
            </Button>
            <div className="pt-4 mt-4 border-t border-border">
              <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </aside>

          <main className="flex-1 space-y-8">
            <header>
              <h1 className="text-3xl font-bold font-headline capitalize">Welcome back, {user.displayName || 'Creator'}!</h1>
              <p className="text-muted-foreground">Manage your digital library and track your recent orders.</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Card className="bg-card border-white/5 shadow-xl">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold font-headline">{libraryItems.length}</div>
                  <div className="text-sm text-muted-foreground uppercase tracking-widest text-[10px] font-bold mt-1">Digital Assets</div>
                </CardContent>
              </Card>
              <Card className="bg-card border-white/5 shadow-xl">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold font-headline">₹{(totalSpent / 100).toLocaleString('en-IN')}</div>
                  <div className="text-sm text-muted-foreground uppercase tracking-widest text-[10px] font-bold mt-1">Total Spent</div>
                </CardContent>
              </Card>
              <Card className="bg-card border-white/5 shadow-xl">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold font-headline">{orders?.length || 0}</div>
                  <div className="text-sm text-muted-foreground uppercase tracking-widest text-[10px] font-bold mt-1">Orders Placed</div>
                </CardContent>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-bold font-headline">Your Digital Library</h2>
              {ordersLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(2)].map((_, i) => <Card key={i} className="h-24 animate-pulse bg-muted" />)}
                </div>
              ) : libraryItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {libraryItems.map((item: any) => (
                    <Card key={item.productId} className="overflow-hidden bg-card/50 border-white/5 group hover:border-primary/30 transition-all">
                      <div className="flex items-center p-4 gap-4">
                        <div className="relative h-16 w-16 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                          <Image src={`https://picsum.photos/seed/${item.productId}/200/200`} alt="Product" fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold truncate group-hover:text-primary transition-colors">{item.productName}</h4>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                            Purchased {item.purchaseDate ? format(new Date(item.purchaseDate.toDate()), 'MMM dd, yyyy') : 'Recently'}
                          </p>
                        </div>
                        <Button 
                          size="icon" 
                          variant="secondary" 
                          className="rounded-full flex-shrink-0 hover:bg-primary hover:text-white transition-all"
                          onClick={() => handleDownload(item.productId, item.productName)}
                          disabled={downloadingId === item.productId}
                        >
                          {downloadingId === item.productId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-muted/10 border-dashed border-2 p-12 flex flex-col items-center text-center rounded-3xl">
                  <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                  <p className="text-muted-foreground mb-6">You haven't purchased any assets yet.</p>
                  <Button asChild className="rounded-full px-8"><Link href="/products">Explore Marketplace</Link></Button>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-bold font-headline">Order History</h2>
              <div className="rounded-2xl border border-white/5 overflow-hidden bg-card/30">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-white/5">
                      <tr>
                        <th className="px-6 py-4 text-left font-bold uppercase tracking-tighter text-[10px]">Order ID</th>
                        <th className="px-6 py-4 text-left font-bold uppercase tracking-tighter text-[10px]">Date</th>
                        <th className="px-6 py-4 text-left font-bold uppercase tracking-tighter text-[10px]">Status</th>
                        <th className="px-6 py-4 text-left font-bold uppercase tracking-tighter text-[10px] text-right">Amount</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {orders?.map((order: any) => (
                        <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4 font-code text-primary uppercase text-xs">#{order.id?.slice(-8)}</td>
                          <td className="px-6 py-4 text-muted-foreground text-xs">
                            {order.createdAt ? format(new Date(order.createdAt.toDate()), 'MMM dd, yyyy') : 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/10 border-none text-[9px] uppercase font-bold">
                              {order.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right font-bold">₹{(order.total / 100).toLocaleString('en-IN')}</td>
                          <td className="px-6 py-4 text-right">
                            <Button variant="ghost" size="sm" className="gap-2 text-[10px] uppercase font-bold" asChild>
                              <Link href={`/dashboard/orders/${order.id}`}>
                                View Details
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {!ordersLoading && orders?.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">No orders found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
