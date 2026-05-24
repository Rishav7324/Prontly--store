
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Zap, Loader2, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'verify' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState('');
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/request-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setStep('verify');
      setTimer(60);
      toast({ title: "Check your inbox", description: "Verification code has been dispatched." });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setResetToken(data.resetToken);
      setStep('reset');
      toast({ title: "OTP Verified", description: "You can now set a new password." });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast({ title: "Password Reset Successfully", description: "Redirecting to login..." });
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-3 mb-10 group">
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-primary shadow-2xl shadow-primary/30 transition-all group-hover:scale-105">
              <Zap className="h-8 w-8 text-white" fill="currentColor" />
            </div>
            <span className="font-headline text-3xl font-bold tracking-tighter uppercase">Prontly</span>
          </Link>
          <h1 className="text-4xl font-bold font-headline">
            {step === 'request' && 'Account Recovery'}
            {step === 'verify' && 'Verification Required'}
            {step === 'reset' && 'Secure New Access'}
          </h1>
          <p className="text-muted-foreground mt-3 text-lg">
            {step === 'request' && 'Enter your email for a reset code.'}
            {step === 'verify' && `We've sent a 6-digit code to ${email}`}
            {step === 'reset' && 'Define your new account credentials.'}
          </p>
        </div>

        <Card className="border-white/5 bg-card/30 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
          <CardHeader className="p-10 pb-6">
            <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-3">
              <ShieldCheck className="h-4 w-4" /> Identity Protection Active
            </div>
          </CardHeader>

          <CardContent className="p-10 pt-0">
            {step === 'request' && (
              <form onSubmit={handleRequestOtp} className="space-y-6">
                <div className="space-y-3">
                  <Label className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                  <Input 
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="h-16 bg-background/50 border-white/10 rounded-2xl px-6 text-lg"
                  />
                </div>
                <Button type="submit" className="w-full h-16 rounded-2xl text-lg font-bold" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : 'Send Reset Code'}
                </Button>
              </form>
            )}

            {step === 'verify' && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-3">
                  <Label className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground ml-1">6-Digit Code</Label>
                  <Input 
                    maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value)}
                    placeholder="000000"
                    className="h-16 bg-background/50 border-white/10 rounded-2xl px-6 text-center text-3xl font-black tracking-[0.5em]"
                  />
                </div>
                <Button type="submit" className="w-full h-16 rounded-2xl text-lg font-bold" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : 'Verify Code'}
                </Button>
                <div className="text-center">
                  <button 
                    type="button" 
                    onClick={handleRequestOtp}
                    disabled={timer > 0 || loading}
                    className="text-sm font-bold text-primary disabled:opacity-50"
                  >
                    {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                  </button>
                </div>
              </form>
            )}

            {step === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-3">
                  <Label className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground ml-1">New Password</Label>
                  <Input 
                    type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="h-16 bg-background/50 border-white/10 rounded-2xl px-6 text-lg"
                  />
                </div>
                <Button type="submit" className="w-full h-16 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20" disabled={loading || newPassword.length < 8}>
                  {loading ? <Loader2 className="animate-spin" /> : 'Finalize Reset'}
                </Button>
              </form>
            )}

            {error && (
              <div className="mt-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive text-sm font-medium">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}
          </CardContent>

          <CardFooter className="bg-muted/30 p-8 flex justify-center border-t border-white/5">
            <Link href="/login" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
              Return to Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
