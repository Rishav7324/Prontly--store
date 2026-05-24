'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Zap, Loader2, MailCheck, ArrowLeft, ShieldAlert, AlertCircle, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function ForgotPasswordPage() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIsFallback(false);

    try {
      // Step 1: Try the Branded Recovery API
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Branded recovery failed');
      }

      setSent(true);
      toast({
        title: "Branded Recovery Sent",
        description: "Check your inbox for a secure recovery link.",
      });

    } catch (err: any) {
      console.warn('Branded Recovery failed, triggering Firebase Fallback:', err.message);
      
      // Step 2: Fallback to standard Firebase reset if Branded API fails
      if (auth) {
        try {
          await sendPasswordResetEmail(auth, email);
          setIsFallback(true);
          setSent(true);
          toast({
            title: "Recovery Link Sent",
            description: "We've sent a standard recovery link to your inbox.",
          });
        } catch (fbErr: any) {
          console.error('Firebase Fallback failed:', fbErr);
          setError('Could not process recovery. Please verify your email address.');
        }
      } else {
        setError('Authentication service is currently unavailable.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="flex justify-center">
            <div className="h-24 w-24 bg-primary/10 rounded-[2rem] flex items-center justify-center border border-primary/20 shadow-2xl">
              <MailCheck className="h-12 w-12 text-primary" />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold font-headline">Check Your Inbox</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {isFallback 
                ? `A standard recovery link was sent to ${email}.` 
                : `A secure branded link was sent to ${email}.`}
            </p>
            {isFallback && (
              <Badge variant="outline" className="mt-4 border-yellow-500/20 text-yellow-500 bg-yellow-500/5">
                Standard Fallback Active
              </Badge>
            )}
          </div>
          <div className="pt-8 border-t border-white/5">
            <Button asChild size="lg" className="w-full rounded-2xl h-14 font-bold shadow-xl shadow-primary/20">
              <Link href="/login">Back to Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-4xl font-bold font-headline">Account Recovery</h1>
          <p className="text-muted-foreground mt-3 text-lg">Enter your email to receive a recovery link.</p>
        </div>

        <Card className="border-white/5 bg-card/30 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
          <CardHeader className="p-10 pb-6">
            <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-3">
              <ShieldAlert className="h-4 w-4" /> Identity Protection Active
            </div>
            <CardTitle className="text-2xl font-headline">Security Verification</CardTitle>
          </CardHeader>

          <CardContent className="p-10 pt-0">
            <form onSubmit={handleReset} className="space-y-8">
              <div className="space-y-3">
                <Label htmlFor="email" className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground ml-1">
                  Registered Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-16 bg-background/50 border-white/10 rounded-2xl px-6 text-lg"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive text-sm font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-16 rounded-2xl text-lg font-bold" disabled={loading}>
                {loading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Validating...</span>
                  </div>
                ) : 'Send Recovery Link'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="bg-muted/30 p-8 flex justify-center border-t border-white/5">
            <Button variant="ghost" asChild className="gap-2 text-muted-foreground hover:text-primary font-bold text-xs uppercase tracking-widest">
              <Link href="/login">
                <ArrowLeft className="h-4 w-4" />
                Return to Login
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
