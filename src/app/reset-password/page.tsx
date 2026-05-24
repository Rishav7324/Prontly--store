'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Zap, Loader2, ShieldCheck, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';

function ResetPasswordHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const oobCode = searchParams.get('oobCode');

  useEffect(() => {
    if (!oobCode || !auth) {
      setVerifying(false);
      setError("Invalid or missing security code.");
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then(() => setVerifying(false))
      .catch((err) => {
        console.error('Verify code error:', err);
        setVerifying(false);
        setError("This reset link has expired or has already been used.");
      });
  }, [oobCode, auth]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !oobCode) return;

    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Mismatch", description: "Passwords do not match." });
      return;
    }

    if (newPassword.length < 8) {
      toast({ variant: "destructive", title: "Too weak", description: "Password must be at least 8 characters." });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
      toast({ title: "Access Restored", description: "Your password has been updated successfully." });
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest">Validating Security Code...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="h-24 w-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold font-headline">Password Updated</h1>
          <p className="text-muted-foreground">Redirecting you to the login terminal...</p>
        </div>
        <Button asChild className="w-full h-14 rounded-2xl"><Link href="/login">Sign In Now</Link></Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="flex flex-col items-center text-center">
        <Link href="/" className="flex items-center gap-3 mb-10 group">
          <div className="relative h-14 w-14 overflow-hidden rounded-[1.25rem] bg-white/5 shadow-2xl transition-all group-hover:scale-105">
            <Image 
              src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png" 
              alt="Prontly Logo" 
              fill 
              className="object-cover"
            />
          </div>
          <span className="font-headline text-3xl font-bold tracking-tighter uppercase">Prontly</span>
        </Link>
        <h1 className="text-4xl font-bold font-headline">Secure New Access</h1>
        <p className="text-muted-foreground mt-3 text-lg">Define your new account credentials.</p>
      </div>

      <Card className="border-white/5 bg-card/30 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
        <CardHeader className="p-10 pb-6 text-center">
          <div className="inline-flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-3 mx-auto">
            <ShieldCheck className="h-4 w-4" /> Identity Protection Active
          </div>
        </CardHeader>

        <CardContent className="p-10 pt-0">
          {error ? (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive text-sm font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
              <Button asChild variant="outline" className="w-full h-14 rounded-2xl">
                <Link href="/forgot-password">Request New Link</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground ml-1">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="h-16 bg-background/50 border-white/10 rounded-2xl pl-12 text-lg"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="h-16 bg-background/50 border-white/10 rounded-2xl pl-12 text-lg"
                    />
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full h-16 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'Update Password'}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="bg-muted/30 p-8 flex justify-center border-t border-white/5">
          <Link href="/login" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
            Return to Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Suspense fallback={<Loader2 className="h-10 w-10 animate-spin text-primary" />}>
        <ResetPasswordHandler />
      </Suspense>
    </div>
  );
}
