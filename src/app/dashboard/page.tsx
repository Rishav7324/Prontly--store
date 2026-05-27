'use client';

import { useMemo, useState, useEffect } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Settings, 
  LogOut, 
  LayoutDashboard, 
  ShoppingBag, 
  Loader2, 
  Sparkles, 
  Clock, 
  TrendingUp,
  History,
  ChevronRight,
  ShieldCheck,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { useUser, useCollection, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { format } from 'date-fns';

/**
 * @fileOverview Main Customer Dashboard Terminal.
 * Displays pre-aggregated metrics (LTV, Order Count) from the user profile for speed.
 */
export default function Dashboard() {
  const { user, profile, loading: userLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();

  // Real-time Recent Transactions Feed
  // Note: We avoid orderBy here to prevent mandatory composite index requirements in production
  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'orders'), 
      where('userId', '==', user.uid),
      limit(50)
    );
  }, [db, user]);

  const { data: recentOrders, loading: ordersLoading } = useCollection(ordersQuery);

  const handleSignOut = async () => {
    if (auth) await signOut(auth);
  };

  // Metrics are pre-aggregated on the server via transactions for 100% accuracy
  const stats = useMemo(() => {
    return {
      spent: (profile?.totalSpent || 0) / 100,
      count: profile?.orderCount || 0
    };
  }, [profile]);

  // Sort orders in memory to avoid indexing issues
  const sortedOrders = useMemo(() => {
    if (!recentOrders) return [];
    return [...recentOrders].sort((a: any, b: any) => {
      const dateA = a.createdAt?.toMillis?.() || a.createdAt?.seconds || 0;
      const dateB = b.createdAt?.toMillis?.() || b.createdAt?.seconds || 0;
      return dateB - dateA;
    }).slice(0, 10);
  }, [recentOrders]);

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
          <h1 className="text-2xl font-bold font-headline mb-4">Account Required</h1>
          <p className="text-muted-foreground mb-8">Please sign in to access your digital downloads and purchase history.</p>
          <Button asChild size="lg" className="w-full rounded-2xl h-14 font-bold text-lg shadow-xl shadow-primary/20"><Link href="/login">Sign In</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16 flex-1 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Dashboard Sidebar Navigation */}
          <aside className="w-full lg:w-80 space-y-8">
            <div className="p-8 rounded-[2.5rem] bg-card/40 border border-white/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                <Sparkles className="h-24 w-24 text-primary" />
              </div>
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <span className="font-bold text-primary text-xl uppercase">{profile?.displayName?.charAt(0) || user.email?.charAt(0)}</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-lg leading-tight truncate">{profile?.displayName || 'Creator'}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mt-1">Verified Member</p>
                </div>
              </div>
              
              <div className="space-y-4 pt-6 border-t border-white/5">
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Portfolio Value (LTV)</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-midnight-ink">₹{stats.spent.toLocaleString('en-IN')}</span>
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-2">
                <Button variant="secondary" className="w-full justify-start gap-4 h-11 rounded-xl bg-primary/10 text-primary hover:bg-primary/20">
                  <LayoutDashboard className="h-4 w-4" /> Overview
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-4 h-11 rounded-xl text-muted-foreground hover:text-foreground" asChild>
                  <Link href="/dashboard/downloads"><Download className="h-4 w-4" /> My Digital Library</Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-4 h-11 rounded-xl text-muted-foreground hover:text-foreground" asChild>
                  <Link href="/dashboard/settings"><Settings className="h-4 w-4" /> Account Center</Link>
                </Button>
                <div className="pt-4 mt-4 border-t border-white/5">
                  <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start gap-4 h-11 rounded-xl text-destructive hover:bg-destructive/10">
                    <LogOut className="h-4 w-4" /> End Session
                  </Button>
                </div>
              </div>
            </div>

            <Card className="rounded-[2rem] border-white/5 bg-primary/5 overflow-hidden">
              <CardContent className="p-8 text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center mx-auto shadow-sm">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Compliance Active</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">All your transactions are cryptographically verified and GST compliant.</p>
              </CardContent>
            </Card>
          </aside>

          {/* Main Dashboard Space */}
          <main className="flex-1 space-y-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <Badge variant="outline" className="border-primary/50 text-primary uppercase tracking-widest px-3 py-1 font-black text-[9px] bg-primary/5">Customer Engine v2.0</Badge>
                <h1 className="text-2xl md:text-4xl font-bold font-headline leading-tight">Workspace.</h1>
                <p className="text-sm text-muted-foreground">Manage your digital inventory and transaction ledger.</p>
              </div>
              <Button 
              asChild size="lg" className="rounded-2xl h-10  px-6 shadow-xl shadow-primary/20 group font-bold">
                <Link href="/dashboard/downloads">
                  Access Digital Vault 
                  <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </header>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card className="rounded-[2.5rem] border-white/5 bg-card/30 p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                  <ShoppingBag className="h-24 w-24 text-primary" />
                </div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2">Order Density</p>
                <h3 className="text-5xl font-sm text-midnight-ink">{stats.count} <span className="text-xl text-muted-foreground font-normal">Transactions</span></h3>
              </Card>
              <Card className="rounded-[2.5rem] border-white/5 bg-card/30 p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                  <TrendingUp className="h-24 w-24 text-primary" />
                </div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2">Net Acquisition</p>
                <h3 className="text-5xl font-bold font-headline">₹{stats.spent.toLocaleString('en-IN')}</h3>
              </Card>
            </div>

            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <History className="h-5 w-5" />
                  </div>
                  <h2 className="text-1xl font-bold ">Recent Purchase History</h2>
                </div>
                <Link href="/products" className="text-xs font-sm text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
                  Expand Inventory <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              
              <div className="rounded-[2.5rem] border border-white/5 overflow-hidden bg-card/30 backdrop-blur-md shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30 border-b border-white/5">
                      <tr>
                        <th className="px-6 py-5 text-left font-black uppercase tracking-widest text-[8px] text-muted-foreground">Reference</th>
                        <th className="px-6 py-5 text-left font-black uppercase tracking-widest text-[8px] text-muted-foreground">Execution Date</th>
                        <th className="px-6 py-5 text-left font-black uppercase tracking-widest text-[8px] text-muted-foreground">Status</th>
                        <th className="px-6 py-5 text-right font-black uppercase tracking-widest text-[8px] text-muted-foreground">Net Value</th>
                        <th className="px-6 py-5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {ordersLoading ? (
                        [1,2,3].map(i => <tr key={i} className="animate-pulse"><td colSpan={5} className="h-20 bg-white/5"></td></tr>)
                      ) : sortedOrders.map((order: any) => (
                        <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-8 py-6 font-mono text-primary uppercase text-xs font-bold tracking-widest">#{order.id?.slice(-8)}</td>
                          <td className="px-8 py-6 text-muted-foreground font-medium">
                            {order.createdAt ? format(new Date(order.createdAt.toMillis ? order.createdAt.toMillis() : order.createdAt), 'MMM dd, yyyy') : 'Recently'}
                          </td>
                          <td className="px-8 py-6">
                            <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-none text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-lg">
                              {order.status}
                            </Badge>
                          </td>
                          <td className="px-8 py-6 text-right font-headline font-bold text-xl">₹{(order.subtotal / 100).toLocaleString('en-IN')}</td>
                          <td className="px-8 py-6 text-right">
                            <Button variant="ghost" size="sm" className="rounded-xl gap-2 text-[10px] uppercase font-bold border border-white/10 hover:bg-primary hover:text-white transition-all shadow-sm" asChild>
                              <Link href={`/dashboard/orders/${order.id}`}>
                                Audit Receipt
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {!ordersLoading && sortedOrders.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-8 py-24 text-center text-muted-foreground italic font-medium">
                            No recorded transactions. Start building your library today.
                          </td>
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
