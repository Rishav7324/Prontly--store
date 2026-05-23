'use client';

import { useMemo, useState, useEffect } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Package, 
  ExternalLink, 
  Settings, 
  LogOut, 
  LayoutDashboard, 
  ShoppingBag, 
  Loader2, 
  Sparkles, 
  Activity, 
  Clock, 
  FileCode,
  TrendingUp,
  ShieldCheck,
  History
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { format } from 'date-fns';
import { getDownloadUrl } from '@/app/actions/r2-actions';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { user, profile, loading: userLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Real-time Orders Query
  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );
  }, [db, user]);

  const { data: rawOrders, loading: ordersLoading } = useCollection(ordersQuery);

  // Client-side sorting for real-time reactivity without index delays
  const sortedOrders = useMemo(() => {
    if (!rawOrders) return [];
    return [...rawOrders].sort((a: any, b: any) => {
      const dateA = a.createdAt?.toMillis?.() || 0;
      const dateB = b.createdAt?.toMillis?.() || 0;
      return dateB - dateA;
    });
  }, [rawOrders]);

  const handleSignOut = async () => {
    if (auth) await signOut(auth);
  };

  const handleDownload = async (productId: string, productName: string) => {
    if (!db) return;
    setDownloadingId(productId);
    try {
      const prodSnap = await getDoc(doc(db, 'products', productId));
      if (!prodSnap.exists()) throw new Error("Asset missing");
      
      const product = prodSnap.data();
      if (!product.fileKey) {
        toast({ variant: "destructive", title: "Asset Unavailable", description: "No source file linked to this asset." });
        return;
      }

      const { url } = await getDownloadUrl(product.fileKey);
      window.open(url, '_blank');
      toast({ title: "Secure Download Initiated", description: `Unpacking ${productName}...` });
    } catch (error) {
      toast({ variant: "destructive", title: "Security Block", description: "You don't have authorization for this file." });
    } finally {
      setDownloadingId(null);
    }
  };

  // Map orders to unique library items
  const libraryItems = useMemo(() => {
    if (!sortedOrders) return [];
    const itemsMap = new Map();
    sortedOrders.forEach((order: any) => {
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
  }, [sortedOrders]);

  // Dynamic Statistics derived from real-time profile
  const stats = useMemo(() => {
    if (!profile) return { spent: 0, count: 0 };
    return {
      spent: (profile.totalSpent || 0) / 100,
      count: profile.orderCount || 0
    };
  }, [profile]);

  if (userLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <div className="text-center max-w-sm">
          <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold font-headline mb-4">Account Required</h1>
          <p className="text-muted-foreground mb-8">Please sign in to access your digital downloads and purchase history.</p>
          <Button asChild size="lg" className="w-full rounded-2xl h-14 font-bold text-lg"><Link href="/login">Sign In</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16 flex-1">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Sidebar Stats & Profile */}
          <aside className="w-full lg:w-80 space-y-8">
            <div className="p-8 rounded-[2.5rem] bg-card/40 border border-white/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                <Sparkles className="h-24 w-24 text-primary" />
              </div>
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <span className="font-bold text-primary text-xl">{profile?.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight truncate max-w-[150px]">{profile?.displayName || 'Creator'}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{profile?.role || 'Verified Member'}</p>
                </div>
              </div>
              
              <div className="space-y-4 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">Portfolio Value</span>
                  </div>
                  <span className="font-bold text-primary">₹{stats.spent.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4 text-accent" />
                    <span className="text-xs font-medium text-muted-foreground">Licenses Owned</span>
                  </div>
                  <span className="font-bold">{libraryItems.length}</span>
                </div>
              </div>

              <div className="mt-8 space-y-2">
                <Button variant="secondary" className="w-full justify-start gap-4 h-12 rounded-xl bg-primary/10 text-primary hover:bg-primary/20">
                  <LayoutDashboard className="h-4 w-4" /> Overview
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-4 h-12 rounded-xl text-muted-foreground hover:text-foreground" asChild>
                  <Link href="/dashboard/settings"><Settings className="h-4 w-4" /> Account Settings</Link>
                </Button>
                <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start gap-4 h-12 rounded-xl text-destructive hover:bg-destructive/10">
                  <LogOut className="h-4 w-4" /> Sign Out
                </Button>
              </div>
            </div>

            <Card className="rounded-[2.5rem] border-white/5 bg-card/30 p-6 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <ShieldCheck className="h-16 w-16" />
              </div>
              <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-4">Account Health</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Verification</span>
                  <span className="text-green-500 font-bold flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Fully Verified
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="font-medium">{profile?.createdAt ? format(new Date(profile.createdAt), 'MMM yyyy') : 'Recently'}</span>
                </div>
              </div>
            </Card>
          </aside>

          {/* Main Dashboard Content */}
          <main className="flex-1 space-y-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <Badge variant="outline" className="mb-4 border-primary/50 text-primary uppercase tracking-widest px-3 py-1 font-bold text-[10px]">Creator Dashboard Active</Badge>
                <h1 className="text-5xl font-bold font-headline leading-tight">Your Library.</h1>
                <p className="text-xl text-muted-foreground mt-2">Access your perpetual digital licenses and source files.</p>
              </div>
              <Button asChild size="lg" className="rounded-2xl h-14 px-8 shadow-xl shadow-primary/20"><Link href="/products">Browse New Assets</Link></Button>
            </header>

            {/* Digital Library Grid */}
            <section className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                  <FileCode className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold font-headline">Assets & Downloads</h2>
              </div>

              {ordersLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => <Card key={i} className="h-32 animate-pulse bg-muted rounded-3xl" />)}
                </div>
              ) : libraryItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {libraryItems.map((item: any) => (
                    <Card key={item.productId} className="overflow-hidden bg-card/40 border-white/5 group hover:border-primary/30 transition-all rounded-[2rem] p-6">
                      <div className="flex items-center gap-6">
                        <div className="relative h-20 w-20 rounded-2xl overflow-hidden flex-shrink-0 bg-muted border border-white/5">
                          <Image src={`https://picsum.photos/seed/${item.productId}/200/200`} alt="Product" fill className="object-cover transition-transform group-hover:scale-110" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-lg truncate group-hover:text-primary transition-colors">{item.productName}</h4>
                          </div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Acquired {item.purchaseDate ? format(new Date(item.purchaseDate.toDate()), 'MMM dd, yyyy') : 'Recently'}
                          </p>
                          <div className="mt-4 flex items-center gap-2">
                             <Button 
                              size="sm" 
                              variant="secondary" 
                              className="rounded-xl h-10 px-6 gap-2 font-bold bg-white/5 hover:bg-primary hover:text-white transition-all"
                              onClick={() => handleDownload(item.productId, item.productName)}
                              disabled={downloadingId === item.productId}
                            >
                              {downloadingId === item.productId ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                              Download Files
                            </Button>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" asChild title="View Listing">
                              <Link href={`/products/${item.productId}`}><ExternalLink className="h-4 w-4" /></Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="bg-muted/10 border-dashed border-2 p-20 flex flex-col items-center text-center rounded-[3rem] border-white/10">
                  <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <Package className="h-8 w-8 text-muted-foreground opacity-20" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Your library is empty</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto mb-8">Unlock professional AI prompts and UI kits to accelerate your creative output.</p>
                  <Button asChild size="lg" className="rounded-2xl px-12 h-14 font-bold shadow-lg"><Link href="/products">Explore Trending Assets</Link></Button>
                </div>
              )}
            </section>

            {/* Recent Orders Section */}
            <section className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <History className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold font-headline">Recent Transactions</h2>
              </div>
              
              <div className="rounded-[2.5rem] border border-white/5 overflow-hidden bg-card/30 backdrop-blur-md shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-white/5">
                      <tr>
                        <th className="px-8 py-5 text-left font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Order ID</th>
                        <th className="px-8 py-5 text-left font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Date</th>
                        <th className="px-8 py-5 text-left font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Status</th>
                        <th className="px-8 py-5 text-right font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Amount</th>
                        <th className="px-8 py-5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sortedOrders?.map((order: any) => (
                        <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-8 py-6 font-code text-primary uppercase text-xs font-bold tracking-widest">#{order.id?.slice(-8)}</td>
                          <td className="px-8 py-6 text-muted-foreground font-medium">
                            {order.createdAt ? format(new Date(order.createdAt.toDate()), 'MMM dd, yyyy') : 'N/A'}
                          </td>
                          <td className="px-8 py-6">
                            <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-none text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-lg">
                              {order.status}
                            </Badge>
                          </td>
                          <td className="px-8 py-6 text-right font-headline font-bold text-base">₹{(order.total / 100).toLocaleString('en-IN')}</td>
                          <td className="px-8 py-6 text-right">
                            <Button variant="ghost" size="sm" className="rounded-xl gap-2 text-[10px] uppercase font-bold border-white/10 opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                              <Link href={`/dashboard/orders/${order.id}`}>
                                View Receipt
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {!ordersLoading && (!sortedOrders || sortedOrders.length === 0) && (
                        <tr>
                          <td colSpan={5} className="px-8 py-20 text-center text-muted-foreground italic font-medium">You haven't made any purchases yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}