'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  PieChart,
  Pie
} from 'recharts';
import {
  ShoppingBag,
  Users,
  Calendar,
  Download,
  CreditCard,
  Zap,
  Activity,
  ArrowUpRight,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  return json.success ? json.data : [];
};

export default function AdminAnalytics() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => fetcher('/api/admin/orders'),
    refetchInterval: 30000,
  });

  const stats = useMemo(() => {
    if (!orders.length) return { total: 0, count: 0, aov: 0, conversion: '0%', pipeline: 0 };
    const list = orders as any[];
    const paidOrders = list.filter(o => o.status === 'paid');
    const total = paidOrders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0);
    const conv = list.length > 0 ? ((paidOrders.length / list.length) * 100).toFixed(1) : 0;

    return {
      total: total / 100,
      count: paidOrders.length,
      aov: paidOrders.length > 0 ? (total / paidOrders.length / 100).toFixed(0) : 0,
      conversion: `${conv}%`,
      pipeline: list.length
    };
  }, [orders]);

  const revenueData = useMemo(() => {
    if (!orders.length) return [];

    const last6Months = Array.from({ length: 6 }).map((_, i) => subMonths(new Date(), i)).reverse();

    return last6Months.map(monthDate => {
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const monthOrders = (orders as any[]).filter(o => {
        if (!o.createdAt) return false;
        const d = new Date(o.createdAt);
        return isWithinInterval(d, { start: monthStart, end: monthEnd }) && o.status === 'paid';
      });

      return {
        month: format(monthDate, 'MMM'),
        revenue: Math.round(monthOrders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0) / 100),
        orders: monthOrders.length
      };
    });
  }, [orders]);

  const categoryMix = useMemo(() => {
    if (!orders.length) return [];

    const counts: Record<string, number> = {};
    (orders as any[]).filter(o => o.status === 'paid').forEach(o => {
      o.items?.forEach((item: any) => {
        const cat = item.category || item.productName?.split(' ')[0] || 'Asset';
        counts[cat] = (counts[cat] || 0) + 1;
      });
    });

    const sorted = Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);

    if (sorted.length === 0) return [
      { name: 'Direct Sales', value: 100 },
    ];

    const totalItems = sorted.reduce((sum, s) => sum + s.value, 0);
    return sorted.map(s => ({
      name: s.name,
      value: Math.round((s.value / totalItems) * 100)
    }));
  }, [orders]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-semibold">Analytics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Direct analysis of your store&apos;s performance.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-1.5 h-8 rounded-lg px-3 text-xs">
            <Calendar className="h-3.5 w-3.5" />
            Historical Drift
          </Button>
          <Button className="gap-1.5 h-8 rounded-lg px-3 text-xs" onClick={() => window.print()}>
            <Download className="h-3.5 w-3.5" />
            Audit Report
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Conversion', value: stats.conversion, icon: Zap },
          { label: 'Average Order', value: `₹${Number(stats.aov).toLocaleString()}`, icon: CreditCard },
          { label: 'Total Volume', value: `₹${stats.total.toLocaleString()}`, icon: ShoppingBag },
          { label: 'Paid Orders', value: stats.count, icon: Users }
        ].map((item, i) => (
          <Card key={i} className="rounded-xl shadow-sm p-4">
            <CardContent className="p-0 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-muted-foreground">{item.label}</span>
                <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="text-lg md:text-xl font-semibold tabular-nums">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : item.value}
              </p>
              <p className="flex items-center text-[10px] font-medium text-green-600">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                Live feed
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 rounded-xl shadow-sm p-4">
          <CardHeader className="p-0 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Revenue Overview</CardTitle>
            </div>
            <CardDescription className="text-xs">Monthly revenue volume vs. order count.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[260px] w-full pt-3">
              {isLoading ? (
                <div className="h-full w-full flex items-center justify-center bg-muted/30 rounded-lg animate-pulse">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'rgba(0,0,0,0.4)', fontSize: 11}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'rgba(0,0,0,0.4)', fontSize: 11}} width={40} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', fontSize: '11px' }}
                      cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1 }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" name="Revenue (INR)" />
                    <Area type="monotone" dataKey="orders" stroke="hsl(var(--accent))" strokeWidth={2} fillOpacity={0} name="Order Count" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm p-4">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-sm font-semibold">Category Mix</CardTitle>
            <CardDescription className="text-xs">Sales distribution across asset classes.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex flex-col items-center">
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryMix}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={6}
                    dataKey="value"
                  >
                    {categoryMix.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--primary))' : index === 1 ? 'hsl(var(--accent))' : '#10b981'} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full mt-4">
              {categoryMix.map((cat, index) => (
                <div key={cat.name} className="flex items-center justify-between px-3 py-2 rounded-lg border bg-background">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${index === 0 ? 'bg-primary' : index === 1 ? 'bg-accent' : 'bg-green-500'}`} />
                    <span className="text-xs font-medium">{cat.name}</span>
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground tabular-nums">{cat.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
