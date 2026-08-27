'use client';

import { useMemo, useState } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Settings,
  LogOut,
  LayoutDashboard,
  ShoppingBag,
  Loader2,
  TrendingUp,
  History,
  ChevronRight,
  ShieldCheck,
  ArrowUpRight,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { useUser, useAuth } from '@/firebase';
import { useQuery } from '@tanstack/react-query';
import { signOut } from 'firebase/auth';
import { format } from 'date-fns';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export interface OrderItem {
  productName: string;
  price: number;
  quantity: number;
  productId?: string;
}

export interface Order {
  id: string;
  status: 'pending' | 'paid' | 'delivered' | 'refunded' | 'failed';
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  createdAt: string;
  paidAt?: string | null;
  items: OrderItem[];
  couponCode?: string;
}

/**
 * @fileOverview Main Customer Dashboard Terminal.
 * Displays pre-aggregated metrics (LTV, Order Count) from the user profile for speed.
 * Premium compact: p-4, rounded-xl, shadow-sm, border-border/60, overflow-hidden,
 * pt-20 md:pt-24, small numbers, min-w table, drawer on mobile.
 */
export default function Dashboard() {
  const { user, profile, loading: userLoading } = useUser();
  const auth = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Recent Transactions Feed (Neon via API)
  const { data: recentOrders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['user-orders', user?.uid],
    enabled: !!user,
    refetchInterval: 15000,
    queryFn: async () => {
      if (!auth?.currentUser) throw new Error('Not authenticated');
      const token = await auth.currentUser.getIdToken();
      const res = await fetch('/api/user/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch orders');
      const json = await res.json();
      return json.data ?? [];
    },
  });

  const handleSignOut = async () => {
    if (auth) await signOut(auth);
  };

  // Metrics are pre-aggregated on the server for 100% accuracy
  const stats = useMemo(() => {
    return {
      spent: (profile?.totalSpent || 0) / 100,
      count: profile?.orderCount || 0
    };
  }, [profile]);

  // Sort orders in memory (API returns desc createdAt; defensive re-sort)
  const sortedOrders = useMemo(() => {
    if (!recentOrders) return [];
    return [...recentOrders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [recentOrders]);

  if (userLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <div className="text-center max-w-sm rounded-xl shadow-sm border border-border/60 bg-card p-6 overflow-hidden">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-sm font-semibold mb-1.5">Account Required</h1>
          <p className="text-xs text-muted-foreground mb-5">Please sign in to access your digital downloads and purchase history.</p>
          <Button asChild size="sm" className="w-full h-8 rounded-lg text-xs font-medium"><Link href="/login">Sign In</Link></Button>
        </div>
      </div>
    );
  }

  const SidebarNav = ({ onSelect }: { onSelect?: () => void }) => (
    <div className="space-y-4">
      <Card className="rounded-xl shadow-sm p-4 border border-border/60 overflow-hidden">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <span className="font-semibold text-primary text-xs">{profile?.displayName?.charAt(0) || user.email?.charAt(0)}</span>
          </div>
          <div className="min-w-0 overflow-hidden">
            <h3 className="text-sm font-semibold leading-tight truncate">{profile?.displayName || 'Creator'}</h3>
            <p className="text-[11px] font-medium text-muted-foreground">Verified member</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-primary/[0.04] border border-primary/10 mb-3 overflow-hidden">
          <p className="text-[11px] font-medium text-muted-foreground mb-1">Portfolio value (LTV)</p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-lg font-semibold tracking-tight truncate">₹{stats.spent.toLocaleString('en-IN')}</span>
            <TrendingUp className="h-3.5 w-3.5 text-primary shrink-0" />
          </div>
        </div>

        <nav className="space-y-0.5">
          <Button variant="secondary" size="sm" className="w-full justify-start gap-2.5 h-8 rounded-lg text-xs font-medium" onClick={() => onSelect?.()}>
            <LayoutDashboard className="h-3.5 w-3.5" /> Overview
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2.5 h-8 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground" asChild>
            <Link href="/dashboard/downloads" onClick={() => onSelect?.()}><Download className="h-3.5 w-3.5" /> My Digital Library</Link>
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2.5 h-8 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground" asChild>
            <Link href="/dashboard/settings" onClick={() => onSelect?.()}><Settings className="h-3.5 w-3.5" /> Account Center</Link>
          </Button>
          <div className="pt-2 mt-2 border-t border-border/60">
            <Button variant="ghost" size="sm" onClick={() => { onSelect?.(); handleSignOut(); }} className="w-full justify-start gap-2.5 h-8 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </Button>
          </div>
        </nav>
      </Card>

      <Card className="rounded-xl shadow-sm p-4 bg-primary/[0.04] border border-primary/15 overflow-hidden">
        <CardContent className="p-0 space-y-2.5 text-center">
          <div className="h-7 w-7 rounded-lg bg-white dark:bg-card flex items-center justify-center mx-auto shadow-sm border border-border/60">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-[11px] font-medium text-primary">Compliance active</p>
          <p className="text-xs text-muted-foreground leading-relaxed">All transactions are verified and GST compliant.</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <Navbar />

      <div className="container mx-auto px-4 pt-20 md:pt-24 pb-10 flex-1 max-w-7xl min-w-0">
        <div className="flex flex-col lg:flex-row gap-5 md:gap-6 min-w-0">
          {/* Mobile drawer trigger */}
          <div className="flex lg:hidden items-center justify-between gap-2">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 rounded-lg gap-2 text-xs font-medium border-border/60">
                  <Menu className="h-3.5 w-3.5" /> Menu
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-80 p-4 overflow-y-auto bg-card">
                <SidebarNav onSelect={() => setMobileNavOpen(false)} />
              </SheetContent>
            </Sheet>
            <Button asChild size="sm" className="h-8 rounded-lg text-xs font-medium">
              <Link href="/dashboard/downloads">Vault <ChevronRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>

          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-56 xl:w-60 shrink-0 min-w-0">
            <div className="sticky top-20 space-y-4">
              <SidebarNav />
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 min-w-0 space-y-5 overflow-hidden">
            <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div className="space-y-1.5 min-w-0">
                <Badge variant="outline" className="border-primary/30 text-primary px-2 py-0.5 text-[11px] font-medium bg-primary/[0.04] rounded-md">Customer Engine v2.0</Badge>
                <h1 className="text-sm md:text-base font-semibold leading-tight">Workspace</h1>
                <p className="text-xs text-muted-foreground">Manage your digital inventory and transaction ledger.</p>
              </div>
              <Button asChild size="sm" className="h-8 rounded-lg text-xs font-medium group hidden sm:inline-flex shrink-0">
                <Link href="/dashboard/downloads">
                  Access Digital Vault
                  <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </header>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="rounded-xl shadow-sm p-4 border border-border/60 overflow-hidden">
                <p className="text-[11px] font-medium text-muted-foreground mb-1.5">Order Density</p>
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className="text-lg md:text-xl font-semibold tracking-tight">{stats.count}</span>
                  <span className="text-[11px] text-muted-foreground">Transactions</span>
                </div>
              </Card>
              <Card className="rounded-xl shadow-sm p-4 border border-border/60 overflow-hidden">
                <p className="text-[11px] font-medium text-muted-foreground mb-1.5">Net Acquisition</p>
                <span className="text-lg md:text-xl font-semibold tracking-tight break-words">₹{stats.spent.toLocaleString("en-IN")}</span>
              </Card>
            </div>

            <section className="space-y-3 min-w-0">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <History className="h-3.5 w-3.5" />
                  </div>
                  <h2 className="text-sm font-semibold truncate">Recent Purchase History</h2>
                </div>
                <Link href="/products" className="text-xs font-medium text-primary hover:underline flex items-center gap-1 shrink-0">
                  Expand <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="rounded-xl shadow-sm overflow-hidden border border-border/60 bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[560px]">
                    <thead className="bg-muted/40 border-b border-border/60">
                      <tr>
                        <th className="px-3 py-2.5 text-left text-[11px] font-medium text-muted-foreground">Reference</th>
                        <th className="px-3 py-2.5 text-left text-[11px] font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                        <th className="px-3 py-2.5 text-left text-[11px] font-medium text-muted-foreground">Status</th>
                        <th className="px-3 py-2.5 text-right text-[11px] font-medium text-muted-foreground">Net Value</th>
                        <th className="px-3 py-2.5 w-28"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {ordersLoading ? (
                        [1,2,3].map(i => <tr key={i} className="animate-pulse"><td colSpan={5} className="h-12 bg-muted/20"></td></tr>)
                      ) : sortedOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-3 py-3 font-mono text-primary text-xs font-medium">#{order.id?.slice(-8)}</td>
                          <td className="px-3 py-3 text-muted-foreground hidden sm:table-cell text-xs">
                            {order.createdAt ? format(new Date(order.createdAt), 'MMM dd, yyyy') : 'Recently'}
                          </td>
                          <td className="px-3 py-3">
                            <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-500 border-none text-[11px] font-medium px-1.5 py-0 rounded-md capitalize">
                              {order.status}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-xs">₹{(order.subtotal / 100).toLocaleString('en-IN')}</td>
                          <td className="px-3 py-3 text-right">
                            <Button variant="ghost" size="sm" className="h-7 rounded-lg gap-1 text-[11px] font-medium hover:bg-primary hover:text-white transition-colors px-2.5" asChild>
                              <Link href={`/dashboard/orders/${order.id}`}>
                                Receipt
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {!ordersLoading && sortedOrders.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-12 text-center text-xs text-muted-foreground">
                            No transactions yet. Start building your library.
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
