'use client';

import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Zap, Loader2, ShieldCheck, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
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
          <p className="text-muted-foreground mt-3 text-lg">
            {sent ? "Instructions sent!" : "Enter your email to receive a secure reset link."}
          </p>
        </div>

        <Card className="border-white/5 bg-card/30 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
          <CardHeader className="p-10 pb-6 text-center">
            <div className="inline-flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-3 mx-auto">
              <ShieldCheck className="h-4 w-4" /> Identity Protection
            </div>
          </CardHeader>

          <CardContent className="p-10 pt-0">
            {sent ? (
              <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
                <div className="space-y-2">
                  <p className="text-foreground font-medium">We've sent a link to <span className="text-primary font-bold">{email}</span></p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Please check your inbox (and spam folder) for instructions to finalize your new password.</p>
                </div>
                <Button variant="outline" className="w-full h-14 rounded-2xl" onClick={() => setSent(false)}>
                  Didn't get it? Try again
                </Button>
              </div>
            ) : (
              <form onSubmit={handleRequestReset} className="space-y-6">
                <div className="space-y-3">
                  <Label className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                  <Input 
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="h-16 bg-background/50 border-white/10 rounded-2xl px-6 text-lg"
                  />
                </div>
                <Button type="submit" className="w-full h-16 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : 'Send Reset Link'}
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
            <Link href="/login" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-3 w-3" /> Return to Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
