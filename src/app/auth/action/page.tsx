'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * @fileOverview Universal handler for Firebase Auth actions.
 * Prevents 404s when clicking reset/verify links and redirects to custom branded pages.
 */
function AuthActionHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');
    
    if (mode === 'resetPassword' && oobCode) {
      // Redirect to our branded reset page
      router.push(`/reset-password?oobCode=${oobCode}`);
    } else if (mode === 'verifyEmail' && oobCode) {
      // For now, redirect home. Can be extended to a /verify-email page.
      router.push('/');
    } else {
      // Catch-all for unexpected auth modes
      router.push('/login');
    }
  }, [router, searchParams]);

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground font-medium animate-pulse uppercase tracking-widest text-[10px]">
        Synchronizing Security Layer...
      </p>
    </div>
  );
}

export default function AuthActionPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <AuthActionHandler />
    </Suspense>
  );
}
