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
        toast({ title: "Settings saved" });
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

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

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
                <Input id="siteName" value={formData.siteName} onChange={handleChange} className="h-9 rounded-lg text-xs" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="logoUrl" className="text-[10px] font-medium text-muted-foreground">Logo URL</Label>
                <Input id="logoUrl" value={formData.logoUrl} onChange={handleChange} className="h-9 rounded-lg text-xs" />
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
                <Input id="razorpayKeyId" value={formData.razorpayKeyId} onChange={handleChange} className="h-9 rounded-lg text-xs font-mono" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
