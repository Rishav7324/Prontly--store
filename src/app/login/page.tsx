'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, getAdditionalUserInfo, type User as FirebaseUser } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { sendWelcomeEmail } from '@/app/actions/email-actions';

// Ensure the Neon users row exists (fire-and-forget)
const syncUserToNeon = (user: FirebaseUser, displayName: string) => {
  user
    .getIdToken()
    .then((token) =>
      fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid: user.uid, email: user.email, displayName, photoURL: user.photoURL || '' }),
      }).catch(() => {})
    )
    .catch(() => {});
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      // Sync to Neon SQL (ensures users table has row for FK)
      syncUserToNeon(cred.user, cred.user.displayName || email.split('@')[0]);
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
    if (!auth) return;
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const info = await getAdditionalUserInfo(result);
      const isNewUser = info?.isNewUser ?? false;

      // Sync to Neon SQL (ensures users table row; upsert-safe for returning users)
      syncUserToNeon(user, user.displayName || 'Creator');

      if (isNewUser) {
        if (user.email) {
          sendWelcomeEmail(user.email, user.displayName || 'Creator')
            .catch(e => console.warn('Welcome email background failure:', e.message));
        }
        toast({ title: "Welcome to Prontly!", description: "Account created via Google identity." });
      } else {
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
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
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
            <span className="font-script text-lg font-bold tracking-tight text-foreground">Prontly Store</span>
          </Link>
          <h1 className="text-xl font-bold font-headline text-foreground">Sign in</h1>
          <p className="mt-1 text-xs text-muted-foreground">Manage your digital assets and library</p>
        </div>

        <Card className="rounded-2xl border-border/80 bg-card shadow-sm overflow-hidden">
          <CardHeader className="p-5 pb-3 space-y-1">
            <CardTitle className="text-sm font-semibold text-foreground">Welcome back</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Enter your registered email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5 pt-0">
            <form onSubmit={handleEmailLogin} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-foreground">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@domain.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold text-foreground">Password</Label>
                  <Link href="/forgot-password" className="text-xs text-accent hover:underline font-semibold">
                    Forgot password?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>
              <Button type="submit" className="h-10 w-full rounded-xl text-sm font-semibold bg-zinc-950 text-white hover:bg-zinc-800" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign in'}
              </Button>
            </form>
            
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-[10px] text-muted-foreground">
                <span className="bg-card px-3 font-medium">or</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="h-10 w-full rounded-xl border-border/80 bg-card text-sm font-semibold hover:bg-muted text-foreground" 
              onClick={handleGoogleLogin} 
              disabled={loading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/50 bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground font-medium">
              New here?{' '}
              <Link href="/signup" className="font-semibold text-foreground hover:underline">
                Create account
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
