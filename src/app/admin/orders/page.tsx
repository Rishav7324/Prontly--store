'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Search,
  MoreVertical,
  Eye,
  ShoppingBag,
  Filter,
  CheckCircle2,
  XCircle,
  Download,
  Loader2,
  CreditCard,
  X,
  FileText,
  Calendar,
  DollarSign
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import Link from 'next/link';
import { generateInvoicePdf, sendRefundEmail } from '@/app/actions/email-actions';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  return json.success ? json.data : [];
};

export default function AdminOrders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: allOrders = [], isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => fetcher('/api/admin/orders'),
    refetchInterval: 15000,
  });

  const { data: settings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings');
      const json = await res.json();
      return json.data || null;
    },
  });

  const processedOrders = useMemo(() => {
    return [...(allOrders as any[])]
      .filter(order => {
        const matchesSearch =
          order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.userEmail?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }, [allOrders, searchTerm, statusFilter]);

  const updateOrderStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) throw new Error();
      if (newStatus === 'refunded') {
        const order = (allOrders as any[]).find((o) => o.id === id);
        if (order) {
          void sendRefundEmail(order).catch(() => {});
        }
      }
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast({ title: "Status Updated", description: `Order #${id.slice(-8)} is now marked as ${newStatus}.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not update order status in database." });
    }
  };

  const handleDownloadInvoice = async (order: any) => {
    setDownloadingId(order.id);
    try {
      const pdfBase64 = await generateInvoicePdf(order, settings);
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${pdfBase64}`;
      link.download = `tax-invoice-${order.id.slice(-8)}.pdf`;
      link.click();
      toast({ title: "Invoice PDF Generated", description: `Downloaded tax-invoice-${order.id.slice(-8)}.pdf` });
    } catch (e) {
      toast({ variant: "destructive", title: "PDF Generation Failed", description: "Ensure invoice settings are configured." });
    } finally {
      setDownloadingId(null);
    }
  };

  const lifetimeStats = useMemo(() => {
    const paid = (allOrders as any[]).filter(o => o.status === 'paid');
    return {
      total: paid.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0) / 100,
      count: paid.length
    };
  }, [allOrders]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold text-accent mb-1.5 uppercase">
            COMMERCE LEDGER
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-headline">
            Orders & Settlements
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Monitor incoming Razorpay payments, download tax invoices, and manage refund states.
          </p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-3xl border border-border/80 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Net Revenue
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-headline mt-1">
              ₹{lifetimeStats.total.toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Verified completed payments</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-3xl border border-border/80 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Fulfilled Orders
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-headline mt-1">
              {lifetimeStats.count}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Automated electronic deliveries</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <ShoppingBag className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="rounded-3xl border border-border/80 bg-white shadow-xs overflow-hidden">
        
        {/* Search & Filter Bar */}
        <CardHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by Order ID, customer name, email…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9.5 pr-8 h-10 rounded-2xl bg-white border-border/80 text-xs focus-visible:ring-1 focus-visible:ring-accent shadow-2xs"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              {[
                ['all', 'All Orders'],
                ['paid', 'Paid'],
                ['pending', 'Pending'],
                ['refunded', 'Refunded'],
                ['failed', 'Failed'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
                    statusFilter === key
                      ? "bg-zinc-950 text-white border-zinc-950 shadow-xs"
                      : "bg-white border-border/80 text-muted-foreground hover:border-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 w-full animate-pulse bg-muted rounded-2xl" />
              ))}
            </div>
          ) : processedOrders.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="px-6 py-3.5 text-xs font-bold text-muted-foreground">Reference</TableHead>
                      <TableHead className="px-6 py-3.5 text-xs font-bold text-muted-foreground">Customer</TableHead>
                      <TableHead className="px-6 py-3.5 text-xs font-bold text-muted-foreground">Date & Time</TableHead>
                      <TableHead className="px-6 py-3.5 text-xs font-bold text-muted-foreground">Amount</TableHead>
                      <TableHead className="px-6 py-3.5 text-xs font-bold text-muted-foreground">Status</TableHead>
                      <TableHead className="px-6 py-3.5 text-right text-xs font-bold text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedOrders.map((order: any) => (
                      <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="px-6 py-3.5 font-mono text-xs font-bold text-foreground">
                          <Link href={`/admin/orders/${order.id}`} className="hover:underline text-accent">
                            #{order.id?.slice(-8)}
                          </Link>
                        </TableCell>
                        <TableCell className="px-6 py-3.5">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-foreground">{order.userName || 'Customer'}</span>
                            <span className="text-[11px] text-muted-foreground">{order.userEmail}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-3.5 text-xs text-muted-foreground font-mono whitespace-nowrap">
                          {order.createdAt ? format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm') : 'N/A'}
                        </TableCell>
                        <TableCell className="px-6 py-3.5 text-sm font-extrabold tabular-nums text-foreground font-headline">
                          ₹{((order.totalAmount || order.total || 0) / 100).toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="px-6 py-3.5">
                          <Badge variant="outline" className={cn(
                            "text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize",
                            order.status === 'paid' ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                            order.status === 'refunded' ? "border-rose-200 bg-rose-50 text-rose-700" :
                            order.status === 'failed' ? "border-red-200 bg-red-50 text-red-700" :
                            "border-amber-200 bg-amber-50 text-amber-700"
                          )}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-3.5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8.5 w-8.5 rounded-xl border border-transparent hover:border-border/70">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 rounded-2xl p-1.5 shadow-lg border-border/80">
                              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">Order Operations</DropdownMenuLabel>
                              <DropdownMenuItem asChild className="rounded-xl text-xs font-medium cursor-pointer p-2">
                                <Link href={`/admin/orders/${order.id}`} className="flex items-center gap-2">
                                  <Eye className="h-4 w-4 text-accent" /> View Order Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDownloadInvoice(order)}
                                disabled={downloadingId === order.id}
                                className="rounded-xl text-xs font-medium cursor-pointer p-2"
                              >
                                {downloadingId === order.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4 text-muted-foreground" />}
                                Download Tax Invoice
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'paid')} className="rounded-xl text-xs font-semibold cursor-pointer p-2 focus:bg-emerald-500/10 focus:text-emerald-700">
                                <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" /> Mark as Paid
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'refunded')} className="rounded-xl text-xs font-semibold cursor-pointer p-2 focus:bg-rose-500/10 focus:text-rose-700 text-rose-600">
                                <XCircle className="mr-2 h-4 w-4" /> Mark as Refunded
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card Stack */}
              <div className="md:hidden divide-y divide-border/60">
                {processedOrders.map((order: any) => (
                  <div key={order.id} className="p-4 space-y-2.5 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-accent">#{order.id?.slice(-8)}</span>
                      <Badge variant="outline" className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full capitalize",
                        order.status === 'paid' ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                        order.status === 'refunded' ? "border-rose-200 bg-rose-50 text-rose-700" :
                        "border-amber-200 bg-amber-50 text-amber-700"
                      )}>
                        {order.status}
                      </Badge>
                    </div>

                    <div className="flex items-start justify-between text-xs">
                      <div>
                        <p className="font-bold text-foreground">{order.userName || 'Customer'}</p>
                        <p className="text-[11px] text-muted-foreground">{order.userEmail}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                          {order.createdAt ? format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm') : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-base text-foreground font-headline">
                          ₹{((order.totalAmount || order.total || 0) / 100).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/40">
                      <Button asChild variant="outline" size="sm" className="h-8 rounded-xl text-xs px-3">
                        <Link href={`/admin/orders/${order.id}`}>Inspect</Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-xl text-xs px-3"
                        onClick={() => handleDownloadInvoice(order)}
                        disabled={downloadingId === order.id}
                      >
                        {downloadingId === order.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Invoice'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-56 flex-col items-center justify-center text-center p-8">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mb-3 opacity-25" />
              <h3 className="text-sm font-bold text-foreground">No Transactions Found</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                No orders match your filter criteria or search query.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
