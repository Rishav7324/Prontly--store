'use client';

import { useState, useEffect } from 'react';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Save, 
  Globe,
  Loader2,
  Home,
  Star,
  FileText,
  Megaphone,
  CreditCard,
  ShieldCheck,
  Server
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { logAdminAction } from '@/lib/admin-logs';

export default function AdminSettings() {
  const db = useFirestore();
  const { user } = useUser();
  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'main') : null, [db]);
  const { data: settings, loading } = useDoc(settingsRef);
  
  const [formData, setFormData] = useState<any>({
    siteName: 'Prontly Store',
    siteDescription: 'Premium Digital Asset Marketplace',
    logoUrl: '',
    razorpayKeyId: '',
    announcementBar: { isActive: false, text: '', link: '', backgroundColor: '#5b52d6', textColor: '#ffffff' },
    homepageHeroCopy: { headline: "", subheadline: "", badge: "" },
    featuredProductIds: [],
    emailSettings: { fromEmail: '', senderName: '' },
    smtpConfig: { host: '', port: '465', user: '', pass: '', secure: true },
    invoiceSettings: { businessName: '', address: '', color: '#5b52d6', footerText: '', logoUrl: '' }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [featuredIdsInput, setFeaturedIdsInput] = useState('');

  useEffect(() => {
    if (settings) {
      setFormData(settings);
      setFeaturedIdsInput(settings.featuredProductIds?.join(', ') || '');
    }
  }, [settings]);

  const handleChange = (e: any) => {
    const { id, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    if (!db || !user) return;
    setIsSaving(true);

    const finalFeaturedIds = featuredIdsInput.split(',').map(id => id.trim()).filter(id => id);
    const finalData = {
      ...formData,
      featuredProductIds: finalFeaturedIds,
      updatedAt: serverTimestamp(),
    };

    const docRef = doc(db, 'site_settings', 'main');

    // Non-blocking write pattern
    setDoc(docRef, finalData, { merge: true })
      .then(() => {
        logAdminAction({
          db, adminId: user.uid, adminEmail: user.email!,
          action: 'UPDATE', resourceType: 'SETTINGS', resourceId: 'main', details: { type: 'global_config' }
        });
        toast({ title: "Configuration Deployed" });
      })
      .catch(async () => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'write',
          requestResourceData: finalData,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsSaving(false));
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Store Intelligence</h1>
          <p className="text-muted-foreground">Global configuration for your digital marketplace.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 h-12 px-8 rounded-xl font-bold">
          {isSaving ? <Loader2 className="animate-spin" /> : <Save className="h-4 w-4" />}
          Update Engine
        </Button>
      </header>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-2xl h-auto flex flex-wrap">
          <TabsTrigger value="general" className="gap-2 px-6 py-3 rounded-xl"><Globe className="h-4 w-4" /> General</TabsTrigger>
          <TabsTrigger value="homepage" className="gap-2 px-6 py-3 rounded-xl"><Home className="h-4 w-4" /> Homepage</TabsTrigger>
          <TabsTrigger value="payments" className="gap-2 px-6 py-3 rounded-xl"><CreditCard className="h-4 w-4" /> Payments</TabsTrigger>
          <TabsTrigger value="email" className="gap-2 px-6 py-3 rounded-xl"><Server className="h-4 w-4" /> SMTP</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="rounded-[2rem] border-white/5 bg-card/30">
            <CardHeader><CardTitle>Identity Attributes</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="siteName">Public Brand Name</Label>
                <Input id="siteName" value={formData.siteName} onChange={handleChange} className="h-12 bg-background/50 rounded-xl" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="logoUrl">Logo Resource URL</Label>
                <Input id="logoUrl" value={formData.logoUrl} onChange={handleChange} className="h-12 bg-background/50 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card className="rounded-[2rem] border-white/5 bg-card/30">
            <CardHeader><CardTitle>Gateway Credentials</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <Label htmlFor="razorpayKeyId">Razorpay Key ID</Label>
                <Input id="razorpayKeyId" value={formData.razorpayKeyId} onChange={handleChange} className="h-12 bg-background/50 rounded-xl font-mono text-xs" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
