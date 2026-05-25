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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Save, 
  User, 
  Shield, 
  Phone, 
  ChevronLeft, 
  Globe, 
  Camera, 
  Upload,
  CheckCircle2,
  AlertCircle,
  Download,
  ShieldCheck
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { uploadFileAction } from '@/app/actions/r2-actions';
import { optimizeImage } from '@/lib/image-optimizer';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export default function UserSettingsPage() {
  const { user, profile, loading: authLoading } = useUser();
  const db = useFirestore();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    language: 'en',
    photoURL: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        phone: profile.phone || '',
        language: profile.language || 'en',
        photoURL: profile.photoURL || ''
      });
    }
  }, [profile]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // 1. Optimize image client-side
      setUploadProgress(30);
      const optimized = await optimizeImage(file, 400, 0.8);
      const optimizedFile = new File([optimized.blob], `profile-${user.uid}.webp`, { type: 'image/webp' });

      // 2. Prepare upload
      const uploadData = new FormData();
      uploadData.append('file', optimizedFile);
      uploadData.append('key', `profiles/${user.uid}/${Date.now()}.webp`);

      setUploadProgress(60);
      const result = await uploadFileAction(uploadData);

      if (result.success && result.url) {
        setUploadProgress(90);
        // 3. Update local state immediately
        setFormData(prev => ({ ...prev, photoURL: result.url! }));
        
        // 4. Persist to Firestore (Non-blocking)
        const userRef = doc(db!, 'users', user.uid);
        setDoc(userRef, { 
          photoURL: result.url,
          updatedAt: serverTimestamp() 
        }, { merge: true })
        .catch(async () => {
          const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'update',
            requestResourceData: { photoURL: result.url },
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
        });

        toast({ title: "Visual ID Updated", description: "Your profile picture has been synchronized." });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload Fault", description: error.message });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user) return;
    setIsSaving(true);

    const finalData = {
      ...formData,
      updatedAt: serverTimestamp()
    };

    const userRef = doc(db, 'users', user.uid);

    // Non-blocking write pattern
    setDoc(userRef, finalData, { merge: true })
      .then(() => {
        toast({ title: "Profile Synchronized", description: "Your account preferences have been updated." });
      })
      .catch(async () => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: finalData,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-4 font-headline">Identity Required</h1>
        <Button asChild className="rounded-xl px-8"><Link href="/login">Authenticate Now</Link></Button>
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
            <p className="text-muted-foreground mt-1">Manage your identity and preferences across the Prontly ecosystem.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Identity Visual Section */}
          <Card className="rounded-[2.5rem] border-white/5 bg-card/30 overflow-hidden">
            <CardContent className="p-10">
              <div className="flex flex-col md:flex-row items-center gap-10">
                <div className="relative group">
                  <Avatar className="h-32 w-32 border-4 border-primary/20 shadow-2xl transition-transform group-hover:scale-105">
                    <AvatarImage src={formData.photoURL} />
                    <AvatarFallback className="text-4xl font-bold text-primary bg-primary/10">
                      {formData.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer shadow-xl hover:bg-primary/90 transition-all">
                    {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                  </label>
                </div>
                <div className="flex-1 space-y-4 text-center md:text-left">
                  <div>
                    <h3 className="text-2xl font-bold font-headline">{formData.displayName || 'Unnamed Creator'}</h3>
                    <p className="text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary uppercase font-black text-[10px] tracking-widest px-3 py-1">
                      {profile?.role || 'Member'}
                    </Badge>
                    <Badge variant="outline" className="bg-green-500/5 border-green-500/20 text-green-500 uppercase font-black text-[10px] tracking-widest px-3 py-1">
                      Verified Identity
                    </Badge>
                  </div>
                  {isUploading && (
                    <div className="w-full max-w-xs space-y-2">
                      <div className="flex justify-between text-[10px] uppercase font-bold text-primary tracking-widest">
                        <span>Uploading Visual...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-1" />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

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
                      placeholder="e.g. John Doe"
                    />
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
                  <div className="space-y-3">
                    <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Account Status</Label>
                    <div className="h-14 bg-muted/40 border border-dashed rounded-2xl flex items-center px-6 gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-bold uppercase tracking-widest text-foreground">Active & Compliant</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4 pt-4">
              <Button variant="ghost" type="button" asChild className="h-16 px-10 rounded-2xl font-bold"><Link href="/dashboard">Discard</Link></Button>
              <Button type="submit" disabled={isSaving} className="h-16 px-14 rounded-2xl text-xl font-bold shadow-2xl shadow-primary/30 min-w-[240px]">
                {isSaving ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <Save className="h-6 w-6 mr-3" />}
                Sync Profile
              </Button>
            </div>
          </form>

          {/* Upgraded Privacy & Compliance Section */}
          <Card className="rounded-[2.5rem] border-red-500/20 bg-red-500/[0.02] overflow-hidden">
            <CardContent className="p-10 space-y-10">
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-red-500">
                  <Shield className="h-6 w-6" />
                  <h3 className="text-2xl font-bold font-headline">Privacy & Compliance</h3>
                </div>
                <p className="text-muted-foreground">Manage your data rights and account lifecycle in accordance with global privacy standards.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="p-8 rounded-3xl bg-white/5 border border-white/5 space-y-4">
                   <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                     <Download className="h-5 w-5" />
                   </div>
                   <div>
                     <h4 className="font-bold text-foreground">Portable Data Export</h4>
                     <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Download a structured archive of your transaction history and library index. Processed within 24 hours.</p>
                   </div>
                   <Button variant="outline" className="w-full h-12 rounded-xl border-white/10 hover:bg-primary/5 hover:text-primary transition-all">Request JSON Archive</Button>
                </div>

                <div className="p-8 rounded-3xl bg-red-500/[0.03] border border-red-500/10 space-y-4">
                   <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                     <AlertCircle className="h-5 w-5" />
                   </div>
                   <div>
                     <h4 className="font-bold text-red-500">Account Termination</h4>
                     <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Permanently purge your identity from our systems. This will immediately revoke all perpetual licenses and R2 source file access.</p>
                   </div>
                   <Button variant="destructive" className="w-full h-12 rounded-xl font-bold stripe-shadow-sm">Request Deletion</Button>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-muted-foreground opacity-50">
                <ShieldCheck className="h-3 w-3" />
                DPDPA 2023 & GDPR Compliant Infrastructure
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
