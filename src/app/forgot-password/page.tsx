'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Zap, Loader2, MailCheck, ArrowLeft, ShieldAlert, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { initiateBrandedPasswordReset } from '@/app/actions/email-actions';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '@/firebase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const auth = useAuth();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setIsFallback(false);

    try {
      // Step 1: Attempt the premium branded recovery via Resend + Admin SDK
      const res = await initiateBrandedPasswordReset(email);
      
      if (res.success) {
        setSent(true);
        toast({ title: "Branded Recovery Sent", description: "Check your inbox for your custom reset link." });
      } else {
        // Step 2: If it's a configuration issue (missing service account/API keys), 
        // silently trigger the standard Firebase fallback for better UX.
        if (res.error?.includes('credentials missing') || res.error?.includes('Admin SDK')) {
          if (!auth) throw new Error("Authentication system is offline.");
          
          await sendPasswordResetEmail(auth, email);
          setSent(true);
          setIsFallback(true);
          toast({ 
            title: "Recovery Dispatched", 
            description: "Advanced recovery was unavailable. Standard Firebase email sent." 
          });
        } else {
          throw new Error(res.error);
        }
      }
    } catch (error: any) {
      console.error('Recovery error:', error);
      toast({ 
        variant: "destructive", 
        title: "Recovery Failed", 
        description: error.message || "We could not process your recovery request at this time." 
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="flex justify-center">
            <div className="h-24 w-24 bg-primary/10 rounded-[2rem] flex items-center justify-center border border-primary/20 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
              <MailCheck className="h-12 w-12 text-primary relative z-10" />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold font-headline">Email Dispatched</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              A recovery link has been generated and sent to <strong className="text-foreground">{email}</strong>.
            </p>
            {isFallback && (
              <p className="text-[10px] uppercase font-bold tracking-widest text-primary/60 bg-primary/5 py-1 px-3 rounded-full inline-block">
                Standard Delivery Method Active
              </p>
            )}
          </div>
          <div className="pt-8 border-t border-white/5">
            <Button asChild size="lg" className="w-full rounded-2xl h-14 font-bold shadow-xl shadow-primary/20">
              <Link href="/login">Return to Security Login</Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-6 italic">
              Didn't get it? Check your spam folder or try again in 5 minutes.
            </p>
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
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-primary shadow-2xl shadow-primary/30 transition-all group-hover:scale-105 group-hover:rotate-3">
              <Zap className="h-8 w-8 text-white" fill="currentColor" />
            </div>
            <span className="font-headline text-3xl font-bold tracking-tighter">PRONTLY</span>
          </Link>
          <h1 className="text-4xl font-bold font-headline">Access Recovery</h1>
          <p className="text-muted-foreground mt-3 text-lg">Regain entry to your digital library.</p>
        </div>

        <Card className="border-white/5 bg-card/30 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
          <CardHeader className="p-10 pb-6">
            <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-3">
              <ShieldAlert className="h-4 w-4" /> Identity Layer Active
            </div>
            <CardTitle className="text-2xl font-headline">Verification</CardTitle>
            <CardDescription className="text-sm">Enter your registered electronic mail address.</CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-0 space-y-8">
            <form onSubmit={handleReset} className="space-y-8">
              <div className="space-y-3">
                <Label htmlFor="email" className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Account Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@provider.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-16 bg-background/50 border-white/10 rounded-2xl px-6 text-lg focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <Button type="submit" className="w-full h-16 rounded-2xl text-lg font-bold shadow-2xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all" disabled={loading}>
                {loading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : 'Dispatch Recovery link'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="bg-muted/30 p-8 flex justify-center border-t border-white/5">
            <Button variant="ghost" asChild className="gap-2 text-muted-foreground hover:text-primary transition-all font-bold text-xs uppercase tracking-widest">
              <Link href="/login">
                <ArrowLeft className="h-4 w-4" />
                Back to Authentication
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
