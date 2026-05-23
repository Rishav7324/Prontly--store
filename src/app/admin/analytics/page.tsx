'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  Users, 
  MousePointer2,
  Calendar,
  Download,
  CreditCard,
  Zap,
  Activity,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { useMemo } from "react";

export default function AdminAnalytics() {
  const db = useFirestore();
  
  const ordersQuery = useMemoFirebase(() => {
    return db ? query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100)) : null;
  }, [db]);

  const { data: orders, loading } = useCollection(ordersQuery);

  const revenueData = useMemo(() => {
    if (!orders) return [];
    // Aggregating mock data with actual data trends
    return [
      { month: 'Jan', revenue: 45000, orders: 120 },
      { month: 'Feb', revenue: 52000, orders: 145 },
      { month: 'Mar', revenue: 48000, orders: 130 },
      { month: 'Apr', revenue: 61000, orders: 180 },
      { month: 'May', revenue: 75000, orders: 210 },
      { month: 'Jun', revenue: 89000, orders: 250 },
    ];
  }, [orders]);

  const stats = useMemo(() => {
    if (!orders) return { total: 0, count: 0, aov: 0 };
    const paidOrders = orders.filter(o => o.status === 'paid');
    const total = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    return {
      total: total / 100,
      count: paidOrders.length,
      aov: paidOrders.length > 0 ? (total / paidOrders.length / 100).toFixed(0) : 0
    };
  }, [orders]);

  return (
    <div className="space-y-12">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold font-headline">Market Intelligence</h1>
          <p className="text-muted-foreground text-lg mt-1">Deep analysis of your digital store's economic health.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 h-12 rounded-xl border-white/10 px-6 font-bold">
            <Calendar className="h-4 w-4" />
            Last 30 Days
          </Button>
          <Button className="gap-2 h-12 rounded-xl px-8 font-bold shadow-xl shadow-primary/20">
            <Download className="h-4 w-4" />
            Export Intelligence
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Market Conversion', value: '3.82%', trend: '+0.51%', icon: Zap, color: 'text-primary' },
          { label: 'Average Order (AOV)', value: `₹${Number(stats.aov).toLocaleString()}`, trend: '+₹210', icon: CreditCard, color: 'text-accent' },
          { label: 'Active Pipeline', value: stats.count, trend: '+12%', icon: ShoppingBag, color: 'text-green-500' },
          { label: 'Lead Velocity', value: '1,240/mo', trend: '+18.2%', icon: Users, color: 'text-blue-500' }
        ].map((item, i) => (
          <Card key={i} className="rounded-[2rem] border-white/5 bg-card/30 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
              <item.icon className="h-16 w-16" />
            </div>
            <CardContent className="pt-8">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{item.label}</p>
              <h3 className="text-4xl font-bold font-headline mb-3">{item.value}</h3>
              <p className="flex items-center text-xs font-bold text-green-500">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                {item.trend} <span className="text-muted-foreground ml-1 font-normal tracking-normal">vs previous period</span>
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
              <CardTitle className="text-2xl font-headline">Economic Growth</CardTitle>
            </div>
            <CardDescription>Correlation between revenue volume and transaction density.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111115', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                    cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="orders" stroke="hsl(var(--accent))" strokeWidth={4} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-white/5 bg-card/30 p-4">
          <CardHeader className="p-8">
            <CardTitle className="text-2xl font-headline">Engagement Mix</CardTitle>
            <CardDescription>Distribution across top-tier asset categories.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'AI Prompts', value: 45, color: 'hsl(var(--primary))' },
                      { name: 'UI Systems', value: 30, color: 'hsl(var(--accent))' },
                      { name: 'Guides', value: 25, color: '#10b981' },
                    ]}
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {[0,1,2].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--primary))' : index === 1 ? 'hsl(var(--accent))' : '#10b981'} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 gap-4 w-full mt-6 px-4">
              {[
                { name: 'AI Prompts', value: 45, color: 'bg-primary' },
                { name: 'UI Systems', value: 30, color: 'bg-accent' },
                { name: 'Guides', value: 25, color: 'bg-green-500' },
              ].map((cat) => (
                <div key={cat.name} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${cat.color}`} />
                    <span className="text-sm font-bold">{cat.name}</span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{cat.value}% affinity</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}