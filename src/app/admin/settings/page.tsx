
'use client';

import { useState, useEffect } from 'react';
import { useDoc, useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, 
  Settings, 
  Layout, 
  CreditCard, 
  Mail, 
  Globe,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function AdminSettings() {
  const db = useFirestore();
  const settingsRef = db ? doc(db, 'site_settings', 'main') : null;
  const { data: settings, loading } = useDoc(settingsRef);
  
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
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
          <TabsTrigger value="payments" className="gap-2 px-4 py-2"><CreditCard className="h-4 w-4" /> Payments</TabsTrigger>
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

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Branding Assets</CardTitle>
              <CardDescription>URLs for your logo and favicon.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input id="logoUrl" value={formData.logoUrl || ''} onChange={handleChange} placeholder="https://..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="faviconUrl">Favicon URL</Label>
                <Input id="faviconUrl" value={formData.faviconUrl || ''} onChange={handleChange} />
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="twitter">Twitter Handle</Label>
                  <Input id="twitter" placeholder="@handle" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="instagram">Instagram Handle</Label>
                  <Input id="instagram" placeholder="@handle" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
