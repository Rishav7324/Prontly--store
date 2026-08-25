'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
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
      // 1. Optimize image client-side (Limit to 400px width for avatars)
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
        
        // 4. Persist to Firestore (Non-blocking write)
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

        toast({ title: "Photo Updated", description: `Compressed to ${Math.round(optimized.optimizedSize / 1024)}KB.` });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: error.message });
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
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <AlertCircle className="h-8 w-8 text-muted-foreground mb-3" />
        <h1 className="text-lg md:text-xl font-semibold mb-2">Identity Required</h1>
        <Button asChild size="sm" className="h-9 rounded-lg px-6"><Link href="/login">Sign In</Link></Button>
      </div>
    );
  }

  const deletionEmailBody = `Hello support,

I am requesting the deletion of my account and all associated data in accordance with DPDPA 2023 guidelines.

User Identity Attributes:
Name: ${formData.displayName || user.displayName || 'Anonymous Creator'}
Email: ${user.email}
UID: ${user.uid}

I understand that this action is permanent and will immediately revoke my access to all purchased digital assets and source files stored in the secure R2 vault.

Regards,`;

  const deletionMailto = `mailto:store.support@prontly.in?subject=Account Deletion Request - ${user.email}&body=${encodeURIComponent(deletionEmailBody)}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-lg h-9 w-9">
            <Link href="/dashboard"><ChevronLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-lg md:text-xl font-semibold">Account Center</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage your identity and preferences.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Identity Visual Section */}
          <Card className="rounded-xl shadow-sm p-4">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative group shrink-0">
                  <Avatar className="h-20 w-20 border-2 border-primary/20 shadow-sm transition-transform group-hover:scale-105">
                    <AvatarImage src={formData.photoURL} />
                    <AvatarFallback className="text-2xl font-semibold text-primary bg-primary/10">
                      {formData.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer shadow-md hover:bg-primary/90 transition-all">
                    {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                  </label>
                </div>
                <div className="flex-1 space-y-3 text-center md:text-left min-w-0">
                  <div>
                    <h2 className="text-base font-semibold truncate">{formData.displayName || 'Unnamed Creator'}</h2>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary text-[10px] font-medium px-2 py-0 rounded-md">
                      {profile?.role || 'Member'}
                    </Badge>
                    <Badge variant="outline" className="bg-green-500/5 border-green-500/20 text-green-600 dark:text-green-500 text-[10px] font-medium px-2 py-0 rounded-md">
                      Verified Identity
                    </Badge>
                  </div>
                  {isUploading && (
                    <div className="w-full max-w-xs space-y-1.5 mx-auto md:mx-0">
                      <div className="flex justify-between text-[10px] font-medium text-primary">
                        <span>Optimizing...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-1" />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSave} className="space-y-6">
            <Card className="rounded-xl shadow-sm p-4">
              <CardContent className="p-0 space-y-6">
                <div className="flex items-center gap-2 text-primary">
                  <User className="h-4 w-4" />
                  <h2 className="text-sm font-semibold">Public Profile</h2>
                  <span className="text-xs text-muted-foreground hidden sm:inline">— appears on your reviews and receipts</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-medium text-muted-foreground">Display Name</Label>
                    <Input 
                      value={formData.displayName} 
                      onChange={(e) => setFormData({...formData, displayName: e.target.value})} 
                      className="h-9 rounded-lg text-xs"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-medium text-muted-foreground">Contact Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input 
                        placeholder="+1 XXXXX XXXXX" 
                        value={formData.phone} 
                        onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                        className="h-9 rounded-lg text-xs pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-medium text-muted-foreground">Store Language</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      <select 
                        className="w-full h-9 border border-input rounded-lg text-xs pl-9 pr-3 bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none"
                        value={formData.language}
                        onChange={(e) => setFormData({...formData, language: e.target.value})}
                      >
                        <option value="en">English (International)</option>
                        <option value="hi">Hindi (India)</option>
                        <option value="es">Spanish (LatAm)</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-medium text-muted-foreground">Account Status</Label>
                    <div className="h-9 bg-muted/40 border border-dashed border-border rounded-lg flex items-center px-3 gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-xs font-medium">Active & Compliant</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" type="button" asChild size="sm" className="h-9 rounded-lg"><Link href="/dashboard">Discard</Link></Button>
              <Button type="submit" disabled={isSaving} size="sm" className="h-9 sm:w-64 rounded-lg">
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Save className="h-3.5 w-3.5 mr-2" />}
                Save Changes
              </Button>
            </div>
          </form>

          {/* Privacy & Compliance Section */}
          <Card className="rounded-xl shadow-sm p-4 border-red-500/20 bg-red-500/[0.02] overflow-hidden">
            <CardContent className="p-0 space-y-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-red-500">
                  <Shield className="h-4 w-4" />
                  <h2 className="text-sm font-semibold">Privacy & Compliance</h2>
                </div>
                <p className="text-xs text-muted-foreground">Manage your data rights and account lifecycle in accordance with global privacy standards.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg bg-white/50 dark:bg-white/5 border border-border/60 space-y-3 p-4">
                   <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                     <Download className="h-4 w-4" />
                   </div>
                   <div>
                     <h3 className="text-xs font-semibold">Portable Data Export</h3>
                     <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Download a structured archive of your transaction history and library index. Processed within 24 hours.</p>
                   </div>
                   <Button variant="outline" size="sm" className="w-full h-8 rounded-lg">Request JSON Archive</Button>
                </div>

                <div className="rounded-lg bg-red-500/[0.03] border border-red-500/10 space-y-3 p-4">
                   <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                     <AlertCircle className="h-4 w-4" />
                   </div>
                   <div>
                     <h3 className="text-xs font-semibold text-red-500">Account Termination</h3>
                     <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Permanently purge your identity from our systems. This will immediately revoke all licenses and R2 source file access.</p>
                   </div>
                   <Button variant="destructive" size="sm" className="w-full h-8 rounded-lg" asChild>
                     <a href={deletionMailto}>Request Deletion</a>
                   </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-border/60 flex items-center gap-2 text-[10px] font-medium text-muted-foreground opacity-70">
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
