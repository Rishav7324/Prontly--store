'use client';

import { useState, useEffect } from 'react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Save, 
  Settings, 
  Layout, 
  Mail, 
  Globe,
  Loader2,
  Home,
  Star,
  FileText,
  AlertCircle,
  Megaphone,
  ImageIcon,
  CreditCard,
  Sparkles,
  Type
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';

export default function AdminSettings() {
  const db = useFirestore();
  const settingsRef = useMemoFirebase(() => {
    return db ? doc(db, 'site_settings', 'main') : null;
  }, [db]);

  const { data: settings, loading } = useDoc(settingsRef);
  
  const [formData, setFormData] = useState<any>({
    siteName: 'Prontly Store',
    siteDescription: 'Premium Digital Asset Marketplace',
    razorpayKeyId: '',
    announcementBar: {
      isActive: false,
      text: '',
      link: '',
      backgroundColor: '#5b52d6',
      textColor: '#ffffff'
    },
    homepageHeroCopy: {
      headline: "Master the Future with Expert Digital Assets",
      subheadline: "Unlock high-performance AI prompts, UI kits, and professional guides. Built for creators who demand precision.",
      badge: "New: GPT-4o Optimized Prompts Now Available!"
    },
    featuredProductIds: [],
    emailSettings: {
      fromEmail: 'support@store.prontly.in',
      senderName: 'Prontly Store'
    },
    invoiceSettings: {
      businessName: 'PRONTLY DIGITAL',
      address: '',
      color: '#5b52d6',
      footerText: 'Thank you for choosing Prontly.',
      logoUrl: 'https://cdn.prontly.in/App%20icon/IMG_20260518_203511%20(1).ico'
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [featuredIdsInput, setFeaturedIdsInput] = useState('');

  useEffect(() => {
    if (settings) {
      setFormData({
        ...settings,
        announcementBar: settings.announcementBar || {
          isActive: false,
          text: '',
          link: '',
          backgroundColor: '#5b52d6',
          textColor: '#ffffff'
        },
        homepageHeroCopy: settings.homepageHeroCopy || {
          headline: "Master the Future with Expert Digital Assets",
          subheadline: "Unlock high-performance AI prompts, UI kits, and professional guides.",
          badge: "New: GPT-4o Optimized Prompts Now Available!"
        },
        featuredProductIds: settings.featuredProductIds || [],
        emailSettings: settings.emailSettings || {
          fromEmail: 'support@store.prontly.in',
          senderName: 'Prontly Store'
        },
        invoiceSettings: settings.invoiceSettings || {
          businessName: 'PRONTLY DIGITAL',
          address: '',
          color: '#5b52d6',
          footerText: 'Thank you for choosing Prontly.',
          logoUrl: 'https://cdn.prontly.in/App%20icon/IMG_20260518_203511%20(1).ico'
        }
      });
      setFeaturedIdsInput(settings.featuredProductIds?.join(', ') || '');
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleHeroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      homepageHeroCopy: { ...prev.homepageHeroCopy, [id]: value }
    }));
  };

  const handleToggleAnnouncement = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      announcementBar: { ...prev.announcementBar, isActive: checked }
    }));
  };

  const handleAnnouncementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      announcementBar: { ...prev.announcementBar, [id]: value }
    }));
  };

  const handleInvoiceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      invoiceSettings: { ...prev.invoiceSettings, [id]: value }
    }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      emailSettings: { ...prev.emailSettings, [id]: value }
    }));
  };

  const handleSave = async () => {
    if (!db) return;
    setIsSaving(true);
    try {
      const finalFeaturedIds = featuredIdsInput.split(',').map(id => id.trim()).filter(id => id);
      
      await setDoc(doc(db, 'site_settings', 'main'), {
        ...formData,
        featuredProductIds: finalFeaturedIds,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      toast({ title: "Settings Updated", description: "Global configuration has been deployed." });
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Store Control</h1>
          <p className="text-muted-foreground">Global parameters and brand identity.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Deploy Changes
        </Button>
      </header>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 w-full justify-start overflow-x-auto h-auto flex flex-nowrap rounded-2xl">
          <TabsTrigger value="general" className="gap-2 px-6 py-3 rounded-xl"><Globe className="h-4 w-4" /> General</TabsTrigger>
          <TabsTrigger value="homepage" className="gap-2 px-6 py-3 rounded-xl"><Home className="h-4 w-4" /> Homepage</TabsTrigger>
          <TabsTrigger value="marketing" className="gap-2 px-6 py-3 rounded-xl"><Megaphone className="h-4 w-4" /> Growth</TabsTrigger>
          <TabsTrigger value="payments" className="gap-2 px-6 py-3 rounded-xl"><CreditCard className="h-4 w-4" /> Payments</TabsTrigger>
          <TabsTrigger value="email" className="gap-2 px-6 py-3 rounded-xl"><Mail className="h-4 w-4" /> Sender</TabsTrigger>
          <TabsTrigger value="invoicing" className="gap-2 px-6 py-3 rounded-xl"><FileText className="h-4 w-4" /> Receipts</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="rounded-[2rem] border-white/5 bg-card/30">
            <CardHeader><CardTitle>Site Identity</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="siteName">Store Display Name</Label>
                <Input id="siteName" value={formData.siteName || ''} onChange={handleChange} className="h-12 bg-background/50 rounded-xl" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="siteDescription">Global Meta Description</Label>
                <Textarea id="siteDescription" value={formData.siteDescription || ''} onChange={handleChange} className="bg-background/50 rounded-xl min-h-[100px]" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="logoUrl">Public Logo URL</Label>
                <Input id="logoUrl" value={formData.logoUrl || ''} onChange={handleChange} className="h-12 bg-background/50 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="homepage" className="space-y-6">
          <Card className="rounded-[2rem] border-white/5 bg-card/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5 text-primary" />
                Hero Content
              </CardTitle>
              <CardDescription>Customize the primary headline and value proposition on your landing page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="headline">Main Headline</Label>
                <Input id="headline" value={formData.homepageHeroCopy?.headline || ''} onChange={handleHeroChange} className="h-12 bg-background/50 rounded-xl" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subheadline">Hero Sub-headline</Label>
                <Textarea id="subheadline" value={formData.homepageHeroCopy?.subheadline || ''} onChange={handleHeroChange} className="bg-background/50 rounded-xl min-h-[80px]" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="badge">Animated Badge Text</Label>
                <Input id="badge" value={formData.homepageHeroCopy?.badge || ''} onChange={handleHeroChange} className="h-12 bg-background/50 rounded-xl" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-white/5 bg-card/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Featured Selection
              </CardTitle>
              <CardDescription>List product IDs (comma-separated) to display them in the Trending section.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <Label htmlFor="featuredIds">Featured Product IDs</Label>
                <Input 
                  id="featuredIds" 
                  value={featuredIdsInput} 
                  onChange={(e) => setFeaturedIdsInput(e.target.value)} 
                  placeholder="e.g. prod_123, prod_456, prod_789"
                  className="h-12 bg-background/50 rounded-xl font-mono text-xs" 
                />
                <p className="text-[10px] text-muted-foreground mt-1">Leave empty to show the most recent products automatically.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketing" className="space-y-6">
          <Card className="rounded-[2rem] border-white/5 bg-card/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Announcement Bar</CardTitle>
                  <CardDescription>Visual call-to-action at the top of every page.</CardDescription>
                </div>
                <Switch 
                  checked={formData.announcementBar?.isActive} 
                  onCheckedChange={handleToggleAnnouncement} 
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label>Promotional Message</Label>
                <Input 
                  id="text" 
                  placeholder="e.g. FLASH SALE: Use PRONTLY50 for half off!" 
                  value={formData.announcementBar?.text || ''} 
                  onChange={handleAnnouncementChange}
                  className="h-12 bg-background/50 rounded-xl"
                />
              </div>
              <div className="grid gap-2">
                <Label>Click Destination (Link)</Label>
                <Input 
                  id="link" 
                  placeholder="/products" 
                  value={formData.announcementBar?.link || ''} 
                  onChange={handleAnnouncementChange}
                  className="h-12 bg-background/50 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label>Background Accent</Label>
                  <div className="flex gap-3">
                    <Input id="backgroundColor" value={formData.announcementBar?.backgroundColor || '#5b52d6'} onChange={handleAnnouncementChange} className="h-12 bg-background/50 rounded-xl" />
                    <div className="h-12 w-12 rounded-xl border border-white/10 shrink-0" style={{ backgroundColor: formData.announcementBar?.backgroundColor || '#5b52d6' }} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Message Text Color</Label>
                  <div className="flex gap-3">
                    <Input id="textColor" value={formData.announcementBar?.textColor || '#ffffff'} onChange={handleAnnouncementChange} className="h-12 bg-background/50 rounded-xl" />
                    <div className="h-12 w-12 rounded-xl border border-white/10 shrink-0" style={{ backgroundColor: formData.announcementBar?.textColor || '#ffffff' }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card className="rounded-[2rem] border-white/5 bg-card/30">
            <CardHeader>
              <CardTitle>Razorpay Configuration</CardTitle>
              <CardDescription>Setup your public Key ID for the checkout modal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="razorpayKeyId">Razorpay Key ID (Public)</Label>
                <Input 
                  id="razorpayKeyId" 
                  value={formData.razorpayKeyId || ''} 
                  onChange={handleChange} 
                  placeholder="rzp_live_..."
                  className="h-12 bg-background/50 rounded-xl font-mono text-xs" 
                />
              </div>
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-accent/5 border border-accent/20">
                <AlertCircle className="h-6 w-6 text-accent shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>Note:</strong> Your <code>RAZORPAY_KEY_SECRET</code> must be set in your server environment variables (e.g. <code>.env</code>) for verification to work.</p>
                  <p>You can find these in the Razorpay Dashboard under <code>Settings &gt; API Keys</code>.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <Card className="rounded-[2rem] border-white/5 bg-card/30">
            <CardHeader>
              <CardTitle>Resend Sender Details</CardTitle>
              <CardDescription>Configure how your automated emails appear in customer inboxes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Friendly Sender Name</Label>
                  <Input id="senderName" value={formData.emailSettings?.senderName || ''} onChange={handleEmailChange} className="h-12 bg-background/50 rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label>Verified From Address</Label>
                  <Input id="fromEmail" value={formData.emailSettings?.fromEmail || ''} onChange={handleEmailChange} placeholder="support@store.prontly.in" className="h-12 bg-background/50 rounded-xl" />
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-primary/5 border border-primary/20">
                <AlertCircle className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Ensure the <strong>"From Address"</strong> is fully verified in your Resend dashboard. Unverified domains will block all transactional email delivery.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoicing" className="space-y-6">
          <Card className="rounded-[2rem] border-white/5 bg-card/30">
            <CardHeader>
              <CardTitle>Custom PDF Receipt Settings</CardTitle>
              <CardDescription>Customize the automated receipts sent after purchase.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label>Brand Logo for PDF</Label>
                <div className="flex items-center gap-4">
                  <Input id="logoUrl" value={formData.invoiceSettings?.logoUrl || ''} onChange={handleInvoiceChange} placeholder="https://..." className="h-12 bg-background/50 rounded-xl" />
                  {formData.invoiceSettings?.logoUrl && (
                    <div className="h-12 w-12 rounded-xl border bg-muted flex items-center justify-center p-2 overflow-hidden shrink-0">
                      <img src={formData.invoiceSettings.logoUrl} alt="Logo" className="object-contain" />
                    </div>
                  )}
                </div>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Legal Business Name</Label>
                  <Input id="businessName" value={formData.invoiceSettings?.businessName || ''} onChange={handleInvoiceChange} className="h-12 bg-background/50 rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label>Receipt Accent Color</Label>
                  <div className="flex gap-3">
                    <Input id="color" value={formData.invoiceSettings?.color || '#5b52d6'} onChange={handleInvoiceChange} className="h-12 bg-background/50 rounded-xl" />
                    <div className="h-12 w-12 rounded-xl border shrink-0" style={{ backgroundColor: formData.invoiceSettings?.color || '#5b52d6' }} />
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Physical/Office Address</Label>
                <Textarea id="address" value={formData.invoiceSettings?.address || ''} onChange={handleInvoiceChange} className="bg-background/50 rounded-xl min-h-[80px]" placeholder="Global Digital Sales Office..." />
              </div>
              <div className="grid gap-2">
                <Label>Receipt Legal Disclaimer (Footer)</Label>
                <Input id="footerText" value={formData.invoiceSettings?.footerText || ''} onChange={handleInvoiceChange} className="h-12 bg-background/50 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
