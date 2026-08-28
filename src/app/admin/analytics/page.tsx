'use client';

import { useState, useMemo } from 'react';
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
  BarChart,
  Bar,
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
  PieChart as PieIcon,
  BarChart3,
  Percent,
  FileSpreadsheet,
  RefreshCw,
  Clock,
  Layers,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  subDays,
  subMonths,
  subYears,
  startOfDay,
  endOfDay,
  isWithinInterval,
  eachDayOfInterval,
  eachMonthOfInterval
} from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type TimeRange = '24h' | '7d' | '30d' | '90d' | '1y' | 'all';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  return json.success ? json.data : [];
};

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [chartMode, setChartMode] = useState<'revenue' | 'volume'>('revenue');

  const { data: orders = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => fetcher('/api/admin/orders'),
    refetchInterval: 30000,
  });

  const { data: usersList = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => fetcher('/api/admin/users'),
    refetchInterval: 60000,
  });

  // Calculate start & end bounds for the selected time range
  const dateInterval = useMemo(() => {
    const now = new Date();
    switch (timeRange) {
      case '24h':
        return { start: subDays(now, 1), end: now };
      case '7d':
        return { start: subDays(now, 7), end: now };
      case '30d':
        return { start: subDays(now, 30), end: now };
      case '90d':
        return { start: subDays(now, 90), end: now };
      case '1y':
        return { start: subYears(now, 1), end: now };
      case 'all':
      default:
        return { start: new Date(2023, 0, 1), end: now };
    }
  }, [timeRange]);

  // Filter orders by selected timeframe
  const filteredOrders = useMemo(() => {
    if (!orders.length) return [];
    const list = orders as any[];
    if (timeRange === 'all') return list;

    return list.filter(o => {
      if (!o.createdAt) return false;
      const orderDate = new Date(o.createdAt);
      return isWithinInterval(orderDate, dateInterval);
    });
  }, [orders, timeRange, dateInterval]);

  // Calculate Comprehensive KPIs
  const metrics = useMemo(() => {
    const list = filteredOrders;
    const paidOrders = list.filter(o => o.status === 'paid' || o.status === 'delivered');
    const refundedOrders = list.filter(o => o.status === 'refunded');

    const grossRevenuePaise = paidOrders.reduce((sum, o) => sum + (o.totalAmount || o.subtotal || 0), 0);
    const grossRevenue = grossRevenuePaise / 100;

    const discountPaise = paidOrders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);
    const totalDiscount = discountPaise / 100;

    const gstPaise = paidOrders.reduce((sum, o) => sum + (o.gstAmount || 0), 0);
    const totalGst = gstPaise / 100;

    const aov = paidOrders.length > 0 ? grossRevenue / paidOrders.length : 0;
    const conversionRate = list.length > 0 ? (paidOrders.length / list.length) * 100 : 0;
    const refundRate = paidOrders.length > 0 ? (refundedOrders.length / (paidOrders.length + refundedOrders.length)) * 100 : 0;

    return {
      grossRevenue,
      paidCount: paidOrders.length,
      totalPipeline: list.length,
      aov,
      conversionRate,
      refundCount: refundedOrders.length,
      refundRate,
      totalDiscount,
      totalGst,
    };
  }, [filteredOrders]);

  // Chart Time-Series Data Generator
  const timeSeriesData = useMemo(() => {
    if (!filteredOrders.length) return [];

    const paid = filteredOrders.filter(o => o.status === 'paid' || o.status === 'delivered');

    if (timeRange === '24h' || timeRange === '7d' || timeRange === '30d') {
      const days = eachDayOfInterval(dateInterval);
      return days.map(day => {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);

        const dayOrders = paid.filter(o => {
          if (!o.createdAt) return false;
          const d = new Date(o.createdAt);
          return isWithinInterval(d, { start: dayStart, end: dayEnd });
        });

        const rev = dayOrders.reduce((sum, o) => sum + (o.totalAmount || o.subtotal || 0), 0) / 100;

        return {
          label: format(day, timeRange === '24h' ? 'HH:mm' : 'MMM dd'),
          revenue: Math.round(rev),
          orders: dayOrders.length,
        };
      });
    }

    // 90d, 1y, all -> Monthly aggregation
    const months = eachMonthOfInterval(dateInterval);
    return months.map(month => {
      const mStart = startOfDay(month);
      const mEnd = endOfDay(month);

      const mOrders = paid.filter(o => {
        if (!o.createdAt) return false;
        const d = new Date(o.createdAt);
        return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
      });

      const rev = mOrders.reduce((sum, o) => sum + (o.totalAmount || o.subtotal || 0), 0) / 100;

      return {
        label: format(month, 'MMM yy'),
        revenue: Math.round(rev),
        orders: mOrders.length,
      };
    });
  }, [filteredOrders, dateInterval, timeRange]);

  // Top Selling Products Breakdown
  const topProducts = useMemo(() => {
    const productMap: Record<string, { name: string; units: number; revenue: number; category: string }> = {};

    filteredOrders
      .filter(o => o.status === 'paid' || o.status === 'delivered')
      .forEach(o => {
        o.items?.forEach((item: any) => {
          const key = item.productId || item.productName || 'Unknown';
          if (!productMap[key]) {
            productMap[key] = {
              name: item.productName || 'Digital Asset',
              units: 0,
              revenue: 0,
              category: item.category || 'Asset',
            };
          }
          productMap[key].units += (item.quantity || 1);
          productMap[key].revenue += ((item.price || 0) * (item.quantity || 1)) / 100;
        });
      });

    const sorted = Object.values(productMap).sort((a, b) => b.revenue - a.revenue);
    const totalRev = sorted.reduce((sum, p) => sum + p.revenue, 0);

    return sorted.slice(0, 5).map(p => ({
      ...p,
      share: totalRev > 0 ? Math.round((p.revenue / totalRev) * 100) : 0,
    }));
  }, [filteredOrders]);

  // Category Mix Breakdown
  const categoryMix = useMemo(() => {
    const catMap: Record<string, number> = {};

    filteredOrders
      .filter(o => o.status === 'paid' || o.status === 'delivered')
      .forEach(o => {
        o.items?.forEach((item: any) => {
          const cat = item.category || item.productName?.split(' ')[0] || 'Prompts';
          catMap[cat] = (catMap[cat] || 0) + (((item.price || 0) * (item.quantity || 1)) / 100);
        });
      });

    const entries = Object.entries(catMap)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);

    if (!entries.length) return [{ name: 'Direct Catalog', value: 100 }];

    const total = entries.reduce((s, e) => s + e.value, 0);
    return entries.slice(0, 4).map(e => ({
      name: e.name,
      value: total > 0 ? Math.round((e.value / total) * 100) : 0,
      rawAmount: e.value,
    }));
  }, [filteredOrders]);

  // Customer Retention & LTV Metrics
  const customerMetrics = useMemo(() => {
    const uList = usersList as any[];
    const totalCustomers = uList.length || 1;
    const repeatCustomers = uList.filter(u => (u.orderCount || 0) > 1).length;
    const repeatRate = Math.round((repeatCustomers / totalCustomers) * 100);

    const totalSpent = uList.reduce((sum, u) => sum + (u.totalSpent || 0), 0) / 100;
    const avgLtv = Math.round(totalSpent / totalCustomers);

    return {
      totalCustomers: uList.length,
      repeatRate,
      avgLtv,
    };
  }, [usersList]);

  // Export Analytics to CSV
  const handleExportCSV = () => {
    if (!filteredOrders.length) {
      toast({ title: "No data to export", description: "No orders found in this timeframe." });
      return;
    }

    const headers = ["Order ID", "Date", "Customer Email", "Customer Name", "Status", "Subtotal (INR)", "GST (INR)", "Total (INR)", "Coupon Code"];
    const rows = filteredOrders.map(o => [
      o.id,
      o.createdAt ? format(new Date(o.createdAt), 'yyyy-MM-dd HH:mm') : '',
      `"${o.userEmail || ''}"`,
      `"${o.userName || ''}"`,
      o.status,
      ((o.subtotal || 0) / 100).toFixed(2),
      ((o.gstAmount || 0) / 100).toFixed(2),
      ((o.totalAmount || o.subtotal || 0) / 100).toFixed(2),
      o.couponCode || 'NONE'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `prontly-analytics-${timeRange}-${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: "CSV Export Complete", description: `Exported ${filteredOrders.length} records.` });
  };

  const COLORS = ['#f59e0b', '#8b5cf6', '#10b981', '#3b82f6'];

  return (
    <div className="space-y-6">
      
      {/* ── HEADER WITH TIMEFRAME SELECTOR ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold text-accent mb-1.5 uppercase">
            INTELLIGENCE DASHBOARD
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-headline">
            Store Performance & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Real-time telemetry, revenue velocity, checkout conversion, and asset demand analysis.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Chips */}
          <div className="flex items-center bg-muted/70 p-1 rounded-2xl border border-border/60">
            {(['24h', '7d', '30d', '90d', '1y', 'all'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-xl transition-all uppercase",
                  timeRange === range
                    ? "bg-white text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {range}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-9 rounded-xl border-border/80 text-xs font-semibold hover:bg-muted"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isRefetching && "animate-spin")} />
            Refresh
          </Button>

          <Button
            onClick={handleExportCSV}
            size="sm"
            className="h-9 rounded-xl px-3.5 text-xs font-bold bg-zinc-950 text-white hover:bg-zinc-800 shadow-xs"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* ── 6 CORE HEALTH METRIC CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[
          {
            label: 'Gross Volume',
            value: `₹${Math.round(metrics.grossRevenue).toLocaleString('en-IN')}`,
            icon: TrendingUp,
            color: 'text-amber-600 bg-amber-500/10',
            sub: `${metrics.paidCount} paid orders`,
          },
          {
            label: 'Avg Order Value',
            value: `₹${Math.round(metrics.aov).toLocaleString('en-IN')}`,
            icon: CreditCard,
            color: 'text-blue-600 bg-blue-500/10',
            sub: 'Per transaction',
          },
          {
            label: 'Conversion Rate',
            value: `${metrics.conversionRate.toFixed(1)}%`,
            icon: Zap,
            color: 'text-emerald-600 bg-emerald-500/10',
            sub: 'Checkout completion',
          },
          {
            label: 'Avg Customer LTV',
            value: `₹${customerMetrics.avgLtv.toLocaleString('en-IN')}`,
            icon: Users,
            color: 'text-purple-600 bg-purple-500/10',
            sub: `${customerMetrics.repeatRate}% repeat rate`,
          },
          {
            label: 'GST Output Tax',
            value: `₹${Math.round(metrics.totalGst).toLocaleString('en-IN')}`,
            icon: Percent,
            color: 'text-cyan-600 bg-cyan-500/10',
            sub: '18% tax liability',
          },
          {
            label: 'Discounts Claimed',
            value: `₹${Math.round(metrics.totalDiscount).toLocaleString('en-IN')}`,
            icon: Activity,
            color: 'text-rose-600 bg-rose-500/10',
            sub: `${metrics.refundCount} refunds`,
          },
        ].map((item, i) => (
          <div key={i} className="rounded-3xl border border-border/80 bg-white p-4 shadow-2xs flex flex-col justify-between gap-2.5 hover:border-accent/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">{item.label}</span>
              <div className={`h-7 w-7 rounded-xl flex items-center justify-center ${item.color} shrink-0`}>
                <item.icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <p className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground font-headline tabular-nums">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : item.value}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── TIME-SERIES REVENUE & VOLUME CHART ── */}
      <Card className="rounded-3xl border border-border/80 bg-white shadow-xs overflow-hidden">
        <CardHeader className="p-5 sm:p-6 pb-2 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold font-headline text-foreground flex items-center gap-2">
              <BarChart3 className="h-4.5 w-4.5 text-accent" />
              Revenue & Velocity Trajectory
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Historical trend over selected {timeRange.toUpperCase()} window
            </CardDescription>
          </div>

          <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border/60">
            <button
              onClick={() => setChartMode('revenue')}
              className={cn(
                "px-3 py-1 text-xs font-bold rounded-lg transition-all",
                chartMode === 'revenue' ? "bg-white text-foreground shadow-2xs" : "text-muted-foreground"
              )}
            >
              Gross Revenue (₹)
            </button>
            <button
              onClick={() => setChartMode('volume')}
              className={cn(
                "px-3 py-1 text-xs font-bold rounded-lg transition-all",
                chartMode === 'volume' ? "bg-white text-foreground shadow-2xs" : "text-muted-foreground"
              )}
            >
              Order Units
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-4">
          <div className="h-[300px] w-full">
            {isLoading ? (
              <div className="h-full w-full flex items-center justify-center bg-muted/20 rounded-2xl animate-pulse">
                <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
              </div>
            ) : timeSeriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === 'revenue' ? (
                  <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAnalyticsRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.6} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid hsl(var(--border))', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: '600' }}
                      formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Gross Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAnalyticsRev)" name="Revenue" />
                  </AreaChart>
                ) : (
                  <BarChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.6} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid hsl(var(--border))', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: '600' }}
                      formatter={(value) => [`${Number(value)} Orders`, 'Fulfillment Units']}
                    />
                    <Bar dataKey="orders" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={36} name="Orders" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                No transaction activity found in this timeframe.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── PRODUCT BREAKDOWN & CATEGORY MIX ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Top Products Leaderboard */}
        <Card className="lg:col-span-8 rounded-3xl border border-border/80 bg-white shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <CardTitle className="text-base font-bold font-headline text-foreground flex items-center gap-2">
                <Award className="h-4.5 w-4.5 text-amber-500" />
                Top Revenue Generating Assets
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Leaderboard of best performing digital items in selected period
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] font-bold uppercase">
              Top 5 Performers
            </Badge>
          </div>

          <div className="space-y-3">
            {topProducts.length > 0 ? (
              topProducts.map((p, idx) => (
                <div key={idx} className="p-3 sm:p-4 rounded-2xl border border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-accent/40 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="h-7 w-7 rounded-xl bg-white border border-border/70 flex items-center justify-center text-xs font-black font-mono text-muted-foreground shrink-0 shadow-2xs">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-foreground truncate">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">{p.units} units sold • {p.category}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/40">
                    <div className="text-left sm:text-right">
                      <p className="text-xs sm:text-sm font-extrabold text-foreground font-headline">
                        ₹{Math.round(p.revenue).toLocaleString('en-IN')}
                      </p>
                      <p className="text-[10px] font-bold text-emerald-600">{p.share}% contribution</p>
                    </div>

                    <div className="w-20 hidden sm:block">
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden border border-border/50">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${p.share}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No product sales recorded in this period.
              </div>
            )}
          </div>
        </Card>

        {/* Category Share Donut */}
        <Card className="lg:col-span-4 rounded-3xl border border-border/80 bg-white shadow-xs p-5 sm:p-6 space-y-4">
          <div className="border-b border-border/60 pb-3">
            <CardTitle className="text-base font-bold font-headline text-foreground flex items-center gap-2">
              <PieIcon className="h-4.5 w-4.5 text-accent" />
              Category Demand Mix
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Sales distribution across asset types
            </CardDescription>
          </div>

          <div className="flex flex-col items-center">
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
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '12px', border: '1px solid hsl(var(--border))' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 gap-2 w-full mt-3">
              {categoryMix.map((cat, index) => (
                <div key={cat.name} className="flex items-center justify-between p-2.5 rounded-2xl border border-border/60 bg-muted/20">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-xs font-bold text-foreground capitalize truncate">{cat.name}</span>
                  </div>
                  <span className="text-xs font-extrabold text-foreground font-headline tabular-nums">{cat.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

      </div>

    </div>
  );
}
