'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Users as UsersIcon, 
  ShoppingBag as OrderIcon, 
  Package as ProductIcon,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ArrowRight,
  Activity,
  Loader2,
  History,
  ShieldCheck
} from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, limit, orderBy } from "firebase/firestore";
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

export default function AdminDashboard() {
  const db = useFirestore();
  
  // Optimized fetches - avoid complex orderBy if not absolutely needed for MVP to prevent index errors
  const ordersQuery = useMemoFirebase(() => db ? collection(db, 'orders') : null, [db]);
  const { data: allOrders, loading: ordersLoading } = useCollection(ordersQuery);

  const productsQuery = useMemoFirebase(() => db ? collection(db, 'products') : null, [db]);
  const { data: allProducts, loading: productsLoading } = useCollection(productsQuery);

  const usersQuery = useMemoFirebase(() => db ? collection(db, 'users') : null, [db]);
  const { data: users } = useCollection(usersQuery);

  const logsQuery = useMemoFirebase(() => {
    // Audit logs often need ordering; we limit to a safe amount
    return db ? query(collection(db, 'admin_logs'), limit(5)) : null;
  }, [db]);
  const { data: adminLogs, loading: logsLoading } = useCollection(logsQuery);

  // High-performance data sorting and processing
  const processedData = useMemo(() => {
    if (!allOrders) return { revenue: 0, ordersCount: 0, recent: [], chart: [] };

    // 1. Sort orders by creation date (descending)
    const sorted = [...allOrders].sort((a: any, b: any) => {
      const dateA = a.createdAt?.toMillis?.() || 0;
      const dateB = b.createdAt?.toMillis?.() || 0;
      return dateB - dateA;
    });

    const paidOrders = sorted.filter(o => o.status === 'paid');
    const totalRev = paidOrders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0) / 100;

    // 2. Chart Data (Last 7 Days)
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
      const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      const day = format(date, 'eee');
      if (dailyRevenueMap[day] !== undefined) {
        dailyRevenueMap[day] += (order.totalAmount || order.total || 0) / 100;
      }
    });

    return {
      revenue: totalRev,
      ordersCount: paidOrders.length,
      recent: sorted.slice(0, 5),
      chart: last7Days.map(day => ({ name: day, revenue: Math.round(dailyRevenueMap[day]) }))
    };
  }, [allOrders]);

  const stats = [
    { name: 'Total Volume', value: `₹${processedData.revenue.toLocaleString('en-IN')}`, trend: '+12.5%', isUp: true, icon: TrendingUp },
    { name: 'Verified Users', value: (users?.length || 0).toString(), trend: '+5.2%', isUp: true, icon: UsersIcon },
    { name: 'Paid Orders', value: processedData.ordersCount.toString(), trend: 'Confirmed', isUp: true, icon: OrderIcon },
    { name: 'Live Products', value: (allProducts?.length || 0).toString(), trend: 'Active', isUp: true, icon: ProductIcon },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Intelligence Overview</h1>
          <p className="text-muted-foreground">Marketplace economic health and operational audit.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild size="sm" variant="outline" className="rounded-xl border-white/10">
            <Link href="/admin/analytics">
              <Activity className="mr-2 h-4 w-4" />
              Deep Analytics
            </Link>
          </Button>
          <Button asChild size="sm" className="rounded-xl shadow-xl shadow-primary/20">
            <Link href="/admin/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="bg-card/30 backdrop-blur-sm border-white/5 relative overflow-hidden group rounded-[2rem]">
            <div className="absolute right-0 bottom-0 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
              <stat.icon size={80} />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-headline">
                {ordersLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : stat.value}
              </div>
              <p className="flex items-center text-[10px] font-bold mt-2">
                <span className={stat.isUp ? "text-green-500" : "text-destructive"}>
                  {stat.trend}
                </span>
                <span className="ml-1 text-muted-foreground font-normal tracking-normal italic opacity-60">vs baseline</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden border-white/5 bg-card/30 rounded-[2.5rem]">
          <CardHeader>
            <CardTitle className="text-xl font-headline">Economic Performance</CardTitle>
            <CardDescription>Verified revenue volume over the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="h-[320px] w-full pt-4">
              {ordersLoading ? (
                <div className="h-full w-full flex items-center justify-center bg-muted/10 rounded-2xl animate-pulse">
                   <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={processedData.chart}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 12}} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 12}}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111115', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: 'hsl(var(--primary))' }}
                      formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-white/5 bg-card/30 rounded-[2.5rem]">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-headline">System Audit</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              {logsLoading ? (
                [...Array(3)].map((_, i) => <div key={i} className="h-10 w-full animate-pulse bg-muted rounded-xl" />)
              ) : adminLogs && adminLogs.length > 0 ? (
                adminLogs.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group">
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border border-white/5",
                      log.action === 'CREATE' ? "bg-green-500/10 text-green-500" : 
                      log.action === 'DELETE' ? "bg-destructive/10 text-destructive" : 
                      "bg-primary/10 text-primary"
                    )}>
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold leading-none truncate uppercase tracking-tight">
                        {log.action} {log.resourceType}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">
                        {log.details?.name || log.resourceId?.slice(-8)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 opacity-30">
                  <p className="text-xs">No recent actions.</p>
                </div>
              )}
              <Button variant="ghost" size="sm" className="w-full text-[10px] uppercase font-bold tracking-widest h-10 rounded-xl" asChild>
                <Link href="/admin/logs">Full History</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-headline">Velocity Leaders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {productsLoading ? (
                [...Array(3)].map((_, i) => <div key={i} className="h-12 w-full animate-pulse bg-muted rounded-xl" />)
              ) : allProducts?.sort((a,b) => (b.salesCount || 0) - (a.salesCount || 0)).slice(0, 3).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded bg-muted overflow-hidden shrink-0 border border-white/5 relative">
                      <Image src={p.images?.[0] || 'https://picsum.photos/seed/placeholder/100/100'} alt={p.name} fill className="object-cover" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold truncate">{p.name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{p.categorySlug}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-primary">{p.salesCount || 0} units</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-white/5 bg-card/30 rounded-[2.5rem]">
        <CardHeader className="flex flex-row items-center justify-between p-8">
          <div>
            <CardTitle className="text-xl font-headline">Recent Verified Transactions</CardTitle>
            <CardDescription>Direct ledger overview of incoming orders.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-primary font-bold rounded-xl h-10 px-6">
            <Link href="/admin/orders">View Registry</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {ordersLoading ? (
            <div className="p-8 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 w-full animate-pulse bg-muted rounded-xl" />
              ))}
            </div>
          ) : processedData.recent.length > 0 ? (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="pl-8">Reference</TableHead>
                  <TableHead>Customer Entity</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead className="text-right pr-8">Net Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedData.recent.map((order: any) => (
                  <TableRow key={order.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="pl-8 font-mono text-primary text-[10px] uppercase font-bold tracking-widest">#{order.id?.slice(-8)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{order.userName || 'Guest'}</span>
                        <span className="text-[10px] text-muted-foreground">{order.userEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.status === 'paid' ? 'default' : 'secondary'} className={cn(
                        "text-[9px] uppercase font-black px-2 py-0.5 tracking-tighter border-none",
                        order.status === 'paid' ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
                      )}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8 font-bold text-sm">
                      ₹{((order.totalAmount || order.total || 0) / 100).toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center text-center p-8">
              <OrderIcon className="h-10 w-10 text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground text-sm">No transaction records detected.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
