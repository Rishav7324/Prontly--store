'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Zap, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { sendWelcomeEmail } from '@/app/actions/email-actions';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'main') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;

    if (formData.password !== formData.confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Passwords do not match." });
      return;
    }

    if (!formData.acceptTerms) {
      toast({ variant: "destructive", title: "Error", description: "You must accept the terms." });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: formData.name });

      // Create Firestore User Profile
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: formData.name,
        role: 'customer',
        isActive: true,
        orderCount: 0,
        totalSpent: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Send Welcome Email (Non-blocking) - Sanitize settings for Server Action
      const plainSettings = settings ? {
        emailSettings: settings.emailSettings || null
      } : null;
      sendWelcomeEmail(formData.email, formData.name, plainSettings);

      toast({ title: "Welcome to Prontly!", description: "Your account has been created successfully." });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Signup failed', error);
      toast({ variant: "destructive", title: "Signup Failed", description: error.message || "Failed to create account." });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!auth || !db) return;
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if profile exists, if not create one
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'customer',
        isActive: true,
        orderCount: 0,
        totalSpent: 0,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Send Welcome Email (Non-blocking)
      if (user.email && user.displayName) {
        const plainSettings = settings ? {
          emailSettings: settings.emailSettings || null
        } : null;
        sendWelcomeEmail(user.email, user.displayName, plainSettings);
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Google signup failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-6 w-6 text-white" fill="currentColor" />
            </div>
            <span className="font-headline text-2xl font-bold tracking-tight">PRONTLY</span>
          </Link>
          <h1 className="text-3xl font-bold font-headline">Create your account</h1>
          <p className="text-muted-foreground mt-2">Join the marketplace for premium digital assets</p>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>Enter your details to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  placeholder="John Doe" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  required 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm</Label>
                  <Input 
                    id="confirm" 
                    type="password" 
                    required 
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="terms" 
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => setFormData({...formData, acceptTerms: !!checked})}
                />
                <label htmlFor="terms" className="text-xs text-muted-foreground leading-none">
                  I agree to the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                </label>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Account'}
              </Button>
            </form>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or sign up with</span>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleGoogleSignup} disabled={loading}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center">
            <div className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
