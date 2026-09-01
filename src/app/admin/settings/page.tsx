'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Save,
  Globe,
  Loader2,
  Home,
  CreditCard,
  Server,
  Settings,
  Mail,
  Receipt,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { logAdminAction } from '@/lib/admin-logs';
import { adminJsonFetcher, adminFetch } from '@/lib/auth/admin-fetch';

export default function AdminSettings() {
  const { user } = useUser();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminJsonFetcher('/api/admin/settings'),
  });

  const [formData, setFormData] = useState<any>({
    siteName: 'Prontly Store',
    siteDescription: 'Premium Digital Asset Marketplace',
    logoUrl: '',
    contactEmail: '',
    gstNumber: '',
    razorpayKeyId: '',
    announcementBar: { isActive: false, text: '', link: '', backgroundColor: '#5b52d6', textColor: '#ffffff' },
    homepageHeroCopy: { headline: "", subheadline: "", badge: "" },
    featuredProductIds: [],
    emailSettings: { fromEmail: '', senderName: '' },
    invoiceSettings: { businessName: '', address: '', color: '#5b52d6', footerText: '', logoUrl: '' }
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData((prev: any) => ({ ...prev, ...settings }));
    }
  }, [settings]);

  const handleChange = (e: any) => {
    const { id, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      const res = await adminFetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Save failed');

      logAdminAction({
        adminId: user.uid, adminEmail: user.email || 'unknown',
        action: 'UPDATE', resourceType: 'SETTINGS', resourceId: 'main', details: { type: 'global_config' }
      });
      toast({ title: "Settings Saved", description: "Global store configurations updated successfully." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save Failed", description: error?.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold text-accent mb-1.5 uppercase">
            STORE ENGINE
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-headline">
            System Settings
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Configure store branding, payment gateway credentials, and automated notifications.
          </p>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={isSaving} 
          className="h-10 rounded-2xl px-5 text-xs font-bold bg-zinc-950 text-white hover:bg-zinc-800 shadow-md active:scale-[0.98] transition-all gap-2"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-5">
        <TabsList className="bg-muted/50 p-1.5 rounded-2xl h-auto flex flex-wrap gap-1 border border-border/60">
          <TabsTrigger value="general" className="gap-2 px-3.5 py-2 rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs">
            <Globe className="h-3.5 w-3.5 text-accent" /> General Branding
          </TabsTrigger>
          <TabsTrigger value="homepage" className="gap-2 px-3.5 py-2 rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs">
            <Home className="h-3.5 w-3.5 text-accent" /> Hero Copy
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2 px-3.5 py-2 rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs">
            <CreditCard className="h-3.5 w-3.5 text-accent" /> Gateway
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2 px-3.5 py-2 rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs">
            <Server className="h-3.5 w-3.5 text-accent" /> SMTP Sender
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2 px-3.5 py-2 rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs">
            <Receipt className="h-3.5 w-3.5 text-accent" /> Invoice Specs
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: General */}
        <TabsContent value="general" className="space-y-4">
          <Card className="rounded-3xl border border-border/80 bg-white shadow-xs p-5 sm:p-6">
            <CardHeader className="p-0 pb-4 border-b border-border/60">
              <CardTitle className="text-base font-bold font-headline text-foreground">
                Store Identity & Tax
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Branding elements displayed across the customer-facing storefront and emails.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="siteName" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Store Name</Label>
                  <Input id="siteName" value={formData.siteName || ''} onChange={handleChange} className="h-10 rounded-xl text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contactEmail" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Support Contact Email</Label>
                  <Input id="contactEmail" value={formData.contactEmail || ''} onChange={handleChange} className="h-10 rounded-xl text-xs" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="siteDescription" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Site Description (SEO)</Label>
                <Input id="siteDescription" value={formData.siteDescription || ''} onChange={handleChange} className="h-10 rounded-xl text-xs" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="logoUrl" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Storefront Logo URL</Label>
                  <Input id="logoUrl" value={formData.logoUrl || ''} onChange={handleChange} className="h-10 rounded-xl text-xs font-mono" placeholder="https://..." />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gstNumber" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">GSTIN / Tax Identification</Label>
                  <Input id="gstNumber" value={formData.gstNumber || ''} onChange={handleChange} className="h-10 rounded-xl text-xs font-mono" placeholder="22AAAAA0000A1Z5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Homepage */}
        <TabsContent value="homepage" className="space-y-4">
          <Card className="rounded-3xl border border-border/80 bg-white shadow-xs p-5 sm:p-6">
            <CardHeader className="p-0 pb-4 border-b border-border/60">
              <CardTitle className="text-base font-bold font-headline text-foreground">
                Homepage Hero Text
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Top landing section marketing messaging.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="headline" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Primary Headline</Label>
                <Input
                  id="headline"
                  value={formData.homepageHeroCopy?.headline || ''}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, homepageHeroCopy: { ...prev.homepageHeroCopy, headline: e.target.value } }))}
                  className="h-10 rounded-xl text-xs"
                  placeholder="Master AI with Precision-Crafted Prompts"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subheadline" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Subheadline</Label>
                <Input
                  id="subheadline"
                  value={formData.homepageHeroCopy?.subheadline || ''}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, homepageHeroCopy: { ...prev.homepageHeroCopy, subheadline: e.target.value } }))}
                  className="h-10 rounded-xl text-xs"
                  placeholder="Verified, production-tested prompts and templates."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Payments */}
        <TabsContent value="payments" className="space-y-4">
          <Card className="rounded-3xl border border-border/80 bg-white shadow-xs p-5 sm:p-6">
            <CardHeader className="p-0 pb-4 border-b border-border/60">
              <CardTitle className="text-base font-bold font-headline text-foreground">
                Razorpay Payment Gateway
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Public API credentials for the Razorpay Checkout SDK.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="razorpayKeyId" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Razorpay Key ID</Label>
                <Input 
                  id="razorpayKeyId" 
                  value={formData.razorpayKeyId || ''} 
                  onChange={handleChange} 
                  className="h-10 rounded-xl text-xs font-mono" 
                  placeholder="rzp_test_..." 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Email */}
        <TabsContent value="email" className="space-y-4">
          <Card className="rounded-3xl border border-border/80 bg-white shadow-xs p-5 sm:p-6">
            <CardHeader className="p-0 pb-4 border-b border-border/60">
              <CardTitle className="text-base font-bold font-headline text-foreground">
                Email Dispatch Identity
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Address and name used for order receipts and download link delivery.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fromEmail" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">From Address</Label>
                  <Input
                    id="fromEmail"
                    value={formData.emailSettings?.fromEmail || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, emailSettings: { ...prev.emailSettings, fromEmail: e.target.value } }))}
                    className="h-10 rounded-xl text-xs font-mono"
                    placeholder="orders@prontly.store"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="senderName" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Sender Display Name</Label>
                  <Input
                    id="senderName"
                    value={formData.emailSettings?.senderName || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, emailSettings: { ...prev.emailSettings, senderName: e.target.value } }))}
                    className="h-10 rounded-xl text-xs"
                    placeholder="Prontly Store"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Invoices */}
        <TabsContent value="invoices" className="space-y-4">
          <Card className="rounded-3xl border border-border/80 bg-white shadow-xs p-5 sm:p-6">
            <CardHeader className="p-0 pb-4 border-b border-border/60">
              <CardTitle className="text-base font-bold font-headline text-foreground">
                PDF Invoice Configuration
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Business details printed on customer tax invoices.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Business Legal Name</Label>
                  <Input
                    value={formData.invoiceSettings?.businessName || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, invoiceSettings: { ...prev.invoiceSettings, businessName: e.target.value } }))}
                    className="h-10 rounded-xl text-xs"
                    placeholder="Prontly Technologies Pvt Ltd"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Registered Address</Label>
                  <Input
                    value={formData.invoiceSettings?.address || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, invoiceSettings: { ...prev.invoiceSettings, address: e.target.value } }))}
                    className="h-10 rounded-xl text-xs"
                    placeholder="Bengaluru, Karnataka, India"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
