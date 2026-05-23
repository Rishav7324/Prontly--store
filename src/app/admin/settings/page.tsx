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
import { Switch } from '@/components/ui/switch';
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
  AlertCircle,
  Megaphone
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
    announcementBar: {
      isActive: false,
      text: '',
      link: '',
      backgroundColor: '#5b52d6',
      textColor: '#ffffff'
    },
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
        announcementBar: settings.announcementBar || {
          isActive: false,
          text: '',
          link: '',
          backgroundColor: '#5b52d6',
          textColor: '#ffffff'
        },
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
        description: "Failed to save settings.",
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
          <TabsTrigger value="marketing" className="gap-2 px-4 py-2"><Megaphone className="h-4 w-4" /> Marketing</TabsTrigger>
          <TabsTrigger value="email" className="gap-2 px-4 py-2"><Mail className="h-4 w-4" /> Email</TabsTrigger>
          <TabsTrigger value="invoicing" className="gap-2 px-4 py-2"><FileText className="h-4 w-4" /> Invoicing</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Site Identity</CardTitle>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketing" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Announcement Bar</CardTitle>
                  <CardDescription>Display a prominent message at the very top of your store.</CardDescription>
                </div>
                <Switch 
                  checked={formData.announcementBar?.isActive} 
                  onCheckedChange={handleToggleAnnouncement} 
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="text">Message Text</Label>
                <Input 
                  id="text" 
                  placeholder="e.g. Flash Sale: 20% OFF with code PRONTLY20" 
                  value={formData.announcementBar?.text || ''} 
                  onChange={handleAnnouncementChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="link">Redirect Link (Optional)</Label>
                <Input 
                  id="link" 
                  placeholder="/products?category=prompts" 
                  value={formData.announcementBar?.link || ''} 
                  onChange={handleAnnouncementChange}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="backgroundColor">Background Color</Label>
                  <div className="flex gap-2">
                    <Input id="backgroundColor" value={formData.announcementBar?.backgroundColor || '#5b52d6'} onChange={handleAnnouncementChange} />
                    <div className="h-10 w-10 rounded border" style={{ backgroundColor: formData.announcementBar?.backgroundColor || '#5b52d6' }} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="textColor">Text Color</Label>
                  <div className="flex gap-2">
                    <Input id="textColor" value={formData.announcementBar?.textColor || '#ffffff'} onChange={handleAnnouncementChange} />
                    <div className="h-10 w-10 rounded border" style={{ backgroundColor: formData.announcementBar?.textColor || '#ffffff' }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Branding Assets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="logoUrl">Main Logo URL</Label>
                <Input id="logoUrl" value={formData.logoUrl || ''} onChange={handleChange} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoicing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Template Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="businessName">Registered Business Name</Label>
                  <Input id="businessName" value={formData.invoiceSettings?.businessName || ''} onChange={handleInvoiceChange} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="color">Accent Color (Hex)</Label>
                  <div className="flex gap-2">
                    <Input id="color" value={formData.invoiceSettings?.color || '#5b52d6'} onChange={handleInvoiceChange} />
                    <div className="h-10 w-10 rounded border" style={{ backgroundColor: formData.invoiceSettings?.color || '#5b52d6' }} />
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Business Address</Label>
                <Textarea id="address" value={formData.invoiceSettings?.address || ''} onChange={handleInvoiceChange} className="h-20" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function handleInvoiceChange(e: any): void {
  throw new Error('Function not implemented.');
}
