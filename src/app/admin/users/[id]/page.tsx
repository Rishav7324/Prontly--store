'use client';

import { use, useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Loader2,
  Mail,
  TrendingUp,
  ShoppingBag,
  Sparkles,
  ArrowUpRight,
  Phone,
  Send,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { listTemplates, sendTestEmail } from '@/app/actions/brevo-actions';
import { toast } from '@/hooks/use-toast';
import { adminJsonFetcher } from '@/lib/auth/admin-fetch';

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Profile resolved from the users list API
  const { data: users = [], isLoading: userLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminJsonFetcher('/api/admin/users'),
  });

  const profile = useMemo(
    () => (users as any[]).find((u) => u.uid === id) || null,
    [users, id]
  );

  const { data: settings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminJsonFetcher('/api/admin/settings'),
  });

  const { data: allOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => adminJsonFetcher('/api/admin/orders'),
    refetchInterval: 15000,
  });

  const orders = useMemo(
    () => [...(allOrders as any[])]
      .filter((o) => o.userId === id)
      .sort((a, b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0)),
    [allOrders, id]
  );

  const stats = useMemo(() => {
    const paidOrders = orders.filter(o => o.status === 'paid');
    return {
      count: paidOrders.length,
      total: paidOrders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0)
    };
  }, [orders]);

  useEffect(() => {
    if (isEmailModalOpen) {
      const fetchTemplates = async () => {
        setLoadingTemplates(true);
        const res = await listTemplates();
        if (res.success) setTemplates(res.data);
        setLoadingTemplates(false);
      };
      fetchTemplates();
    }
  }, [isEmailModalOpen]);

  const handleSendEmail = async () => {
    if (!selectedTemplateId || !profile?.email) return;
    setIsSending(true);

    // Sanitize settings for Server Action
    const plainEmailSettings = settings?.emailSettings ? {
      fromEmail: settings.emailSettings.fromEmail,
      senderName: settings.emailSettings.senderName
    } : undefined;

    const res = await sendTestEmail({
      to: profile.email,
      subject: `Update from ${settings?.siteName || 'Prontly Store'}`,
      templateId: selectedTemplateId,
      sender: plainEmailSettings
    });

    if (res.success) {
      toast({ title: "Email Dispatched", description: `Template sent to ${profile.email}` });
      setIsEmailModalOpen(false);
    } else {
      toast({ variant: "destructive", title: "Dispatch Failed", description: res.error });
    }
    setIsSending(false);
  };

  if (userLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-9 w-9 animate-spin text-primary" /></div>;
  }

  if (!profile) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4">
        <h1 className="text-lg font-semibold mb-3">Member not found</h1>
        <Button asChild className="h-9 rounded-lg text-xs"><Link href="/admin/users">Back to Members</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-lg shrink-0">
            <Link href="/admin/users"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={profile.photoUrl || profile.photoURL} />
            <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">{profile.displayName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-semibold truncate">{profile.displayName || 'Anonymous User'}</h1>
              <Badge variant="outline" className="shrink-0 text-[10px] font-medium capitalize">{profile.role}</Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
          </div>
        </div>

        <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
          <DialogTrigger asChild>
            <Button className="h-9 rounded-lg gap-2 text-xs shrink-0">
              <Mail className="h-3.5 w-3.5" />
              Send Outreach Email
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold">Template Outreach</DialogTitle>
              <DialogDescription className="text-xs">Send a pre-designed template from your verified sender: <strong>{settings?.emailSettings?.fromEmail || 'System Default'}</strong></DialogDescription>
            </DialogHeader>
            <div className="py-2 space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-muted-foreground">Select Template</label>
                <Select onValueChange={setSelectedTemplateId} value={selectedTemplateId}>
                  <SelectTrigger className="h-9 rounded-lg text-xs">
                    <SelectValue placeholder={loadingTemplates ? "Fetching templates..." : "Choose a message template"} />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!settings?.emailSettings?.fromEmail && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-yellow-600 dark:text-yellow-500 leading-relaxed">
                    Custom sender not configured. This will be sent from <strong>store.support@prontly.in</strong>. Verify your domain in Admin Settings.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={handleSendEmail}
                disabled={isSending || !selectedTemplateId}
                className="w-full h-9 rounded-lg text-xs"
              >
                {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Send className="h-3.5 w-3.5 mr-2" />}
                Dispatch to Customer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium text-muted-foreground">Lifetime Value (LTV)</p>
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-xl md:text-2xl font-semibold mt-2">₹{(stats.total / 100).toLocaleString('en-IN')}</p>
        </Card>
        <Card className="rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium text-muted-foreground">Paid Orders</p>
            <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <p className="text-xl md:text-2xl font-semibold mt-2">{stats.count}</p>
        </Card>
        <Card className="rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <p className="text-sm font-semibold">Retention Score</p>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground italic mt-2">
            {stats.count > 5
              ? "Super User. High LTV potential. Recommend Enterprise-tier source file updates."
              : stats.count > 0
              ? "Active Creator. Suggest specialized bundle based on previous category affinity."
              : "New User. Welcome sequence finalized. Monitoring lead velocity."}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-8 space-y-3">
          <Card className="rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 pb-2">
              <p className="text-sm font-semibold">Purchase Ledger</p>
              <p className="text-[10px] font-medium text-muted-foreground mt-0.5">Verified order records for this member.</p>
            </div>
            <CardContent className="p-0 pt-0">
              <div className="-mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto">
                <table className="w-full min-w-[640px] text-xs">
                  <thead className="bg-muted/40 border-y border-border">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Order ID</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Amount</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {ordersLoading ? (
                      [...Array(3)].map((_, i) => (
                        <tr key={i} className="animate-pulse"><td colSpan={5} className="h-9 bg-muted/20"></td></tr>
                      ))
                    ) : orders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-muted/40 transition-colors">
                        <td className="px-3 py-2 font-mono font-medium text-primary">#{order.id.slice(-8)}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {order.createdAt ? format(new Date(order.createdAt), 'MMM dd, yyyy') : 'N/A'}
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant={order.status === 'paid' ? 'default' : 'secondary'} className="text-[10px] font-medium capitalize">
                            {order.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">₹{((order.totalAmount || order.total || 0) / 100).toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right">
                          <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-lg text-muted-foreground hover:text-primary">
                            <Link href={`/admin/orders/${order.id}`}><ArrowUpRight className="h-3.5 w-3.5" /></Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {!ordersLoading && orders.length === 0 && (
                      <tr><td colSpan={5} className="py-12 text-center text-xs text-muted-foreground">No recorded transactions for this profile.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-3">
          <Card className="rounded-xl shadow-sm border p-4">
            <p className="text-sm font-semibold mb-2">Account Details</p>
            <div>
              <div className="flex items-center justify-between py-1.5 text-xs border-b border-border/60">
                <span className="text-[10px] font-medium text-muted-foreground">Verified Email</span>
                <span className="font-medium truncate ml-4 max-w-[60%]" title={profile.email}>{profile.email}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 text-xs border-b border-border/60">
                <span className="text-[10px] font-medium text-muted-foreground">Member Since</span>
                <span className="font-medium">
                  {profile.createdAt ? format(new Date(profile.createdAt), 'MMMM yyyy') : 'Recently'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 text-xs border-b border-border/60">
                <span className="text-[10px] font-medium text-muted-foreground">Global Role</span>
                <Badge variant="outline" className="text-[10px] font-medium capitalize border-primary/20 text-primary">{profile.role}</Badge>
              </div>
              {profile.phone && (
                <div className="flex items-center justify-between py-1.5 text-xs border-b border-border/60">
                  <span className="text-[10px] font-medium text-muted-foreground">Contact Phone</span>
                  <span className="font-medium">{profile.phone}</span>
                </div>
              )}
            </div>
            <Button className="mt-4 w-full h-9 rounded-lg gap-2 text-xs" variant="outline" asChild>
              <a href={`mailto:${profile.email}`}>
                <ExternalLink className="h-3.5 w-3.5" /> Launch Mail Client
              </a>
            </Button>
          </Card>

          <Card className="rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-sm font-semibold">Quick Actions</p>
            </div>
            <div className="flex items-center justify-between py-1.5 text-xs border-b border-border/60">
              <span className="text-[10px] font-medium text-muted-foreground">Direct Email</span>
              <a href={`mailto:${profile.email}`} className="text-xs font-medium text-primary hover:underline truncate ml-4 max-w-[60%]">{profile.email}</a>
            </div>
            <div className="flex items-center justify-between py-1.5 text-xs">
              <span className="text-[10px] font-medium text-muted-foreground">User ID</span>
              <span className="font-mono font-medium text-muted-foreground">#{id.slice(-8)}</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
