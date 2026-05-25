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
  History,
  AlertCircle,
  ChevronRight
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useUser, useCollection, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { user, profile, loading: userLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'orders'), where('userId', '==', user.uid));
  }, [db, user]);

  const { data: rawOrders, loading: ordersLoading } = useCollection(ordersQuery);

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
              </div>

              <div className="mt-8 space-y-2">
                <Button variant="secondary" className="w-full justify-start gap-4 h-12 rounded-xl bg-primary/10 text-primary hover:bg-primary/20">
                  <LayoutDashboard className="h-4 w-4" /> Overview
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-4 h-12 rounded-xl text-muted-foreground hover:text-foreground" asChild>
                  <Link href="/dashboard/downloads"><Download className="h-4 w-4" /> My Downloads</Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-4 h-12 rounded-xl text-muted-foreground hover:text-foreground" asChild>
                  <Link href="/dashboard/settings"><Settings className="h-4 w-4" /> Account Settings</Link>
                </Button>
                <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start gap-4 h-12 rounded-xl text-destructive hover:bg-destructive/10">
                  <LogOut className="h-4 w-4" /> Sign Out
                </Button>
              </div>
            </div>
          </aside>

          <main className="flex-1 space-y-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <Badge variant="outline" className="mb-4 border-primary/50 text-primary uppercase tracking-widest px-3 py-1 font-bold text-[10px]">Active Hub</Badge>
                <h1 className="text-5xl font-bold font-headline leading-tight">Welcome Home.</h1>
                <p className="text-xl text-muted-foreground mt-2">Manage your purchases and access your digital inventory.</p>
              </div>
              <Button asChild size="lg" className="rounded-2xl h-14 px-8 shadow-xl shadow-primary/20"><Link href="/dashboard/downloads">Go to Downloads Library <ChevronRight className="ml-2 h-4 w-4" /></Link></Button>
            </header>

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
                      {ordersLoading ? (
                        [1,2,3].map(i => <tr key={i} className="animate-pulse"><td colSpan={5} className="h-16 bg-white/5"></td></tr>)
                      ) : sortedOrders?.map((order: any) => (
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
                      {!ordersLoading && sortedOrders.length === 0 && (
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