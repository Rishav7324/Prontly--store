'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Users as UsersIcon,
  ShoppingBag as OrderIcon,
  Package as ProductIcon,
  Plus,
  Activity,
  Loader2,
  History,
  ShieldCheck,
  ArrowUpRight,
  Sparkles,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { adminJsonFetcher } from "@/lib/auth/admin-fetch";

export default function AdminDashboard() {
  const { data: allOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => adminJsonFetcher('/api/admin/orders'),
    refetchInterval: 15000,
  });

  const { data: allProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => adminJsonFetcher('/api/products'),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminJsonFetcher('/api/admin/users'),
  });

  const { data: allLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: () => adminJsonFetcher('/api/admin/logs'),
    refetchInterval: 30000,
  });

  const adminLogs = useMemo(() => (allLogs as any[]).slice(0, 5), [allLogs]);

  const processedData = useMemo(() => {
    if (!allOrders.length) return { revenue: 0, ordersCount: 0, recent: [], chart: [] };

    const sorted = [...(allOrders as any[])].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    const paidOrders = sorted.filter(o => o.status === 'paid');
    const totalRev = paidOrders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0) / 100;

    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return format(d, 'eee');
    }).reverse();

    const dailyRevenueMap = last7Days.reduce((acc, day) => {
      acc[day] = 0;
      return acc;
    }, {} as any);

    paidOrders.forEach(order => {
      if (!order.createdAt) return;
      const day = format(new Date(order.createdAt), 'eee');
      if (dailyRevenueMap[day] !== undefined) {
        dailyRevenueMap[day] += (order.totalAmount || order.total || 0) / 100;
      }
    });

    return {
      revenue: totalRev,
      ordersCount: paidOrders.length,
      recent: sorted.slice(0, 6),
      chart: last7Days.map(day => ({ name: day, revenue: Math.round(dailyRevenueMap[day]) }))
    };
  }, [allOrders]);

  const stats = [
    { 
      name: 'Gross Volume', 
      value: `₹${processedData.revenue.toLocaleString('en-IN')}`, 
      icon: TrendingUp, 
      desc: 'Total paid volume',
      color: 'text-amber-600 bg-amber-500/10'
    },
    { 
      name: 'Customer Base', 
      value: users.length.toString(), 
      icon: UsersIcon, 
      desc: 'Registered accounts',
      color: 'text-violet-600 bg-violet-500/10'
    },
    { 
      name: 'Completed Orders', 
      value: processedData.ordersCount.toString(), 
      icon: OrderIcon, 
      desc: 'Paid & fulfilled',
      color: 'text-blue-600 bg-blue-500/10'
    },
    { 
      name: 'Live Products', 
      value: allProducts.length.toString(), 
      icon: ProductIcon, 
      desc: 'Active in catalog',
      color: 'text-emerald-600 bg-emerald-500/10'
    },
  ];

  return (
    <div className="space-y-7">
      
      {/* ── HEADER ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold text-accent mb-1.5 uppercase">
            COMMERCE OVERVIEW
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-headline">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Real-time marketplace revenue, volume trends, and fulfillment logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button asChild variant="outline" size="sm" className="h-9.5 rounded-xl px-3.5 text-xs font-semibold border-border/80 shadow-2xs hover:bg-muted">
            <Link href="/admin/analytics">
              <Activity className="mr-2 h-4 w-4 text-accent" />
              Detailed Analytics
            </Link>
          </Button>
          <Button asChild size="sm" className="h-9.5 rounded-xl px-4 text-xs font-bold bg-zinc-950 text-white hover:bg-zinc-800 shadow-xs active:scale-[0.98] transition-all">
            <Link href="/admin/products/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      {/* ── STAT CARDS GRID ──────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="rounded-3xl border border-border/80 bg-white p-5 shadow-xs flex flex-col justify-between gap-3 hover:border-accent/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {stat.name}
              </span>
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-4.5 w-4.5" />
              </div>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-headline">
                {ordersLoading && stat.name !== 'Customer Base' && stat.name !== 'Live Products' ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  stat.value
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{stat.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── REVENUE CHART + METRIC PANELS ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 7-Day Revenue Area Graph */}
        <Card className="lg:col-span-8 rounded-3xl border border-border/80 bg-white shadow-xs overflow-hidden">
          <CardHeader className="p-5 sm:p-6 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold font-headline text-foreground">
                  Revenue Velocity
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Verified gross turnover over the past 7 days
                </CardDescription>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                Live Sync
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-2">
            <div className="h-[260px] sm:h-[290px] w-full">
              {ordersLoading ? (
                <div className="h-full w-full flex items-center justify-center rounded-2xl animate-pulse bg-muted/30">
                  <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={processedData.chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.28}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.6} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 500 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip
                      cursor={{ stroke: '#f59e0b', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '16px',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                      itemStyle={{ color: '#09090b' }}
                      formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Stack: Velocity Leaders & Audit Logs */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Top Selling Products */}
          <div className="rounded-3xl border border-border/80 bg-white p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-sm font-bold font-headline text-foreground">Velocity Leaders</h3>
              <Link href="/admin/products" className="text-[11px] font-semibold text-accent hover:underline">
                View catalog →
              </Link>
            </div>
            
            <div className="space-y-2.5">
              {productsLoading ? (
                [...Array(3)].map((_, i) => <div key={i} className="h-12 w-full animate-pulse bg-muted rounded-2xl" />)
              ) : [...(allProducts as any[])]
                .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
                .slice(0, 3)
                .map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 p-2 rounded-2xl hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0 relative bg-muted border border-border/60">
                      <Image src={p.images?.[0] || 'https://picsum.photos/seed/placeholder/100/100'} alt={p.name} fill className="object-cover" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-foreground truncate">{p.name}</span>
                      <span className="text-[10px] text-muted-foreground capitalize">{p.categorySlug}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-xs font-extrabold text-foreground tabular-nums">{p.salesCount || 0} sales</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Logs */}
          <div className="rounded-3xl border border-border/80 bg-white p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-sm font-bold font-headline text-foreground flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" /> Audit Trail
              </h3>
              <Link href="/admin/logs" className="text-[11px] font-semibold text-accent hover:underline">
                Full logs →
              </Link>
            </div>

            <div className="space-y-2">
              {logsLoading ? (
                [...Array(3)].map((_, i) => <div key={i} className="h-10 w-full animate-pulse bg-muted rounded-2xl" />)
              ) : adminLogs.length > 0 ? (
                adminLogs.map((log: any) => (
                  <div key={log.id} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-muted/40 transition-colors">
                    <div className={cn(
                      "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold",
                      log.action === 'CREATE' ? "bg-emerald-500/15 text-emerald-700" :
                      log.action === 'DELETE' ? "bg-rose-500/15 text-rose-700" :
                      "bg-blue-500/15 text-blue-700"
                    )}>
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground truncate">
                        {log.action} {log.resourceType}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {log.details?.name || log.resourceId?.slice(-8)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">No recent system activity.</p>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ── RECENT TRANSACTIONS TABLE ────────────────── */}
      <Card className="rounded-3xl border border-border/80 bg-white shadow-xs overflow-hidden">
        <CardHeader className="p-5 sm:p-6 flex flex-row items-center justify-between border-b border-border/60">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold font-headline text-foreground">
              Recent Transactions
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Live settlement feed with verified customer details
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild className="h-8.5 rounded-xl text-xs font-semibold border-border/80">
            <Link href="/admin/orders">View Registry</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {ordersLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 w-full animate-pulse bg-muted rounded-2xl" />
              ))}
            </div>
          ) : processedData.recent.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="px-6 py-3.5 text-xs font-bold text-muted-foreground">Order ID</TableHead>
                      <TableHead className="px-6 py-3.5 text-xs font-bold text-muted-foreground">Customer</TableHead>
                      <TableHead className="px-6 py-3.5 text-xs font-bold text-muted-foreground">Fulfillment Status</TableHead>
                      <TableHead className="px-6 py-3.5 text-right text-xs font-bold text-muted-foreground">Gross Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedData.recent.map((order: any) => (
                      <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="px-6 py-4 font-mono font-bold text-xs text-foreground">
                          <Link href={`/admin/orders/${order.id}`} className="hover:underline text-accent">
                            #{order.id?.slice(-8)}
                          </Link>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-foreground">{order.userName || 'Customer'}</span>
                            <span className="text-[11px] text-muted-foreground">{order.userEmail}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge variant="outline" className={cn(
                            "text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize",
                            order.status === 'paid' ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                            order.status === 'refunded' ? "border-rose-200 bg-rose-50 text-rose-700" :
                            "border-amber-200 bg-amber-50 text-amber-700"
                          )}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right font-extrabold text-sm text-foreground font-headline">
                          ₹{((order.totalAmount || order.total || 0) / 100).toLocaleString('en-IN')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card List View */}
              <div className="md:hidden divide-y divide-border/60">
                {processedData.recent.map((order: any) => (
                  <Link key={order.id} href={`/admin/orders/${order.id}`} className="block p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-bold text-accent">#{order.id?.slice(-8)}</span>
                      <Badge variant="outline" className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full capitalize",
                        order.status === 'paid' ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                        order.status === 'refunded' ? "border-rose-200 bg-rose-50 text-rose-700" :
                        "border-amber-200 bg-amber-50 text-amber-700"
                      )}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-foreground">{order.userName || 'Customer'}</p>
                        <p className="text-[11px] text-muted-foreground">{order.userEmail}</p>
                      </div>
                      <span className="font-extrabold text-sm text-foreground font-headline">
                        ₹{((order.totalAmount || order.total || 0) / 100).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-44 flex-col items-center justify-center text-center p-6">
              <OrderIcon className="h-10 w-10 text-muted-foreground mb-3 opacity-30" />
              <p className="text-muted-foreground text-xs">No orders recorded yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
