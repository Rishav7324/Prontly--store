
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
  ArrowRight
} from "lucide-react";
import { useCollection, useFirestore } from "@/firebase";
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

export default function AdminDashboard() {
  const db = useFirestore();
  
  // Recent Orders Query
  const ordersQuery = db ? query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5)) : null;
  const { data: recentOrders, loading: ordersLoading } = useCollection(ordersQuery);

  // Stats (Mocked or denormalized from site_settings/main in production)
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
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">{stat.value}</div>
              <p className="flex items-center text-xs mt-1">
                {stat.isUp ? (
                  <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDownRight className="mr-1 h-3 w-3 text-destructive" />
                )}
                <span className={stat.isUp ? "text-green-500" : "text-destructive"}>
                  {stat.trend}
                </span>
                <span className="ml-1 text-muted-foreground">from last month</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Track the latest sales from your store.</CardDescription>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 w-full animate-pulse bg-muted rounded" />
                ))}
              </div>
            ) : recentOrders && recentOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-code text-primary">#{order.id?.slice(-6).toUpperCase()}</TableCell>
                      <TableCell>{order.userName || order.userEmail}</TableCell>
                      <TableCell>
                        <Badge variant={order.status === 'paid' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold">₹{(order.total / 100).toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex h-40 flex-col items-center justify-center text-center">
                <p className="text-muted-foreground">No orders yet.</p>
                <Button variant="link" size="sm" asChild>
                  <Link href="/admin/orders">View Order Management</Link>
                </Button>
              </div>
            )}
            <div className="mt-4 border-t pt-4">
              <Button variant="ghost" className="w-full gap-2" asChild>
                <Link href="/admin/orders">
                  View All Orders
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links & Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Button variant="outline" className="justify-start gap-3" asChild>
                <Link href="/admin/products/new">
                  <Plus className="h-4 w-4" />
                  New Product
                </Link>
              </Button>
              <Button variant="outline" className="justify-start gap-3" asChild>
                <Link href="/admin/blog/new">
                  <FileText className="h-4 w-4" />
                  New Blog Post
                </Link>
              </Button>
              <Button variant="outline" className="justify-start gap-3" asChild>
                <Link href="/admin/coupons">
                  <Ticket className="h-4 w-4" />
                  Manage Coupons
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
              <CardDescription>Check out the Prontly Admin Guide for tips on managing your store.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="link" className="p-0 text-primary">
                Read Documentation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FileText({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>
    </svg>
  );
}
