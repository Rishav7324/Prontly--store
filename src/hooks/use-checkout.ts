'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { useCart } from './use-cart';
import { toast } from './use-toast';

export interface GuestCheckoutDetails {
  email: string;
  phone: string;
  name?: string;
}

/**
 * Unified hook for handling the high-security Razorpay checkout flow (User & Guest).
 */
export function useCheckout() {
  const auth = useAuth();
  const user = auth?.currentUser;
  const { items, clearCart } = useCart();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const startCheckout = async (couponCode?: string, guestDetails?: GuestCheckoutDetails) => {
    if (!user && !guestDetails?.email) {
      toast({ title: "Email Required", description: "Please enter your email to proceed with checkout." });
      return;
    }

    if (items.length === 0) {
      toast({ variant: "destructive", title: "Cart Empty" });
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create order intent via backend API
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (user) {
        const token = await user.getIdToken();
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers,
        body: JSON.stringify({ items, couponCode, guest: guestDetails }),
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
            // Redirect to the new specialized success terminal
            router.push(`/checkout/success?orderId=${data.orderId}`);
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
          name: user?.displayName || guestDetails?.name || '',
          email: user?.email || guestDetails?.email || '',
          contact: guestDetails?.phone || '',
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
