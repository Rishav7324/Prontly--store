
'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Zap, Loader2, CheckCircle2, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode');
  const router = useRouter();
  const auth = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verifyCode() {
      if (!auth || !oobCode) {
        setVerifying(false);
        return;
      }
      try {
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
      } catch (err: any) {
        console.error(err);
        setError("The security link is invalid or has expired.");
      } finally {
        setVerifying(false);
      }
    }
    verifyCode();
  }, [auth, oobCode]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !oobCode) return;

    if (password.length < 8) {
      toast({ variant: "destructive", title: "Weak Password", description: "Password must be at least 8 characters." });
      return;
    }

    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Mismatch", description: "Passwords do not match." });
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setIsSuccess(true);
      toast({ title: "Account Secured", description: "Your new password has been applied." });
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Update Failed", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground uppercase font-bold tracking-widest text-[10px]">Verifying Security Code...</p>
        </div>
      </div>
    );
  }

  if (error || !oobCode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="h-20 w-20 bg-destructive/10 rounded-3xl flex items-center justify-center mx-auto">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold font-headline">Session Invalid</h1>
          <p className="text-muted-foreground">{error || "This recovery session has expired or is missing security tokens."}</p>
          <Button asChild variant="outline" className="w-full rounded-2xl h-14 border-white/10 font-bold">
            <Link href="/forgot-password">Request New Recovery Link</Link>
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
            <h1 className="text-4xl font-bold font-headline">Password Applied</h1>
            <p className="text-muted-foreground">Your credentials have been updated successfully. Redirecting to login...</p>
          </div>
          <Button asChild size="lg" className="w-full rounded-2xl h-14 font-bold shadow-xl">
            <Link href="/login">Return to Security Login</Link>
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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-xl">
              <Zap className="h-7 w-7 text-white" fill="currentColor" />
            </div>
            <span className="font-headline text-3xl font-bold tracking-tighter">Prontly</span>
          </Link>
          <h1 className="text-4xl font-bold font-headline">Secure New Access</h1>
          <p className="text-muted-foreground mt-3 text-lg">Define a new password for <span className="text-foreground font-bold">{email}</span></p>
        </div>

        <Card className="border-white/5 bg-card/30 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-3xl">
          <CardHeader className="p-10 pb-4">
            <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest mb-2">
              <ShieldCheck className="h-4 w-4" /> Identity Verified
            </div>
            <CardTitle className="text-xl font-headline">Define Credentials</CardTitle>
          </CardHeader>
          <CardContent className="p-10 pt-0">
            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-3">
                <Label className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground ml-1">New Secure Password</Label>
                <div className="relative">
                  <Input 
                    type={showPass ? "text" : "password"} 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 bg-background/50 border-white/10 rounded-2xl px-6 text-lg focus:ring-2 focus:ring-primary pr-12"
                    placeholder="Min 8 characters"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <Label className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Confirm New Password</Label>
                <Input 
                  type="password" 
                  required 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-14 bg-background/50 border-white/10 rounded-2xl px-6 text-lg focus:ring-2 focus:ring-primary"
                />
              </div>
              <Button type="submit" className="w-full h-16 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.01] transition-all" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : 'Synchronize Account'}
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
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
