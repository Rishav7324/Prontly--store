'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

/**
 * @fileOverview Specialized Order Success Terminal
 * Features a mobile "Half-Screen" layout and desktop "Square Popup" visual style.
 * Integrates DotLottie animation for a professional fulfillment experience.
 */
function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      
      <main className="container mx-auto px-4 z-10 flex items-center justify-center h-full">
        {/* Success Container: Adaptive Layout */}
        <div className={cn(
          "bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] border border-stone-gray/10 flex flex-col items-center justify-center text-center transition-all duration-1000 ease-out animate-in fade-in zoom-in-95",
          // Mobile: Half screen fixed at bottom
          "fixed bottom-0 left-0 right-0 h-[60vh] rounded-t-[3rem] p-10",
          // Desktop: Square popup centered
          "sm:relative sm:bottom-auto sm:w-[500px] sm:h-[500px] sm:rounded-[4rem] sm:p-12"
        )}>
          {/* Lottie Animation Success Visual */}
          <div className="relative h-48 w-48 mb-4 pointer-events-none flex items-center justify-center">
            <DotLottieReact
              src="https://lottie.host/7db04fd3-72d7-48d9-94ed-b35c3f31c42f/YKy5xvFHcB.lottie"
              loop
              autoplay
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-accent mb-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Fulfillment Confirmed
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-headline tracking-tight text-midnight-ink">Order Successful.</h1>
            <div className="inline-block">
                <p className="text-slate-blue text-[10px] font-black uppercase tracking-widest bg-muted/50 py-1.5 px-4 rounded-lg">
                    REF: {orderId?.slice(-8).toUpperCase() || 'VERIFIED'}
                </p>
            </div>
          </div>

          <p className="mt-8 text-muted-foreground text-sm leading-relaxed max-w-[300px] font-medium italic">
            "Your assets have been synchronized to your vault. Access is now active."
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 w-full">
            <Button asChild size="lg" className="h-14 rounded-2xl font-bold shadow-xl shadow-accent/20 text-base group">
              <Link href="/dashboard/downloads">
                Access Digital Vault
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            
            <Button variant="ghost" asChild className="h-10 text-[10px] font-black uppercase tracking-[0.2em] text-ghost-gray hover:text-accent">
              <Link href="/dashboard">Return to Workspace</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Suspense fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
