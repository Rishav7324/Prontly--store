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
  ShieldCheck
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
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="container mx-auto flex-1 px-4 pb-16 pt-36 text-center">
          <div className="mx-auto max-w-sm space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-stone-gray/10 bg-muted/50 shadow-sm">
              <ShoppingBag className="h-6 w-6 text-muted-foreground opacity-40" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-bold font-headline text-midnight-ink">Your cart is empty</h1>
              <p className="text-xs text-muted-foreground">You haven't added any digital assets yet.</p>
            </div>
            <Button asChild className="h-10 rounded-lg px-6 text-sm font-medium">
              <Link href="/products">Browse Marketplace</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="container mx-auto max-w-5xl flex-1 px-4 pb-12 pt-32">
        <header className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-full bg-muted/50">
            <Link href="/products"><ChevronLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold font-headline tracking-tight text-midnight-ink">Shopping Cart</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">{getItemCount()} item{getItemCount() === 1 ? '' : 's'} ready to check out.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-8">
            {items.map((item) => (
              <Card key={item.id} className="rounded-xl border-stone-gray/10 bg-white shadow-sm overflow-hidden transition-all hover:shadow-sm">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Link href="/cart" className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-stone-gray/10 bg-muted">
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    </Link>
                    <div className="min-w-0 flex-1 space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-medium text-primary">{item.category}</p>
                          <h4 className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug text-midnight-ink">{item.name}</h4>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemove(item.id, item.name)}
                          className="h-7 w-7 shrink-0 text-muted-foreground transition-all hover:bg-destructive/5 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center rounded-lg border border-stone-gray/10 bg-porcelain-white/50 p-0.5">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-white"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-semibold tabular-nums">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-white"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-sm font-bold tabular-nums text-midnight-ink">
                          ₹{(item.price / 100 * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-4">
            <Card className="sticky top-32 rounded-xl border-stone-gray/10 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold font-headline text-midnight-ink">Order Summary</h2>
              <div className="space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₹{(getTotal() / 100).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Processing Fee</span>
                  <span className="font-medium text-green-600">₹0.00</span>
                </div>
                <div className="flex items-baseline justify-between border-t border-stone-gray/10 pt-3">
                  <span className="text-xs font-semibold text-midnight-ink">Total</span>
                  <span className="text-lg font-bold tracking-tight text-primary">₹{(getTotal() / 100).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <Button asChild className="h-10 w-full rounded-lg text-sm font-medium group">
                  <Link href="/checkout">
                    Proceed to Checkout
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                <div className="flex items-center justify-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] text-muted-foreground">Secured by Razorpay</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
