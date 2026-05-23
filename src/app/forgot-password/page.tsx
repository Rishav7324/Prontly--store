
'use client';

import { useState } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Zap, Loader2, MailCheck, ArrowLeft, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { sendCustomPasswordResetEmail } from '@/app/actions/email-actions';

/**
 * PRODUCTION RESET FLOW:
 * Replaces the default Firebase Auth email with a branded Resend notification.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const db = useFirestore();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    setLoading(true);
    try {
      // 1. Generate a secure custom token in Firestore
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const resetLink = `${window.location.origin}/reset-password?token=${token}`;

      await addDoc(collection(db, 'password_resets'), {
        email: email.toLowerCase(),
        token,
        status: 'pending',
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
        createdAt: serverTimestamp()
      });

      // 2. Dispatch branded email via Resend
      const res = await sendCustomPasswordResetEmail(email, resetLink);
      
      if (res.success) {
        setSent(true);
        toast({ title: "Branded Email Dispatched", description: "Your recovery instructions are on the way." });
      } else {
        throw new Error('Email delivery failure');
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Recovery Failed", description: "We couldn't process your request. Please check the address." });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="flex justify-center">
            <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/20 shadow-2xl">
              <MailCheck className="h-10 w-10 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold font-headline">Check Your Inbox</h1>
            <p className="text-muted-foreground text-lg">We've sent a branded recovery link to <strong>{email}</strong>.</p>
          </div>
          <div className="pt-8 border-t border-white/5 space-y-4">
            <Button asChild size="lg" className="w-full rounded-2xl h-14 font-bold shadow-xl">
              <Link href="/login">Return to Security Login</Link>
            </Button>
            <p className="text-xs text-muted-foreground">Didn't get the email? Check your spam or <button onClick={handleReset} className="text-primary hover:underline">retry dispatch</button>.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-3 mb-8 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-2xl shadow-primary/30 transition-transform group-hover:scale-105">
              <Zap className="h-7 w-7 text-white" fill="currentColor" />
            </div>
            <span className="font-headline text-3xl font-bold tracking-tight">PRONTLY</span>
          </Link>
          <h1 className="text-4xl font-bold font-headline">Access Recovery</h1>
          <p className="text-muted-foreground mt-3 text-lg">Enter your verified email to receive a recovery link.</p>
        </div>

        <Card className="border-white/5 bg-card/30 rounded-[2rem] overflow-hidden shadow-2xl">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-2">
              <ShieldAlert className="h-4 w-4" /> Security Layer Active
            </div>
            <CardTitle className="text-xl">Branded Verification</CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Account Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@company.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 bg-background/50 border-white/10 rounded-2xl px-6 text-lg focus:ring-2 focus:ring-primary"
                />
              </div>
              <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : 'Dispatch Recovery Email'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="bg-muted/30 p-8 flex justify-center">
            <Button variant="ghost" asChild className="gap-2 text-muted-foreground hover:text-primary transition-all">
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
