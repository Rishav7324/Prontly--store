
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Package, Clock, ExternalLink, Settings, LogOut, LayoutDashboard, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const mockOrders = [
  {
    id: "ORD-7749",
    date: "May 12, 2026",
    status: "Completed",
    total: "₹1,499",
    items: [
      { name: "Master AI Copywriting Prompt Pack", type: "Prompt Pack" }
    ]
  },
  {
    id: "ORD-6211",
    date: "April 28, 2026",
    status: "Completed",
    total: "₹3,999",
    items: [
      { name: "SaaS Starter UI Dashboard Kit", type: "UI Kit" }
    ]
  }
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 space-y-2">
            <Button variant="secondary" className="w-full justify-start gap-3 bg-primary/10 text-primary hover:bg-primary/20">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3">
              <ShoppingBag className="h-4 w-4" />
              Purchases
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Download className="h-4 w-4" />
              Downloads
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <div className="pt-4 mt-4 border-t border-border">
              <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-8">
            <header>
              <h1 className="text-3xl font-bold font-headline">Welcome back, Alex!</h1>
              <p className="text-muted-foreground">Manage your digital library and track your recent orders.</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Card className="bg-card border-white/5">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold font-headline">12</div>
                  <div className="text-sm text-muted-foreground">Digital Assets</div>
                </CardContent>
              </Card>
              <Card className="bg-card border-white/5">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold font-headline">₹15,420</div>
                  <div className="text-sm text-muted-foreground">Total Spent</div>
                </CardContent>
              </Card>
              <Card className="bg-card border-white/5">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold font-headline">2</div>
                  <div className="text-sm text-muted-foreground">Active Subscriptions</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Purchases */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-headline">Your Library</h2>
                <Button variant="link" className="text-primary">View All</Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mockOrders.map((order) => (
                  <Card key={order.id} className="overflow-hidden bg-card border-white/5 group">
                    <div className="flex items-center p-4 gap-4">
                      <div className="relative h-16 w-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                        <Image src={`https://picsum.photos/seed/${order.id}/200/200`} alt="Product" fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold truncate group-hover:text-primary transition-colors">{order.items[0].name}</h4>
                        <p className="text-xs text-muted-foreground">{order.items[0].type} • Purchased {order.date}</p>
                      </div>
                      <Button size="icon" variant="secondary" className="rounded-full flex-shrink-0">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Order History Table */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold font-headline">Recent Orders</h2>
              <div className="rounded-xl border border-white/5 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold">Order ID</th>
                      <th className="px-6 py-4 text-left font-semibold">Date</th>
                      <th className="px-6 py-4 text-left font-semibold">Status</th>
                      <th className="px-6 py-4 text-left font-semibold text-right">Amount</th>
                      <th className="px-6 py-4 text-left font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {mockOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4 font-code text-primary">{order.id}</td>
                        <td className="px-6 py-4 text-muted-foreground">{order.date}</td>
                        <td className="px-6 py-4">
                          <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/10 border-none">
                            {order.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right font-bold">{order.total}</td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm" className="gap-2">
                            Invoice
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
