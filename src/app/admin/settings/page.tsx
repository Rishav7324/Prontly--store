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
  Server
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { logAdminAction } from '@/lib/admin-logs';

export default function AdminSettings() {
  const { user } = useUser();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings');
      const json = await res.json();
      return json.data || null;
    },
  });

  const [formData, setFormData] = useState<any>({
    siteName: 'Prontly Store',
    siteDescription: 'Premium Digital Asset Marketplace',
    logoUrl: '',
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
      const res = await fetch('/api/admin/settings', {
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
      toast({ title: "Settings saved" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save Failed", description: error?.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 pb-16">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-semibold">Store Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Global configuration for your digital marketplace.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-1.5 h-8 rounded-lg px-3 text-xs">
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save Changes
        </Button>
      </header>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="bg-muted/50 p-1 rounded-lg h-auto flex flex-wrap">
          <TabsTrigger value="general" className="gap-1.5 px-3 py-1.5 rounded-md text-xs"><Globe className="h-3.5 w-3.5" /> General</TabsTrigger>
          <TabsTrigger value="homepage" className="gap-1.5 px-3 py-1.5 rounded-md text-xs"><Home className="h-3.5 w-3.5" /> Homepage</TabsTrigger>
          <TabsTrigger value="payments" className="gap-1.5 px-3 py-1.5 rounded-md text-xs"><CreditCard className="h-3.5 w-3.5" /> Payments</TabsTrigger>
          <TabsTrigger value="email" className="gap-1.5 px-3 py-1.5 rounded-md text-xs"><Server className="h-3.5 w-3.5" /> SMTP</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card className="rounded-xl shadow-sm p-4 border-0">
            <CardHeader className="p-0 pb-3 space-y-0.5">
              <CardTitle className="text-sm font-semibold">Store Identity</CardTitle>
              <CardDescription className="text-xs">Basic branding shown across your storefront.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="siteName" className="text-[10px] font-medium text-muted-foreground">Site Name</Label>
                <Input id="siteName" value={formData.siteName || ''} onChange={handleChange} className="h-9 rounded-lg text-xs" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="siteDescription" className="text-[10px] font-medium text-muted-foreground">Site Description</Label>
                <Input id="siteDescription" value={formData.siteDescription || ''} onChange={handleChange} className="h-9 rounded-lg text-xs" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="logoUrl" className="text-[10px] font-medium text-muted-foreground">Logo URL</Label>
                <Input id="logoUrl" value={formData.logoUrl || ''} onChange={handleChange} className="h-9 rounded-lg text-xs" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="contactEmail" className="text-[10px] font-medium text-muted-foreground">Contact Email</Label>
                <Input id="contactEmail" value={formData.contactEmail || ''} onChange={handleChange} className="h-9 rounded-lg text-xs" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="gstNumber" className="text-[10px] font-medium text-muted-foreground">GST Number</Label>
                <Input id="gstNumber" value={formData.gstNumber || ''} onChange={handleChange} className="h-9 rounded-lg text-xs font-mono" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="homepage" className="space-y-4">
          <Card className="rounded-xl shadow-sm p-4 border-0">
            <CardHeader className="p-0 pb-3 space-y-0.5">
              <CardTitle className="text-sm font-semibold">Hero Copy</CardTitle>
              <CardDescription className="text-xs">Headline content shown on the storefront homepage.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="headline" className="text-[10px] font-medium text-muted-foreground">Headline</Label>
                <Input
                  id="headline"
                  value={formData.homepageHeroCopy?.headline || ''}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, homepageHeroCopy: { ...prev.homepageHeroCopy, headline: e.target.value } }))}
                  className="h-9 rounded-lg text-xs"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="subheadline" className="text-[10px] font-medium text-muted-foreground">Subheadline</Label>
                <Input
                  id="subheadline"
                  value={formData.homepageHeroCopy?.subheadline || ''}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, homepageHeroCopy: { ...prev.homepageHeroCopy, subheadline: e.target.value } }))}
                  className="h-9 rounded-lg text-xs"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card className="rounded-xl shadow-sm p-4 border-0">
            <CardHeader className="p-0 pb-3 space-y-0.5">
              <CardTitle className="text-sm font-semibold">Payment Gateway</CardTitle>
              <CardDescription className="text-xs">Credentials for processing checkout payments.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid gap-1.5">
                <Label htmlFor="razorpayKeyId" className="text-[10px] font-medium text-muted-foreground">Razorpay Key ID</Label>
                <Input id="razorpayKeyId" value={formData.razorpayKeyId || ''} onChange={handleChange} className="h-9 rounded-lg text-xs font-mono" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card className="rounded-xl shadow-sm p-4 border-0">
            <CardHeader className="p-0 pb-3 space-y-0.5">
              <CardTitle className="text-sm font-semibold">Verified Sender</CardTitle>
              <CardDescription className="text-xs">Identity used for transactional and broadcast email.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="fromEmail" className="text-[10px] font-medium text-muted-foreground">From Email</Label>
                <Input
                  id="fromEmail"
                  value={formData.emailSettings?.fromEmail || ''}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, emailSettings: { ...prev.emailSettings, fromEmail: e.target.value } }))}
                  className="h-9 rounded-lg text-xs font-mono"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="senderName" className="text-[10px] font-medium text-muted-foreground">Sender Name</Label>
                <Input
                  id="senderName"
                  value={formData.emailSettings?.senderName || ''}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, emailSettings: { ...prev.emailSettings, senderName: e.target.value } }))}
                  className="h-9 rounded-lg text-xs"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
