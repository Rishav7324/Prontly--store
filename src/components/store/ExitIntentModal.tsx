'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  X,
  Copy,
  Check,
  ArrowRight,
  Gift,
  Clock
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/use-cart';

export function ExitIntentModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const couponCode = 'PRONTLY15';

  useEffect(() => {
    // Check if dismissed in this session
    const dismissed = sessionStorage.getItem('prontly_exit_intent_dismissed');
    if (dismissed) return;

    let timer: NodeJS.Timeout;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 10 && !sessionStorage.getItem('prontly_exit_intent_dismissed')) {
        setIsOpen(true);
        sessionStorage.setItem('prontly_exit_intent_dismissed', 'true');
      }
    };

    // Desktop exit intent
    document.addEventListener('mouseleave', handleMouseLeave);

    // Mobile fallback: trigger after 30s of browsing
    timer = setTimeout(() => {
      if (!sessionStorage.getItem('prontly_exit_intent_dismissed')) {
        setIsOpen(true);
        sessionStorage.setItem('prontly_exit_intent_dismissed', 'true');
      }
    }, 30000);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(timer);
    };
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(couponCode);
    setHasCopied(true);
    if (applyCoupon) {
      applyCoupon(couponCode);
    }
    toast({
      title: "15% OFF Applied!",
      description: `Coupon ${couponCode} copied and applied to your cart.`,
    });
    setTimeout(() => setHasCopied(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-6 sm:p-8 text-center text-white shadow-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Glow ambient light */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-accent/30 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon & Badge */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/20 border border-accent/40 text-accent shadow-lg shadow-accent/20">
          <Gift className="h-8 w-8 text-accent animate-bounce" />
        </div>

        <Badge className="mb-2 bg-accent text-white hover:bg-accent border-none px-3 py-1 text-xs font-bold uppercase tracking-wider">
          Exclusive Unlock
        </Badge>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-headline">
          Wait! Take 15% Off Your First Order
        </h2>

        <p className="mt-2 text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-xs mx-auto">
          Get instant access to production-tested AI prompts and digital assets at a VIP discount.
        </p>

        {/* Coupon Box */}
        <div className="mt-6 rounded-2xl border border-dashed border-accent/60 bg-accent/10 p-3.5 flex items-center justify-between gap-3">
          <div className="text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent/80 block">Coupon Code</span>
            <span className="text-lg font-extrabold tracking-wider font-mono text-white">{couponCode}</span>
          </div>

          <Button
            size="sm"
            onClick={handleCopyCode}
            className="h-9 rounded-xl px-4 text-xs font-bold bg-accent text-white hover:bg-accent/90 shadow-md active:scale-95 transition-all"
          >
            {hasCopied ? (
              <>
                <Check className="mr-1.5 h-3.5 w-3.5 text-white" />
                Applied!
              </>
            ) : (
              <>
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Copy & Apply
              </>
            )}
          </Button>
        </div>

        {/* Action Button */}
        <div className="mt-6 flex flex-col gap-2">
          <Button
            onClick={() => {
              handleCopyCode();
              setIsOpen(false);
            }}
            className="h-12 w-full rounded-2xl bg-white text-zinc-950 font-bold hover:bg-zinc-100 shadow-xl active:scale-[0.98] transition-all text-sm"
          >
            Claim 15% Discount & Explore
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <button
            onClick={() => setIsOpen(false)}
            className="text-xs text-zinc-500 hover:text-zinc-400 mt-1 transition-colors"
          >
            No thanks, I prefer paying full price
          </button>
        </div>
      </div>
    </div>
  );
}
