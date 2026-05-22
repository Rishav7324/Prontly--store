
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
  FileText,
  Ticket,
  Star,
  Activity
} from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import Link from "next/link";
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

const chartData = [
  { name: 'Mon', revenue: 4000 },
  { name: 'Tue', revenue: 3000 },
  { name: 'Wed', revenue: 5000 },
  { name: 'Thu', revenue: 2780 },
  { name: 'Fri', revenue: 1890 },
  { name: 'Sat', revenue: 2390 },
  { name: 'Sun', revenue: 3490 },
];

export default function AdminDashboard() {
  const db = useFirestore();
  
  const ordersQuery = useMemoFirebase(() => db ? query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5)) : null, [db]);
  const { data: recentOrders, loading: ordersLoading } = useCollection(ordersQuery);

  const productsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), orderBy('salesCount', 'desc'), limit(5)) : null, [db]);
  const { data: topProducts, loading: productsLoading } = useCollection(productsQuery);

  const stats = [
    { name: 'Total Revenue', value: '₹1,24,500', trend: '+12.5%', isUp: true, icon: TrendingUp },
    { name: 'Active Users', value: '1,248', trend: '+5.2%', isUp: true, icon: UsersIcon },
    { name: 'Total Orders', value: '452', trend: '-2.1%', isUp: false, icon: OrderIcon },
    { name: 'Live Products', value: '86', trend: '+12%', isUp: true, icon: ProductIcon },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Overview</h1>
          <p className="text-muted-foreground">Welcome to your store management dashboard.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/analytics">
              <Activity className="mr-2 h-4 w-4" />
              Detailed Analytics
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="bg-card/30 backdrop-blur-sm border-white/5 relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
              <stat.icon size={80} />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-headline">{stat.value}</div>
              <p className="flex items-center text-xs mt-2">
                {stat.isUp ? (
                  <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDownRight className="mr-1 h-3 w-3 text-destructive" />
                )}
                <span className={stat.isUp ? "text-green-500" : "text-destructive font-bold"}>
                  {stat.trend}
                </span>
                <span className="ml-1 text-muted-foreground">vs last month</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden border-white/5 bg-card/30">
          <CardHeader>
            <CardTitle>Revenue Insights</CardTitle>
            <CardDescription>Daily performance of your marketplace sales.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="h-[320px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
                    itemStyle={{ color: 'hsl(var(--primary))' }}
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
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-white/5 bg-card/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Top Sellers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {productsLoading ? (
                [...Array(3)].map((_, i) => <div key={i} className="h-12 w-full animate-pulse bg-muted rounded-xl" />)
              ) : topProducts?.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded bg-muted overflow-hidden shrink-0 border border-white/5">
                      <Image src={p.images?.[0] || 'https://picsum.photos/seed/placeholder/100/100'} alt={p.name} width={40} height={40} className="object-cover" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold truncate">{p.name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{p.categorySlug}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold">{p.salesCount || 0} sales</span>
                    <span className="text-[10px] text-green-500 font-bold">₹{(p.price / 100).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button variant="outline" size="sm" className="justify-start gap-3 rounded-xl" asChild>
                <Link href="/admin/settings?tab=homepage">
                  <Star className="h-4 w-4" />
                  Feature Products
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="justify-start gap-3 rounded-xl" asChild>
                <Link href="/admin/coupons">
                  <Ticket className="h-4 w-4" />
                  Active Coupons
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="justify-start gap-3 rounded-xl" asChild>
                <Link href="/admin/blog">
                  <FileText className="h-4 w-4" />
                  Write Article
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-white/5 bg-card/30">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Track the latest sales activity.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-primary font-bold">
            <Link href="/admin/orders">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 w-full animate-pulse bg-muted rounded-xl" />
              ))}
            </div>
          ) : recentOrders && recentOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order: any) => (
                  <TableRow key={order.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="font-code text-primary text-xs uppercase">#{order.id?.slice(-6)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{order.userName || 'Guest'}</span>
                        <span className="text-[10px] text-muted-foreground">{order.userEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.status === 'paid' ? 'default' : 'secondary'} className="text-[9px] uppercase font-bold px-2 py-0.5">
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-sm">₹{(order.total / 100).toLocaleString('en-IN')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center text-center">
              <OrderIcon className="h-10 w-10 text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground text-sm">No sales records yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
