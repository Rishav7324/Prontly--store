'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useAuth, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { sendWelcomeEmail } from '@/app/actions/email-actions';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Login Successful", description: "Redirecting to your dashboard..." });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login failed', error);
      toast({ 
        variant: "destructive", 
        title: "Login Failed", 
        description: "Invalid email or password. Please try again." 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth || !db) return;
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      // Set parameters for better UX
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if profile exists to determine if this is a first-time login (signup)
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      const isNewUser = !userSnap.exists();

      if (isNewUser) {
        // Create full profile for new Google user
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

        // Send Welcome Email for new registration - isolated to prevent flow block
        if (user.email) {
          sendWelcomeEmail(user.email, user.displayName || 'Creator')
            .catch(e => console.warn('Background welcome email failed:', e.message));
        }
        toast({ title: "Welcome to Prontly!", description: "Your account has been created successfully." });
      } else {
        // Just update last login for returning user
        await setDoc(userRef, {
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          displayName: user.displayName || userSnap.data()?.displayName,
          photoURL: user.photoURL || userSnap.data()?.photoURL,
        }, { merge: true });
        
        toast({ title: "Welcome back!", description: "Accessing your workspace." });
      }

      router.push('/dashboard');
    } catch (error: any) {
      console.error('Google login failed:', error);
      
      let message = "Google sign-in failed. Please try again.";
      if (error.code === 'auth/popup-closed-by-user') {
        message = "Sign-in popup was closed before completion.";
      } else if (error.code === 'auth/internal-error') {
        message = "Authentication server error. Please ensure authorized domains are configured.";
      } else if (error.code === 'auth/unauthorized-domain') {
        message = "This domain is not authorized for Google Sign-In in Firebase Console.";
      }
      
      toast({ variant: "destructive", title: "Authentication Error", description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-3 mb-6">
            <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-white/5 shadow-xl">
              <Image 
                src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png" 
                alt="Prontly Logo" 
                fill 
                className="object-cover"
              />
            </div>
            <span className="font-headline text-2xl font-bold tracking-tight">PRONTLY</span>
          </Link>
          <h1 className="text-3xl font-bold font-headline">Welcome back</h1>
          <p className="text-muted-foreground mt-2">Sign in to your account to continue</p>
        </div>

        <Card className="border-border/50 bg-card/30 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Enter your credentials to access your store dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" size="sm" className="text-xs text-primary hover:underline font-bold">
                    Forgot password?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <Button type="submit" className="w-full h-11 rounded-xl font-bold" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign In'}
              </Button>
            </form>
            
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                <span className="bg-[#0c0c0e] px-4 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button variant="outline" className="w-full h-11 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-bold" onClick={handleGoogleLogin} disabled={loading}>
              <svg className="mr-3 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google Account
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-white/5 pt-6">
            <div className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-primary hover:underline font-bold">
                Create one
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
