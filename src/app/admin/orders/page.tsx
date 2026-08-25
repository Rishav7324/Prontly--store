'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  Search, 
  MoreVertical, 
  Eye, 
  ShoppingBag,
  Filter,
  CheckCircle2,
  XCircle,
  Download,
  Loader2
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

export default function AdminOrders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const db = useFirestore();
  
  // No orderBy to avoid complex index requirements; sort in memory
  const ordersQuery = useMemoFirebase(() => db ? collection(db, 'orders') : null, [db]);
  const { data: allOrders, loading } = useCollection(ordersQuery);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'main') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const processedOrders = useMemo(() => {
    if (!allOrders) return [];
    
    return [...allOrders]
      .filter(order => {
        const matchesSearch = 
          order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.userEmail?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a: any, b: any) => {
        const dateA = a.createdAt?.toMillis?.() || 0;
        const dateB = b.createdAt?.toMillis?.() || 0;
        return dateB - dateA;
      });
  }, [allOrders, searchTerm, statusFilter]);

  const updateOrderStatus = async (id: string, newStatus: string) => {
    if (!db) return;
    const ref = doc(db, 'orders', id);
    await updateDoc(ref, { status: newStatus, ...(newStatus === 'refunded' ? { refundedAt: new Date() } : {}) });
    // Fire refund email to customer when admin marks refunded (best-effort)
    if (newStatus === 'refunded') {
      const order = allOrders?.find((o: any) => o.id === id);
      if (order) {
        void sendRefundEmail(order).catch(() => {});
      }
    }
    toast({ title: "Audit Update", description: `Record ${id.slice(-8)} transition to ${newStatus}.` });
  };

  const handleDownloadInvoice = async (order: any) => {
    setDownloadingId(order.id);
    try {
      const pdfBase64 = await generateInvoicePdf(order, settings);
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${pdfBase64}`;
      link.download = `tax-invoice-${order.id.slice(-8)}.pdf`;
      link.click();
      toast({ title: "Invoice Generated" });
    } catch (e) {
      toast({ variant: "destructive", title: "PDF Engine Offline" });
    } finally {
      setDownloadingId(null);
    }
  };

  const lifetimeStats = useMemo(() => {
    if (!allOrders) return { total: 0, count: 0 };
    const paid = allOrders.filter(o => o.status === 'paid');
    return {
      total: paid.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0) / 100,
      count: paid.length
    };
  }, [allOrders]);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-lg md:text-xl font-semibold">Orders</h1>
        <p className="text-xs text-muted-foreground">Monitoring the flow of verified digital transactions.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-xl shadow-sm p-4">
          <CardContent className="p-0 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium text-muted-foreground">Net Volume</p>
              <h3 className="text-xl md:text-2xl font-semibold mt-1">₹{lifetimeStats.total.toLocaleString('en-IN')}</h3>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500 opacity-20" />
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm p-4">
          <CardContent className="p-0 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium text-muted-foreground">Fulfillment Count</p>
              <h3 className="text-xl md:text-2xl font-semibold mt-1">{lifetimeStats.count}</h3>
            </div>
            <ShoppingBag className="h-8 w-8 text-blue-500 opacity-20" />
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="p-4 border-b">
          <div className="flex flex-col md:flex-row gap-3 justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search by ID, name or email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 rounded-lg"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select 
                className="bg-background border rounded-lg px-3 h-9 text-xs outline-none focus:ring-1 focus:ring-primary min-w-[140px]"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All States</option>
                <option value="paid">Verified Paid</option>
                <option value="pending">Pending Intent</option>
                <option value="failed">Failed Verification</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse bg-muted rounded-lg" />
              ))}
            </div>
          ) : processedOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[640px]">
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="pl-4">Reference</TableHead>
                    <TableHead>Purchaser</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedOrders.map((order: any) => (
                    <TableRow key={order.id} className="transition-colors">
                      <TableCell className="pl-4 px-3 py-2 font-mono text-xs font-medium">#…{order.id?.slice(-8)}</TableCell>
                      <TableCell className="px-3 py-2">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium leading-none">{order.userName || 'Anonymous'}</span>
                          <span className="text-[10px] text-muted-foreground mt-1">{order.userEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-[10px] text-muted-foreground font-mono whitespace-nowrap">
                        {order.createdAt ? format(new Date(order.createdAt.toMillis ? order.createdAt.toMillis() : order.createdAt), 'MMM dd, HH:mm') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-xs font-medium tabular-nums px-3 py-2">₹{((order.totalAmount || order.total || 0) / 100).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="px-3 py-2">
                        <Badge variant={order.status === 'paid' ? 'default' : 'secondary'} className={cn(
                          "text-[10px] font-medium px-1.5 py-0 border-none",
                          order.status === 'paid' ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"
                        )}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-4 px-3 py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-[10px] font-medium text-muted-foreground p-2">Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild className="rounded-md text-xs cursor-pointer">
                              <Link href={`/admin/orders/${order.id}`} className="flex items-center gap-2">
                                <Eye className="h-4 w-4" /> Inspect Record
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDownloadInvoice(order)} 
                              disabled={downloadingId === order.id} 
                              className="rounded-md text-xs cursor-pointer"
                            >
                              {downloadingId === order.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                              Export Invoice
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'paid')} className="rounded-md text-xs cursor-pointer focus:bg-green-500/10 focus:text-green-600">
                              <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Paid
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'refunded')} className="rounded-md text-xs cursor-pointer focus:bg-destructive/10 focus:text-destructive">
                              <XCircle className="mr-2 h-4 w-4" /> Mark Refunded
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-60 flex-col items-center justify-center text-center p-8">
              <ShoppingBag className="h-10 w-10 text-muted-foreground mb-3 opacity-20" />
              <h3 className="text-sm font-semibold">Registry Empty</h3>
              <p className="text-xs text-muted-foreground mt-1">No transaction records found matching your current parameters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
