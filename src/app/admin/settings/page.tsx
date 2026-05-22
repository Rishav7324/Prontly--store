'use client';

import { useState, useEffect } from 'react';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Save, 
  Settings, 
  Layout, 
  CreditCard, 
  Mail, 
  Globe,
  Loader2,
  CheckCircle2,
  Home,
  Star,
  FileText,
  Palette,
  AlertCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';

export default function AdminSettings() {
  const db = useFirestore();
  const settingsRef = useMemoFirebase(() => {
    return db ? doc(db, 'site_settings', 'main') : null;
  }, [db]);

  const { data: settings, loading } = useDoc(settingsRef);
  const { data: products } = useCollection(db ? collection(db, 'products') : null);
  
  const [formData, setFormData] = useState<any>({
    emailSettings: {
      fromEmail: 'onboarding@resend.dev',
      senderName: 'Prontly Store'
    },
    invoiceSettings: {
      businessName: '',
      address: '',
      color: '#5b52d6',
      footerText: 'Thank you for choosing Prontly Store.',
      logoUrl: ''
    }
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        ...settings,
        emailSettings: settings.emailSettings || {
          fromEmail: 'onboarding@resend.dev',
          senderName: 'Prontly Store'
        },
        invoiceSettings: settings.invoiceSettings || {
          businessName: '',
          address: '',
          color: '#5b52d6',
          footerText: 'Thank you for choosing Prontly Store.',
          logoUrl: ''
        }
      });
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleEmailSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      emailSettings: {
        ...prev.emailSettings,
        [id]: value
      }
    }));
  };

  const handleInvoiceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      invoiceSettings: {
        ...prev.invoiceSettings,
        [id]: value
      }
    }));
  };

  const handleToggleFeatured = (productId: string) => {
    const current = formData.featuredProductIds || [];
    const updated = current.includes(productId)
      ? current.filter((id: string) => id !== productId)
      : [...current, productId];
    setFormData(prev => ({ ...prev, featuredProductIds: updated }));
  };

  const handleSave = async () => {
    if (!db) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'site_settings', 'main'), {
        ...formData,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      toast({
        title: "Settings Saved",
        description: "Your store configuration has been updated successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Settings</h1>
          <p className="text-muted-foreground">Configure your store's global parameters.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save All Changes
        </Button>
      </header>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 w-full justify-start overflow-x-auto h-auto">
          <TabsTrigger value="general" className="gap-2 px-4 py-2"><Globe className="h-4 w-4" /> General</TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2 px-4 py-2"><Layout className="h-4 w-4" /> Appearance</TabsTrigger>
          <TabsTrigger value="homepage" className="gap-2 px-4 py-2"><Home className="h-4 w-4" /> Homepage</TabsTrigger>
          <TabsTrigger value="email" className="gap-2 px-4 py-2"><Mail className="h-4 w-4" /> Email Customization</TabsTrigger>
          <TabsTrigger value="payments" className="gap-2 px-4 py-2"><CreditCard className="h-4 w-4" /> Payments</TabsTrigger>
          <TabsTrigger value="invoicing" className="gap-2 px-4 py-2"><FileText className="h-4 w-4" /> Invoicing</TabsTrigger>
          <TabsTrigger value="contact" className="gap-2 px-4 py-2"><Mail className="h-4 w-4" /> Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Site Identity</CardTitle>
              <CardDescription>Main configuration for the store presence.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input id="siteName" value={formData.siteName || ''} onChange={handleChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="siteDescription">Meta Description</Label>
                <Textarea id="siteDescription" value={formData.siteDescription || ''} onChange={handleChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gstNumber">GST Number</Label>
                <Input id="gstNumber" value={formData.gstNumber || ''} onChange={handleChange} placeholder="e.g. 07AAAAA0000A1Z5" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sender Configuration</CardTitle>
              <CardDescription>Control the custom email and name that appears in your customers' inbox.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 flex items-start gap-4 mb-4">
                <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-bold text-yellow-500">Domain Verification Required</p>
                  <p className="text-muted-foreground">To use a custom email (e.g. hello@yourdomain.com), you must first verify your domain in the Resend dashboard and add it to the <strong>Domains</strong> tab in this app.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="senderName">Sender Display Name</Label>
                  <Input 
                    id="senderName" 
                    value={formData.emailSettings?.senderName || ''} 
                    onChange={handleEmailSettingsChange} 
                    placeholder="e.g. Prontly Support" 
                  />
                  <p className="text-[10px] text-muted-foreground">Used as the "From" name in emails.</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fromEmail">Verified "From" Email</Label>
                  <Input 
                    id="fromEmail" 
                    value={formData.emailSettings?.fromEmail || ''} 
                    onChange={handleEmailSettingsChange} 
                    placeholder="e.g. hello@yourdomain.com" 
                  />
                  <p className="text-[10px] text-muted-foreground">Must be a verified domain/address in Resend.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoicing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Template Settings</CardTitle>
              <CardDescription>Customize the look and details of generated PDF invoices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="businessName">Registered Business Name</Label>
                  <Input id="businessName" value={formData.invoiceSettings?.businessName || ''} onChange={handleInvoiceChange} placeholder="e.g. Prontly Digital Services" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="color">Accent Color (Hex)</Label>
                  <div className="flex gap-2">
                    <Input id="color" value={formData.invoiceSettings?.color || '#5b52d6'} onChange={handleInvoiceChange} placeholder="#5b52d6" />
                    <div className="h-10 w-10 rounded border" style={{ backgroundColor: formData.invoiceSettings?.color || '#5b52d6' }} />
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Business Address</Label>
                <Textarea id="address" value={formData.invoiceSettings?.address || ''} onChange={handleInvoiceChange} placeholder="Full postal address for invoices..." className="h-20" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="logoUrl">Invoice Logo URL (PNG/JPG)</Label>
                <Input id="logoUrl" value={formData.invoiceSettings?.logoUrl || ''} onChange={handleInvoiceChange} placeholder="https://..." />
                <p className="text-[10px] text-muted-foreground">Transparent PNG recommended. Used at the top left of the PDF.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="footerText">Invoice Footer Note</Label>
                <Input id="footerText" value={formData.invoiceSettings?.footerText || ''} onChange={handleInvoiceChange} placeholder="Thanks for your business!" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Branding Assets</CardTitle>
              <CardDescription>URLs for your logo and favicon.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="logoUrl">Main Logo URL</Label>
                <Input id="logoUrl" value={formData.logoUrl || ''} onChange={handleChange} placeholder="https://..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="faviconUrl">Favicon URL</Label>
                <Input id="faviconUrl" value={formData.faviconUrl || ''} onChange={handleChange} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="homepage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Homepage Management</CardTitle>
              <CardDescription>Select products to feature on your landing page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Featured Products ({formData.featuredProductIds?.length || 0})</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products?.map((product: any) => (
                    <div 
                      key={product.id}
                      onClick={() => handleToggleFeatured(product.id)}
                      className={`relative p-3 rounded-xl border cursor-pointer transition-all ${
                        formData.featuredProductIds?.includes(product.id)
                          ? 'border-primary bg-primary/10'
                          : 'border-white/5 bg-card/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 rounded overflow-hidden">
                          <Image src={product.images?.[0] || 'https://picsum.photos/seed/placeholder/100/100'} alt={product.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{product.name}</p>
                          <p className="text-[10px] text-muted-foreground">₹{product.price / 100}</p>
                        </div>
                        {formData.featuredProductIds?.includes(product.id) && (
                          <Star className="h-4 w-4 text-primary fill-current" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Razorpay Integration</CardTitle>
              <CardDescription>Keys required for payment processing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="razorpayKeyId">Razorpay Key ID</Label>
                <Input id="razorpayKeyId" value={formData.razorpayKeyId || ''} onChange={handleChange} placeholder="rzp_live_..." />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                The secret key is managed via environment variables for security.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Support Information</CardTitle>
              <CardDescription>How customers can reach you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="contactEmail">Support Email</Label>
                <Input id="contactEmail" value={formData.contactEmail || ''} onChange={handleChange} type="email" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}