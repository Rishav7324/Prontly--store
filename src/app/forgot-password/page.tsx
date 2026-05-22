
'use client';

import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Zap, Loader2, MailCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { sendPasswordResetEmail as sendResendResetEmail } from '@/app/actions/email-actions';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const auth = useAuth();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      
      // Send branded notification via Resend (Non-blocking)
      sendResendResetEmail(email);

      setSent(true);
      toast({ title: "Email Sent", description: "Check your inbox for password reset instructions." });
    } catch (error: any) {
      console.error('Reset failed', error);
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to send reset email." });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
              <MailCheck className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold font-headline">Check your email</h1>
          <p className="text-muted-foreground">We've sent password reset instructions to <strong>{email}</strong>.</p>
          <Button asChild className="w-full">
            <Link href="/login">Return to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-6 w-6 text-white" fill="currentColor" />
            </div>
            <span className="font-headline text-2xl font-bold tracking-tight">PRONTLY</span>
          </Link>
          <h1 className="text-3xl font-bold font-headline">Reset Password</h1>
          <p className="text-muted-foreground mt-2">We'll send you instructions to reset your password</p>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Forgot Password?</CardTitle>
            <CardDescription>Enter your account email address</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send Reset Link'}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" asChild className="w-full gap-2">
              <Link href="/login">
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
