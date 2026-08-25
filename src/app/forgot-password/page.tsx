'use client';

import { useState } from 'react';
import Image from 'next/image';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';

export default function ForgotPasswordPage() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    
    setLoading(true);
    setError(null);

    try {
      // Use standard Firebase link-based recovery
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
      });
      setSent(true);
      toast({ title: "Email Dispatched", description: "Check your inbox for reset instructions." });
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send recovery email.');
      toast({ variant: "destructive", title: "Request Failed", description: "Please verify your email address." });
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
              <Image 
                src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png" 
                alt="Prontly Logo" 
                fill 
                className="object-cover"
              />
            </div>
            <span className="font-headline text-lg font-bold tracking-tight text-midnight-ink">Prontly</span>
          </Link>
          <h1 className="text-xl font-bold font-headline text-midnight-ink">Account recovery</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {sent ? "Instructions sent!" : "We'll email you a secure reset link."}
          </p>
        </div>

        <Card className="rounded-xl border-stone-gray/10 bg-white shadow-sm overflow-hidden">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-semibold">Reset password</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            {sent ? (
              <div className="animate-in fade-in zoom-in space-y-4 text-center duration-300">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-foreground">
                    We've sent a link to <span className="font-semibold text-primary">{email}</span>
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Please check your inbox (and spam folder) for instructions to finalize your new password.
                  </p>
                </div>
                <Button variant="outline" className="h-10 w-full rounded-lg text-sm font-medium" onClick={() => setSent(false)}>
                  Didn't get it? Try again
                </Button>
              </div>
            ) : (
              <form onSubmit={handleRequestReset} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email" className="text-xs">Email address</Label>
                  <Input 
                    id="reset-email"
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="h-10"
                  />
                </div>
                <Button type="submit" className="h-10 w-full rounded-lg text-sm font-medium" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send reset link'}
                </Button>
              </form>
            )}

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-center border-t border-stone-gray/5 bg-porcelain-white/50 p-4">
            <Link href="/login" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-3 w-3" /> Back to sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
