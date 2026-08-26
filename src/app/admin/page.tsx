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
  ShieldCheck
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

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  return json.success ? json.data : [];
};

export default function AdminDashboard() {
  const { data: allOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => fetcher('/api/admin/orders'),
    refetchInterval: 15000,
  });

  const { data: allProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => fetcher('/api/products'),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => fetcher('/api/admin/users'),
  });

  const { data: allLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: () => fetcher('/api/admin/logs'),
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
      recent: sorted.slice(0, 5),
      chart: last7Days.map(day => ({ name: day, revenue: Math.round(dailyRevenueMap[day]) }))
    };
  }, [allOrders]);

  const stats = [
    { name: 'Total Volume', value: `₹${processedData.revenue.toLocaleString('en-IN')}`, icon: TrendingUp },
    { name: 'Verified Users', value: users.length.toString(), icon: UsersIcon },
    { name: 'Paid Orders', value: processedData.ordersCount.toString(), icon: OrderIcon },
    { name: 'Live Products', value: allProducts.length.toString(), icon: ProductIcon },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-semibold">Intelligence Overview</h1>
          <p className="text-sm text-muted-foreground">Marketplace economic health and operational audit.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline" className="h-8 rounded-lg text-xs">
            <Link href="/admin/analytics">
              <Activity className="mr-2 h-3.5 w-3.5" />
              Deep Analytics
            </Link>
          </Button>
          <Button asChild size="sm" className="h-8 rounded-lg text-xs">
            <Link href="/admin/products/new">
              <Plus className="mr-2 h-3.5 w-3.5" />
              Add Product
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="rounded-xl shadow-sm border p-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-0">
              <CardTitle className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-xl md:text-2xl font-semibold">
                {ordersLoading && stat.name !== 'Verified Users' && stat.name !== 'Live Products' ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  stat.value
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-xl shadow-sm border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Economic Performance</CardTitle>
            <CardDescription>Verified revenue volume over the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-[240px] w-full">
              {ordersLoading ? (
                <div className="h-full w-full flex items-center justify-center rounded-xl animate-pulse bg-muted/40">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={processedData.chart}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip
                      cursor={{ stroke: 'hsl(var(--border))' }}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        fontSize: '12px'
                      }}
                      itemStyle={{ color: '#2563eb', fontWeight: 500 }}
                      formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#2563eb"
                      strokeWidth={2}
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
          <Card className="rounded-xl shadow-sm border p-4">
            <CardHeader className="pb-2 p-0 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-semibold">System Audit</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0 pt-3 space-y-1">
              {logsLoading ? (
                [...Array(3)].map((_, i) => <div key={i} className="h-9 w-full animate-pulse bg-muted rounded-lg" />)
              ) : adminLogs.length > 0 ? (
                adminLogs.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3 py-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={cn(
                      "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                      log.action === 'CREATE' ? "bg-green-500/10 text-green-600" :
                      log.action === 'DELETE' ? "bg-red-500/10 text-red-600" :
                      "bg-blue-600/10 text-blue-600"
                    )}>
                      <ShieldCheck className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold leading-none truncate">
                        {log.action} {log.resourceType}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">
                        {log.details?.name || log.resourceId?.slice(-8)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-xs">No recent actions.</p>
                </div>
              )}
              <Button variant="ghost" size="sm" className="w-full h-8 rounded-lg text-xs font-medium" asChild>
                <Link href="/admin/logs">Full History</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm border p-4">
            <CardHeader className="pb-2 p-0 space-y-0">
              <CardTitle className="text-base font-semibold">Velocity Leaders</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-3 space-y-1">
              {productsLoading ? (
                [...Array(3)].map((_, i) => <div key={i} className="h-10 w-full animate-pulse bg-muted rounded-lg" />)
              ) : [...(allProducts as any[])]
                .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
                .slice(0, 3)
                .map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 py-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg overflow-hidden shrink-0 relative bg-muted">
                      <Image src={p.images?.[0] || 'https://picsum.photos/seed/placeholder/100/100'} alt={p.name} fill className="object-cover" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">{p.name}</span>
                      <span className="text-[10px] text-muted-foreground">{p.categorySlug}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-semibold text-blue-600">{p.salesCount || 0} units</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-xl shadow-sm border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Recent Verified Transactions</CardTitle>
            <CardDescription>Direct ledger overview of incoming orders.</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild className="h-8 rounded-lg text-xs">
            <Link href="/admin/orders">View Registry</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0 pb-4">
          {ordersLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 w-full animate-pulse bg-muted rounded-lg" />
              ))}
            </div>
          ) : processedData.recent.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6 text-xs">Reference</TableHead>
                    <TableHead className="text-xs">Customer Entity</TableHead>
                    <TableHead className="text-xs">State</TableHead>
                    <TableHead className="text-right pr-6 text-xs">Net Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedData.recent.map((order: any) => (
                    <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="pl-6 px-3 py-2 font-mono text-blue-600 text-xs font-medium">
                        #{order.id?.slice(-8)}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{order.userName || 'Guest'}</span>
                          <span className="text-[10px] text-muted-foreground">{order.userEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Badge variant="outline" className={cn(
                          "text-[10px] font-medium px-2 py-0.5 rounded-full",
                          order.status === 'paid' ? "border-transparent bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"
                        )}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6 px-3 py-2 font-semibold text-sm">
                        ₹{((order.totalAmount || order.total || 0) / 100).toLocaleString('en-IN')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center text-center p-6">
              <OrderIcon className="h-8 w-8 text-muted-foreground mb-3 opacity-30" />
              <p className="text-muted-foreground text-sm">No transaction records detected.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
