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
  Loader2,
  TrendingUp,
  PieChart as PieIcon
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
      { name: 'Direct Catalog Sales', value: 100 },
    ];

    const totalItems = sorted.reduce((sum, s) => sum + s.value, 0);
    return sorted.map(s => ({
      name: s.name,
      value: Math.round((s.value / totalItems) * 100)
    }));
  }, [orders]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold text-accent mb-1.5 uppercase">
            METRICS & DRIFT
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-headline">
            Store Analytics
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Key performance indicators, gross order value, and category demand distribution.
          </p>
        </div>

        <Button 
          variant="outline" 
          className="gap-2 h-9.5 rounded-2xl px-4 text-xs font-semibold border-border/80 shadow-2xs hover:bg-muted" 
          onClick={() => window.print()}
        >
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Settlement Conversion', value: stats.conversion, icon: Zap, color: 'text-amber-600 bg-amber-500/10', desc: 'Paid vs pipeline intents' },
          { label: 'Average Order Value', value: `₹${Number(stats.aov).toLocaleString('en-IN')}`, icon: CreditCard, color: 'text-blue-600 bg-blue-500/10', desc: 'Per completed checkout' },
          { label: 'Total Volume', value: `₹${stats.total.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-500/10', desc: 'All-time gross settlement' },
          { label: 'Completed Orders', value: stats.count.toString(), icon: ShoppingBag, color: 'text-violet-600 bg-violet-500/10', desc: 'Fulfillment transactions' }
        ].map((item, i) => (
          <div key={i} className="rounded-3xl border border-border/80 bg-white p-5 shadow-xs flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{item.label}</span>
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${item.color}`}>
                <item.icon className="h-4.5 w-4.5" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-headline tabular-nums">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : item.value}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 6-Month Monthly Trend */}
        <Card className="lg:col-span-8 rounded-3xl border border-border/80 bg-white shadow-xs overflow-hidden">
          <CardHeader className="p-5 sm:p-6 pb-2 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold font-headline text-foreground">
                  6-Month Performance Trend
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Monthly gross volume and transaction density
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-2">
            <div className="h-[280px] w-full pt-2">
              {isLoading ? (
                <div className="h-full w-full flex items-center justify-center bg-muted/30 rounded-2xl animate-pulse">
                  <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.28}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.6} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid hsl(var(--border))', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: '600' }}
                      formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Gross Volume']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" name="Revenue (INR)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Share Donut */}
        <Card className="lg:col-span-4 rounded-3xl border border-border/80 bg-white shadow-xs p-5 sm:p-6 space-y-4">
          <CardHeader className="p-0 pb-2 border-b border-border/60">
            <CardTitle className="text-base font-bold font-headline text-foreground flex items-center gap-2">
              <PieIcon className="h-4.5 w-4.5 text-accent" /> Category Mix
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Sales distribution by asset vertical
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex flex-col items-center">
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryMix}
                    innerRadius={52}
                    outerRadius={76}
                    paddingAngle={6}
                    dataKey="value"
                  >
                    {categoryMix.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#f59e0b' : index === 1 ? '#8b5cf6' : '#10b981'} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '12px', border: '1px solid hsl(var(--border))' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full mt-3">
              {categoryMix.map((cat, index) => (
                <div key={cat.name} className="flex items-center justify-between p-2.5 rounded-2xl border border-border/60 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-violet-500' : 'bg-emerald-500'}`} />
                    <span className="text-xs font-bold text-foreground capitalize">{cat.name}</span>
                  </div>
                  <span className="text-xs font-extrabold text-muted-foreground tabular-nums">{cat.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
