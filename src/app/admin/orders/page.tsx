'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { generateInvoicePdf } from '@/app/actions/email-actions';
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
    await updateDoc(ref, { status: newStatus });
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
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Order Registry</h1>
          <p className="text-muted-foreground">Monitoring the flow of verified digital transactions.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-green-500/10 border-green-500/20 rounded-3xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-green-600">Net Volume</p>
                <h3 className="text-2xl font-bold font-headline mt-1">₹{lifetimeStats.total.toLocaleString('en-IN')}</h3>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/20 rounded-3xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-blue-600">Fulfillment Count</p>
                <h3 className="text-2xl font-bold font-headline mt-1">{lifetimeStats.count}</h3>
              </div>
              <ShoppingBag className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[2.5rem] border-white/5 bg-card/30 overflow-hidden">
        <CardHeader className="p-4 border-b border-white/5">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search by ID, name or email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background/50 rounded-xl h-11 border-white/5"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select 
                className="bg-background/50 border-white/5 border rounded-xl px-4 py-2 text-xs outline-none focus:ring-1 focus:ring-primary h-11 min-w-[140px]"
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
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 w-full animate-pulse bg-muted rounded-2xl" />
              ))}
            </div>
          ) : processedOrders.length > 0 ? (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-white/5">
                  <TableHead className="pl-8">Reference</TableHead>
                  <TableHead>Purchaser</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Audit State</TableHead>
                  <TableHead className="text-right pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedOrders.map((order: any) => (
                  <TableRow key={order.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                    <TableCell className="pl-8 font-mono text-primary uppercase text-[10px] font-bold tracking-widest">#{order.id?.slice(-8)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm leading-none">{order.userName || 'Anonymous'}</span>
                        <span className="text-[10px] text-muted-foreground mt-1">{order.userEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground font-mono">
                      {order.createdAt ? format(new Date(order.createdAt.toMillis ? order.createdAt.toMillis() : order.createdAt), 'MMM dd, HH:mm') : 'N/A'}
                    </TableCell>
                    <TableCell className="font-bold text-sm">₹{((order.totalAmount || order.total || 0) / 100).toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      <Badge variant={order.status === 'paid' ? 'default' : 'secondary'} className={cn(
                        "text-[9px] uppercase font-black px-2 py-0.5 border-none",
                        order.status === 'paid' ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
                      )}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-card border-white/10 rounded-2xl p-2 shadow-2xl">
                          <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest p-3">Audit guidelines</DropdownMenuLabel>
                          <DropdownMenuItem asChild className="rounded-xl focus:bg-primary/10 focus:text-primary p-3">
                            <Link href={`/admin/orders/${order.id}`} className="cursor-pointer flex items-center">
                              <Eye className="mr-3 h-4 w-4" /> Inspect Record
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDownloadInvoice(order)} 
                            disabled={downloadingId === order.id} 
                            className="rounded-xl focus:bg-primary/10 focus:text-primary p-3 cursor-pointer"
                          >
                            {downloadingId === order.id ? <Loader2 className="mr-3 h-4 w-4 animate-spin" /> : <Download className="mr-3 h-4 w-4" />}
                            Export Invoice
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/5" />
                          <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'paid')} className="rounded-xl focus:bg-green-500/10 focus:text-green-500 p-3 cursor-pointer">
                            <CheckCircle2 className="mr-3 h-4 w-4" /> Validate Payment
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'refunded')} className="rounded-xl focus:bg-destructive/10 focus:text-destructive p-3 cursor-pointer">
                            <XCircle className="mr-3 h-4 w-4" /> Mark Refunded
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-60 flex-col items-center justify-center text-center p-8">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4 opacity-10" />
              <h3 className="text-xl font-bold font-headline">Registry Empty</h3>
              <p className="text-muted-foreground text-sm">No transaction records found matching your current parameters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
