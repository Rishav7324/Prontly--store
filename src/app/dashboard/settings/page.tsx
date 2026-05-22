'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, User, Shield, CreditCard, ChevronLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function UserSettingsPage() {
  const { user, profile, loading: authLoading } = useUser();
  const db = useFirestore();
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    gstNumber: '',
    language: 'en'
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        phone: profile.phone || '',
        gstNumber: profile.gstNumber || '',
        language: profile.language || 'en'
      });
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user) return;
    setIsSaving(true);

    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...formData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      toast({ title: "Profile Updated", description: "Your settings have been saved." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update profile." });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Please sign in to manage settings</h1>
      <Button asChild><Link href="/login">Sign In</Link></Button>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard"><ChevronLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-headline">Account Settings</h1>
            <p className="text-muted-foreground text-sm">Manage your personal information and preferences.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          <Card className="border-white/5 bg-card/50">
            <CardHeader>
              <div className="flex items-center gap-2 text-primary mb-2">
                <User className="h-5 w-5" />
                <CardTitle className="text-xl">Profile Details</CardTitle>
              </div>
              <CardDescription>This information will be used for your invoices and account profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={formData.displayName} 
                    onChange={(e) => setFormData({...formData, displayName: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" value={user.email || ''} readOnly className="bg-muted opacity-60" />
                  <p className="text-[10px] text-muted-foreground">Email cannot be changed.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    placeholder="+91 XXXXX XXXXX" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lang">Preferred Language</Label>
                  <select 
                    id="lang"
                    className="w-full bg-background border rounded-md h-10 px-3 outline-none focus:ring-1 focus:ring-primary"
                    value={formData.language}
                    onChange={(e) => setFormData({...formData, language: e.target.value})}
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/5 bg-card/50">
            <CardHeader>
              <div className="flex items-center gap-2 text-primary mb-2">
                <CreditCard className="h-5 w-5" />
                <CardTitle className="text-xl">Billing & Tax</CardTitle>
              </div>
              <CardDescription>Required for B2B tax compliance (GST) in India.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-md space-y-2">
                <Label htmlFor="gst">GST Number (Optional)</Label>
                <Input 
                  id="gst" 
                  placeholder="e.g. 07AAAAA0000A1Z5" 
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({...formData, gstNumber: e.target.value.toUpperCase()})}
                />
                <p className="text-xs text-muted-foreground">Ensure this is correct for generating valid tax invoices.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive mb-2">
                <Shield className="h-5 w-5" />
                <CardTitle className="text-xl">Account Security</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <div>
                <p className="font-bold text-sm">Delete Account</p>
                <p className="text-xs text-muted-foreground">Permanently remove your account and all purchases.</p>
              </div>
              <Button variant="destructive" size="sm" type="button">Request Deletion</Button>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" type="button" asChild><Link href="/dashboard">Cancel</Link></Button>
            <Button type="submit" disabled={isSaving} className="min-w-[140px]">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
