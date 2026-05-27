'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { useCart } from './use-cart';
import { toast } from './use-toast';

/**
 * Unified hook for handling the high-security Razorpay checkout flow.
 * Uses keyId from backend to ensure environment parity.
 */
export function useCheckout() {
  const auth = useAuth();
  const user = auth?.currentUser;
  const { items, clearCart } = useCart();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const startCheckout = async (couponCode?: string) => {
    if (!user) {
      toast({ title: "Authentication Required", description: "Please sign in to proceed." });
      router.push('/login?redirect=/checkout');
      return;
    }

    if (items.length === 0) {
      toast({ variant: "destructive", title: "Cart Empty" });
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create order intent via backend API
      const token = await user.getIdToken();
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ items, couponCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout initialization failed');

      // 2. Load and Open Razorpay Checkout
      const Razorpay = (window as any).Razorpay;
      if (!Razorpay) {
        throw new Error('Payment gateway script not loaded. Please refresh.');
      }

      const options = {
        key: data.razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: "INR",
        name: "Prontly Store",
        description: `Order #${data.orderId.slice(-8).toUpperCase()}`,
        order_id: data.orderId,
        handler: async (response: any) => {
          // 3. Immediate Server-side verification
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });

          if (verifyRes.ok) {
            clearCart();
            toast({ title: "Purchase Complete", description: "Your assets are now available in the library." });
            router.push("/dashboard/downloads");
          } else {
            toast({ 
              variant: "destructive", 
              title: "Fulfillment Sync Failed", 
              description: "Payment was successful but delivery is being processed via backup. Please check your dashboard in a moment." 
            });
            router.push("/dashboard");
          }
        },
        prefill: {
          name: user.displayName || '',
          email: user.email || ''
        },
        theme: { color: "#533afd" },
        modal: {
          ondismiss: () => setIsProcessing(false)
        }
      };

      const rzp = new Razorpay(options);
      rzp.open();

    } catch (error: any) {
      console.error('[CHECKOUT_TERMINAL_ERROR]:', error.message);
      toast({ variant: "destructive", title: "Checkout Error", description: error.message });
      setIsProcessing(false);
    }
  };

  return { startCheckout, isProcessing };
}
