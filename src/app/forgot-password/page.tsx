'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft, KeyRound, Lock } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';

type Step = 'email' | 'otp' | 'password';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      if (!res.ok) throw new Error(data.error || 'Failed to send code');
      toast({ title: 'Code sent', description: `Verification code sent via reset-password@store.prontly.in to ${email}` });
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send code');
      toast({ variant: 'destructive', title: 'Request failed', description: err.message });
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
      if (!res.ok) throw new Error(data.error || 'Invalid code');
      setResetToken(data.resetToken);
      setStep('password');
      toast({ title: 'Verified', description: 'Enter your new password' });
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      toast({ title: 'Password updated', description: 'You can now sign in with your new password' });
      setTimeout(() => (window.location.href = '/login'), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-5 py-10">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="mb-4 flex items-center gap-2">
            <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-muted shadow-sm">
              <Image src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png" alt="Prontly Logo" fill className="object-cover" />
            </div>
            <span className="font-headline text-lg font-bold tracking-tight">Prontly</span>
          </Link>
          <h1 className="text-xl font-bold">Account recovery</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {step === 'email' && 'We’ll email you a secure 6-digit code via Brevo.'}
            {step === 'otp' && `Enter the code sent to ${email}`}
            {step === 'password' && 'Create your new password'}
          </p>
          <div className="mt-3 flex items-center gap-1.5">
            {(['email', 'otp', 'password'] as Step[]).map((s, i) => (
              <div key={s} className={`h-1.5 w-8 rounded-full transition-colors ${step === s ? 'bg-primary' : i < ['email', 'otp', 'password'].indexOf(step) ? 'bg-primary/40' : 'bg-muted'}`} />
            ))}
          </div>
        </div>

        <Card className="rounded-xl border-stone-gray/10 bg-white shadow-sm overflow-hidden">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              {step === 'email' && <><KeyRound className="h-4 w-4 text-primary" /> Reset password</>}
              {step === 'otp' && <><KeyRound className="h-4 w-4 text-primary" /> Verify code</>}
              {step === 'password' && <><Lock className="h-4 w-4 text-primary" /> New password</>}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            {step === 'email' && (
              <form onSubmit={handleRequestOtp} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email" className="text-xs">Email address</Label>
                  <Input id="reset-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="h-10" />
                  <p className="text-[10px] text-muted-foreground">Code will be sent from <span className="font-mono font-medium">reset-password@store.prontly.in</span> via Brevo</p>
                </div>
                <Button type="submit" className="h-10 w-full rounded-lg text-sm font-medium" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send code'}
                </Button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="otp" className="text-xs">6-digit code</Label>
                  <Input id="otp" type="text" inputMode="numeric" required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" className="h-10 tracking-[0.3em] text-center font-mono text-lg" maxLength={6} />
                </div>
                <Button type="submit" className="h-10 w-full rounded-lg text-sm font-medium" disabled={loading || otp.length !== 6}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify code'}
                </Button>
                <Button type="button" variant="ghost" className="w-full h-9 rounded-lg text-xs" onClick={() => setStep('email')}>Change email</Button>
              </form>
            )}

            {step === 'password' && (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="new-password" className="text-xs">New password</Label>
                  <Input id="new-password" type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 characters" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-xs">Confirm password</Label>
                  <Input id="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className="h-10" />
                </div>
                <Button type="submit" className="h-10 w-full rounded-lg text-sm font-medium" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update password'}
                </Button>
              </form>
            )}

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
              </div>
            )}
            {step === 'otp' && (
              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={loading}
                  className="text-xs text-primary hover:underline disabled:opacity-50"
                >
                  Resend code
                </button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center border-t bg-muted/20 p-4">
            <Link href="/login" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-3 w-3" /> Back to sign in
            </Link>
          </CardFooter>
        </Card>

        <p className="text-center text-[10px] text-muted-foreground">
          All recovery emails are sent via Brevo from <span className="font-mono">reset-password@store.prontly.in</span>
        </p>
      </div>
    </div>
  );
}
