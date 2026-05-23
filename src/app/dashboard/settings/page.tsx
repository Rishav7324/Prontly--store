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
import { Loader2, Save, User, Shield, Phone, ChevronLeft, Globe } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function UserSettingsPage() {
  const { user, profile, loading: authLoading } = useUser();
  const db = useFirestore();
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    language: 'en'
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        phone: profile.phone || '',
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
      
      toast({ title: "Profile Synchronized", description: "Your account preferences have been updated." });
    } catch (error) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <h1 className="text-2xl font-bold mb-4 font-headline">Please sign in</h1>
        <Button asChild className="rounded-xl px-8"><Link href="/login">Login</Link></Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-12 flex items-center gap-6">
          <Button variant="ghost" size="icon" asChild className="rounded-full bg-white/5 hover:bg-white/10 h-12 w-12">
            <Link href="/dashboard"><ChevronLeft className="h-6 w-6" /></Link>
          </Button>
          <div>
            <h1 className="text-4xl font-bold font-headline">Account Center</h1>
            <p className="text-muted-foreground mt-1">Manage your identity and preferences across the store.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          <Card className="rounded-[2.5rem] border-white/5 bg-card/30 overflow-hidden">
            <CardHeader className="p-10 pb-0">
              <div className="flex items-center gap-3 text-primary mb-2">
                <User className="h-6 w-6" />
                <CardTitle className="text-2xl font-headline">Public Profile</CardTitle>
              </div>
              <CardDescription className="text-base">This information appears on your reviews and purchase receipts.</CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Full Display Name</Label>
                  <Input 
                    value={formData.displayName} 
                    onChange={(e) => setFormData({...formData, displayName: e.target.value})} 
                    className="h-14 bg-background/50 border-white/10 rounded-2xl text-lg px-6"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Account Email</Label>
                  <Input value={user.email || ''} readOnly className="h-14 bg-muted/40 border-dashed rounded-2xl text-lg px-6 opacity-60 cursor-not-allowed" />
                  <p className="text-[10px] font-bold text-primary uppercase tracking-tighter">Security Locked Field</p>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Contact Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="+1 XXXXX XXXXX" 
                      value={formData.phone} 
                      onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                      className="h-14 bg-background/50 border-white/10 rounded-2xl text-lg pl-14"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Store Language</Label>
                  <div className="relative">
                    <Globe className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <select 
                      className="w-full h-14 bg-background/50 border border-white/10 rounded-2xl text-lg pl-14 pr-6 outline-none focus:ring-2 focus:ring-primary appearance-none"
                      value={formData.language}
                      onChange={(e) => setFormData({...formData, language: e.target.value})}
                    >
                      <option value="en">English (International)</option>
                      <option value="hi">Hindi (India)</option>
                      <option value="es">Spanish (LatAm)</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-destructive/20 bg-destructive/5 overflow-hidden">
            <CardHeader className="p-10">
              <div className="flex items-center gap-3 text-destructive mb-2">
                <Shield className="h-6 w-6" />
                <CardTitle className="text-2xl font-headline">Privacy & Protection</CardTitle>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mt-4">
                <div>
                  <p className="font-bold text-foreground">Terminate Account</p>
                  <p className="text-sm text-muted-foreground">This will permanently revoke access to all purchased digital assets and source files.</p>
                </div>
                <Button variant="destructive" size="lg" type="button" className="rounded-2xl px-10 h-14 font-bold">Request Deletion</Button>
              </div>
            </CardHeader>
          </Card>

          <div className="flex justify-end gap-4 pt-8">
            <Button variant="ghost" type="button" asChild className="h-16 px-10 rounded-2xl font-bold"><Link href="/dashboard">Discard</Link></Button>
            <Button type="submit" disabled={isSaving} className="h-16 px-14 rounded-2xl text-xl font-bold shadow-2xl shadow-primary/30 min-w-[240px]">
              {isSaving ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <Save className="h-6 w-6 mr-3" />}
              Save Profile
            </Button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}