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
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';

export default function AdminAnalytics() {
  const db = useFirestore();
  
  const ordersQuery = useMemoFirebase(() => db ? collection(db, 'orders') : null, [db]);
  const { data: orders, loading } = useCollection(ordersQuery);

  const stats = useMemo(() => {
    if (!orders) return { total: 0, count: 0, aov: 0, conversion: '0%', pipeline: 0 };
    const paidOrders = orders.filter(o => o.status === 'paid');
    const total = paidOrders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0);
    const conv = orders.length > 0 ? ((paidOrders.length / orders.length) * 100).toFixed(1) : 0;
    
    return {
      total: total / 100,
      count: paidOrders.length,
      aov: paidOrders.length > 0 ? (total / paidOrders.length / 100).toFixed(0) : 0,
      conversion: `${conv}%`,
      pipeline: orders.length
    };
  }, [orders]);

  const revenueData = useMemo(() => {
    if (!orders) return [];
    
    const last6Months = Array.from({ length: 6 }).map((_, i) => subMonths(new Date(), i)).reverse();
    
    return last6Months.map(monthDate => {
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthOrders = orders.filter(o => {
        const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
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
    if (!orders) return [];
    
    const counts: Record<string, number> = {};
    orders.filter(o => o.status === 'paid').forEach(o => {
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
    <div className="space-y-12">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold font-headline text-midnight-ink">Intelligence Terminal</h1>
          <p className="text-slate-blue text-lg mt-1">Direct analysis of the digital store economy.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 h-12 rounded-xl border-white/10 px-6 font-bold">
            <Calendar className="h-4 w-4" />
            Historical Drift
          </Button>
          <Button className="gap-2 h-12 rounded-xl px-8 font-bold shadow-xl shadow-primary/20" onClick={() => window.print()}>
            <Download className="h-4 w-4" />
            Audit Report
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Purchase Conversion', value: stats.conversion, icon: Zap, color: 'text-primary' },
          { label: 'Average Ticket (AOV)', value: `₹${Number(stats.aov).toLocaleString()}`, icon: CreditCard, color: 'text-accent' },
          { label: 'Verified Volume', value: `₹${stats.total.toLocaleString()}`, icon: ShoppingBag, color: 'text-green-500' },
          { label: 'Customer Density', value: stats.count, icon: Users, color: 'text-blue-500' }
        ].map((item, i) => (
          <Card key={i} className="rounded-[2rem] border-white/5 bg-card/30 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
              <item.icon className="h-16 w-16" />
            </div>
            <CardContent className="pt-8">
              <p className="text-[10px] font-black uppercase tracking-widest text-ghost-gray mb-1">{item.label}</p>
              <h3 className="text-4xl font-bold font-headline tabular-nums mb-3 text-midnight-ink">
                {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : item.value}
              </h3>
              <p className="flex items-center text-[10px] font-bold text-green-500">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                Live Feed <span className="text-slate-blue ml-1 font-normal italic opacity-60">updating...</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 rounded-[2.5rem] border-white/5 bg-card/30 p-4">
          <CardHeader className="p-8">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle className="text-2xl font-headline text-midnight-ink">Capital Influx</CardTitle>
            </div>
            <CardDescription>Monthly correlation between revenue volume and fulfillment density.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full pt-4">
              {loading ? (
                <div className="h-full w-full flex items-center justify-center bg-muted/20 rounded-2xl animate-pulse">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
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
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'rgba(0,0,0,0.4)', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'rgba(0,0,0,0.4)', fontSize: 12, fontFamily: 'var(--font-mono)'}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                      cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" name="Revenue (INR)" />
                    <Area type="monotone" dataKey="orders" stroke="hsl(var(--accent))" strokeWidth={4} fillOpacity={0} name="Order Count" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-white/5 bg-card/30 p-4">
          <CardHeader className="p-8">
            <CardTitle className="text-2xl font-headline text-midnight-ink">Category Affinity</CardTitle>
            <CardDescription>Sales distribution across primary asset classes.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryMix}
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {categoryMix.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--primary))' : index === 1 ? 'hsl(var(--accent))' : '#10b981'} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 gap-4 w-full mt-6 px-4">
              {categoryMix.map((cat, index) => (
                <div key={cat.name} className="flex items-center justify-between p-3 rounded-2xl bg-white border border-stone-gray/10 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${index === 0 ? 'bg-primary' : index === 1 ? 'bg-accent' : 'bg-green-500'}`} />
                    <span className="text-sm font-bold text-midnight-ink">{cat.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-blue font-bold">{cat.value}% mix</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}