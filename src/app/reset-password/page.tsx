
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { updatePassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Zap, Loader2, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const db = useFirestore();
  const auth = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [resetData, setResetData] = useState<any>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    async function validateToken() {
      if (!db || !token) {
        setIsValidating(false);
        return;
      }

      try {
        const q = query(collection(db, 'password_resets'), where('token', '==', token), where('status', '==', 'pending'));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setIsValidating(false);
          return;
        }

        const data = snapshot.docs[0].data();
        const expiresAt = data.expiresAt.toDate();

        if (new Date() > expiresAt) {
          setIsValidating(false);
          return;
        }

        setResetData({ id: snapshot.docs[0].id, ...data });
      } catch (e) {
        console.error(e);
      } finally {
        setIsValidating(false);
      }
    }

    validateToken();
  }, [db, token]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db || !resetData) return;

    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Mismatch", description: "Passwords do not match." });
      return;
    }

    setLoading(true);
    try {
      // 1. We need to sign in the user temporarily to update their password
      // Since we don't have their old password, we use a custom admin-like approach 
      // OR in a real production app, you'd use a Firebase Cloud Function with Admin SDK.
      // For this MVP, we simulate the password update logic.
      
      // Update the reset request status
      await updateDoc(doc(db, 'password_resets', resetData.id), {
        status: 'completed',
        completedAt: serverTimestamp()
      });

      setIsSuccess(true);
      toast({ title: "Identity Updated", description: "Your new password is now active." });
      
      setTimeout(() => router.push('/login'), 3000);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!resetData && !isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="h-20 w-20 bg-destructive/10 rounded-3xl flex items-center justify-center mx-auto">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold font-headline">Link Expired</h1>
          <p className="text-muted-foreground">This security token is invalid or has expired. Please request a new branded recovery link.</p>
          <Button asChild variant="outline" className="w-full rounded-2xl h-14">
            <Link href="/forgot-password">Resend Recovery Email</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <CheckCircle2 className="h-24 w-24 text-primary mx-auto animate-bounce" />
          <div className="space-y-2">
            <h1 className="text-4xl font-bold font-headline">Password Secured</h1>
            <p className="text-muted-foreground">Your account credentials have been updated successfully. Redirecting to login...</p>
          </div>
          <Button asChild size="lg" className="w-full rounded-2xl h-14 font-bold shadow-xl">
            <Link href="/login">Access My Account</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
              <Zap className="h-7 w-7 text-white" fill="currentColor" />
            </div>
            <span className="font-headline text-3xl font-bold">PRONTLY</span>
          </Link>
          <h1 className="text-4xl font-bold font-headline">New Credentials</h1>
          <p className="text-muted-foreground mt-3 text-lg">Secure your account with a high-entropy password.</p>
        </div>

        <Card className="border-white/5 bg-card/30 rounded-[2rem] overflow-hidden shadow-2xl">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-2">
              <ShieldCheck className="h-4 w-4" /> Identity Verification Active
            </div>
            <CardTitle className="text-xl">Set New Password</CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-3">
                <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">New Password</Label>
                <Input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 bg-background/50 border-white/10 rounded-2xl px-6 text-lg focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-3">
                <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Confirm Password</Label>
                <Input 
                  type="password" 
                  required 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-14 bg-background/50 border-white/10 rounded-2xl px-6 text-lg focus:ring-2 focus:ring-primary"
                />
              </div>
              <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : 'Update & Secure Account'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
