'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/hooks/use-cart';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ChevronLeft,
  ShieldCheck,
  Zap,
  Lock
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal, getItemCount } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRemove = (id: string, name: string) => {
    removeItem(id);
    toast({ title: "Item Removed", description: `${name} has been removed from your cart.` });
  };

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
        <Navbar />
        <main className="container-page flex-1 pb-20 pt-28 text-center flex flex-col items-center justify-center">
          <div className="mx-auto max-w-md space-y-5 bg-white p-8 sm:p-10 rounded-3xl border border-border/80 shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-border/70 bg-muted/40 shadow-xs">
              <ShoppingBag className="h-8 w-8 text-muted-foreground/60" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold font-headline text-foreground">Your cart is empty</h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                You haven't added any digital assets yet. Explore our verified templates, prompts, and frameworks.
              </p>
            </div>
            <Button asChild size="lg" className="h-11 rounded-2xl px-7 text-xs sm:text-sm font-bold bg-zinc-950 text-white shadow-sm hover:bg-zinc-800">
              <Link href="/products" className="flex items-center gap-2">
                Browse Marketplace <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background selection:bg-accent/20 selection:text-accent">
      <Navbar />
      <main className="container-page max-w-6xl flex-1 pb-20 pt-24 sm:pt-28">
        <header className="mb-8 flex items-center gap-3.5">
          <Button variant="outline" size="icon" asChild className="h-10 w-10 rounded-2xl bg-white border-border/80 shadow-xs">
            <Link href="/products" aria-label="Back to catalog"><ChevronLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight text-foreground">Shopping Cart</h1>
            <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
              {getItemCount()} {getItemCount() === 1 ? 'item' : 'items'} ready for immediate electronic fulfillment
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          
          {/* Cart items list */}
          <div className="space-y-3.5 lg:col-span-8">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border/80 bg-white p-4 sm:p-5 shadow-xs transition-all hover:shadow-md">
                <div className="flex gap-4">
                  <Link href={`/products/${item.id}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-border/70 bg-muted/40 group">
                    <Image src={item.imageUrl || 'https://picsum.photos/seed/placeholder/200/200'} alt={item.name} fill className="object-cover transition-transform group-hover:scale-105" />
                  </Link>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-accent">{item.category}</span>
                        <h2 className="mt-0.5 line-clamp-2 text-sm sm:text-base font-semibold leading-snug text-foreground">
                          {item.name}
                        </h2>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleRemove(item.id, item.name)}
                        className="h-8 w-8 shrink-0 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive rounded-xl"
                        aria-label="Remove item from cart"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center rounded-xl border border-border/70 bg-muted/50 p-0.5">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-white disabled:opacity-30 active:scale-90"
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold tabular-nums">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-white active:scale-90"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-base sm:text-lg font-bold tabular-nums text-foreground font-headline">
                        ₹{((item.price / 100) * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary right column */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 rounded-3xl border border-border/80 bg-white p-6 shadow-sm space-y-5">
              <h2 className="text-lg font-bold font-headline text-foreground">Order Summary</h2>
              
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({getItemCount()} items)</span>
                  <span className="font-semibold text-foreground">₹{(getTotal() / 100).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Electronic Delivery Fee</span>
                  <span className="font-bold text-emerald-600">FREE</span>
                </div>
                <div className="flex items-baseline justify-between border-t border-border/60 pt-3.5">
                  <span className="text-sm font-bold text-foreground">Total Amount</span>
                  <span className="text-2xl font-extrabold tracking-tight text-foreground font-headline">
                    ₹{(getTotal() / 100).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Button asChild size="lg" className="h-12 w-full rounded-2xl text-xs sm:text-sm font-bold bg-zinc-950 text-white hover:bg-zinc-800 shadow-md active:scale-[0.98] transition-all">
                  <Link href="/checkout" className="flex items-center justify-center gap-2">
                    Proceed to Checkout
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                
                <div className="rounded-2xl bg-muted/40 p-3 flex items-center justify-center gap-2 text-center text-[11px] text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Secured by Razorpay • Instant Delivery</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
