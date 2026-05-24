
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * @fileOverview This page is now deprecated in favor of the OTP flow in /forgot-password.
 * It automatically redirects legacy traffic to the unified recovery center.
 */
export default function LegacyResetPasswordPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/forgot-password');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground uppercase font-bold tracking-widest text-[10px]">
          Redirecting to Recovery Center...
        </p>
      </div>
    </div>
  );
}
