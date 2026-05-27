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
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
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
      toast({ title: "Login Successful", description: "Accessing your digital workspace." });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login failed', error);
      toast({ 
        variant: "destructive", 
        title: "Authentication Failed", 
        description: "The credentials provided do not match our records." 
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
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      const isNewUser = !userSnap.exists();

      if (isNewUser) {
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

        if (user.email) {
          sendWelcomeEmail(user.email, user.displayName || 'Creator')
            .catch(e => console.warn('Welcome email background failure:', e.message));
        }
        toast({ title: "Welcome to Prontly!", description: "Account created via Google identity." });
      } else {
        await setDoc(userRef, {
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
        
        toast({ title: "Session Restored", description: "Welcome back to the marketplace." });
      }

      router.push('/dashboard');
    } catch (error: any) {
      console.error('Google Auth Error:', error);
      
      let title = "Authentication Error";
      let message = "Could not verify Google identity.";

      if (error.code === 'auth/internal-error') {
        title = "Internal Configuration Error";
        message = "Please ensure this domain is added to 'Authorized Domains' in the Firebase Auth Console.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        message = "Login was cancelled by closing the popup.";
      } else if (error.code === 'auth/unauthorized-domain') {
        message = "This domain is not authorized for OAuth. Check Firebase Console.";
      }
      
      toast({ variant: "destructive", title, description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-3 mb-6 group">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-white/5 shadow-2xl transition-transform group-hover:scale-110">
              <Image 
                src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png" 
                alt="Prontly Logo" 
                fill 
                className="object-cover"
              />
            </div>
            <span className="font-script text-2xl font-bold tracking-tight text-midnight-ink">Prontly Store</span>
          </Link>
          <h1 className="text-3xl font-bold font-headline text-midnight-ink">Secure Access</h1>
          <p className="text-muted-foreground mt-2">Manage your digital assets and library</p>
        </div>

        <Card className="border-stone-gray/10 bg-white/50 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">
              <ShieldCheck className="h-3.5 w-3.5" /> Identity 
            </div>
            <CardTitle className="text-xl font-bold">Sign In</CardTitle>
            <CardDescription>Enter your registered email </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@domain.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50 h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" size="sm" className="text-xs text-primary hover:underline font-bold">
                    Recovery access?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background/50 h-11 rounded-xl"
                />
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl font-bold bg-deep-violet hover:bg-deep-violet/90 shadow-lg shadow-deep-violet/20" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Authorize Session'}
              </Button>
            </form>
            
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-stone-gray/10" />
              </div>
              <div className="relative flex justify-center text-[9px] uppercase font-black tracking-widest">
                <span className="bg-white px-4 text-ghost-gray">Identity Provider</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full h-12 rounded-xl border-stone-gray/20 bg-white hover:bg-porcelain-white font-bold transition-all" 
              onClick={handleGoogleLogin} 
              disabled={loading}
            >
              <svg className="mr-3 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-stone-gray/5 bg-porcelain-white/50 p-6">
            <div className="text-sm text-muted-foreground font-medium">
              New to the marketplace?{' '}
              <Link href="/signup" className="text-primary hover:underline font-bold">
                Initialize Account
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
