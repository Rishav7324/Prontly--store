'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;

    if (formData.password !== formData.confirmPassword) {
      toast({ variant: "destructive", title: "Validation Error", description: "Passwords do not match." });
      return;
    }

    if (!formData.acceptTerms) {
      toast({ variant: "destructive", title: "Compliance Required", description: "You must accept the terms of service." });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: formData.name });

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: formData.name,
        role: 'customer',
        isActive: true,
        orderCount: 0,
        totalSpent: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });

      // Sync to Neon SQL (if DATABASE_URL configured)
      try {
        const token = await user.getIdToken();
        await fetch('/api/user/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ uid: user.uid, email: user.email, displayName: formData.name, photoURL: user.photoURL || null }),
        }).catch(() => {});
      } catch {}

      sendWelcomeEmail(formData.email, formData.name)
        .catch(e => console.warn('Welcome email failure:', e.message));
      
      toast({ title: "Account Initialized", description: "Redirecting to your library." });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Signup failed:', error);
      toast({ 
        variant: "destructive", 
        title: "Registration Fault", 
        description: error.message || "Failed to create account. Email may already be in use." 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!auth || !db) return;
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Creator',
          photoURL: user.photoURL || '',
          role: 'customer',
          isActive: true,
          orderCount: 0,
          totalSpent: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
        });

        try {
          const token = await user.getIdToken();
          await fetch('/api/user/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ uid: user.uid, email: user.email, displayName: user.displayName || 'Creator', photoURL: user.photoURL || '' }),
          }).catch(() => {});
        } catch {}

        if (user.email) {
          sendWelcomeEmail(user.email, user.displayName || 'Creator')
            .catch(e => console.warn('Welcome email failure:', e.message));
        }
        toast({ title: "Identity Linked", description: "Your account is now ready." });
      } else {
        toast({ title: "Account Detected", description: "You already have an account. Logging in." });
      }

      router.push('/dashboard');
    } catch (error: any) {
      console.error('Google Auth Error:', error);
      
      let title = "Sync Error";
      let message = "Could not initialize account via Google.";

      if (error.code === 'auth/internal-error') {
        title = "Domain Not Authorized";
        message = "Please add your workstation domain to 'Authorized Domains' in Firebase Console.";
      }
      
      toast({ variant: "destructive", title, description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-5 py-10">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="mb-4 flex items-center gap-2 group">
            <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-muted shadow-sm transition-transform group-hover:scale-105">
              <Image 
                src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png" 
                alt="Prontly Logo" 
                fill 
                className="object-cover"
              />
            </div>
            <span className="font-script text-lg font-bold tracking-tight text-midnight-ink">Prontly Store</span>
          </Link>
          <h1 className="text-xl font-bold font-headline text-midnight-ink">Create account</h1>
          <p className="mt-1 text-xs text-muted-foreground">Join the marketplace in seconds</p>
        </div>

        <Card className="rounded-xl border-stone-gray/10 bg-white shadow-sm overflow-hidden">
          <CardHeader className="p-5 pb-3 space-y-1">
            <CardTitle className="text-sm font-semibold">New account</CardTitle>
            <CardDescription className="text-xs">Enter your details below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5 pt-0">
            <form onSubmit={handleSignup} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs">Full name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. John Doe" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@domain.com" 
                  required 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="h-10"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm" className="text-xs">Confirm</Label>
                  <Input 
                    id="confirm" 
                    type="password" 
                    required 
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className="h-10"
                  />
                </div>
              </div>
              
              <div className="flex items-start space-x-2 pt-1">
                <Checkbox 
                  id="terms" 
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => setFormData({...formData, acceptTerms: !!checked})}
                  className="border-primary mt-0.5 h-4 w-4 rounded-md"
                />
                <label htmlFor="terms" className="text-xs leading-snug text-muted-foreground">
                  I agree to the <Link href="/terms" className="font-medium text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" className="font-medium text-primary hover:underline">Privacy Policy</Link>
                </label>
              </div>

              <Button type="submit" className="h-10 w-full rounded-lg text-sm font-medium" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create account'}
              </Button>
            </form>
            
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-stone-gray/10" />
              </div>
              <div className="relative flex justify-center text-[10px] text-muted-foreground">
                <span className="bg-white px-3">or</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="h-10 w-full rounded-lg border-stone-gray/20 bg-white text-sm font-medium hover:bg-porcelain-white" 
              onClick={handleGoogleSignup} 
              disabled={loading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign up with Google
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-stone-gray/5 bg-porcelain-white/50 p-4">
            <p className="text-xs text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
