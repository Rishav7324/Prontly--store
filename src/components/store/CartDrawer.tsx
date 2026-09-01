'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/use-cart';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';

interface CartDrawerProps { open: boolean; onOpenChange: (open: boolean) => void; }

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, getTotal, getItemCount } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRemove = (id: string, name: string) => {
    removeItem(id);
    toast({ title: "Item Removed", description: `${name} has been removed.` });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col border-l border-border/80 bg-white p-0 sm:max-w-md max-w-[100vw]">
        {/* Drawer Header */}
        <SheetHeader className="border-b border-border/70 px-5 py-4 flex flex-row items-center justify-between space-y-0">
          <SheetTitle className="flex items-center gap-2.5 text-base font-bold text-foreground font-headline">
            <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <ShoppingBag className="h-4 w-4" />
            </div>
            Your Cart ({mounted ? getItemCount() : 0})
          </SheetTitle>
        </SheetHeader>

        {/* Cart Item Scroll List */}
        <ScrollArea className="flex-1 px-5">
          {!mounted ? (
            <div className="flex h-full items-center justify-center py-20">
              <ShoppingBag className="h-8 w-8 animate-pulse text-muted-foreground opacity-30" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-[360px] flex-col items-center justify-center space-y-4 text-center px-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground/50 border border-border/60">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">Your cart is empty</p>
                <p className="text-xs text-muted-foreground max-w-[240px]">
                  Explore high-quality templates and digital assets to add to your workspace.
                </p>
              </div>
              <Button asChild className="rounded-xl px-5 h-9 text-xs font-semibold bg-zinc-950 text-white" onClick={() => onOpenChange(false)}>
                <Link href="/products">Browse Marketplace</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/60 py-3">
              {items.map((item) => (
                <div key={item.id} className="group flex gap-3.5 py-3.5">
                  <div className="relative h-20 w-16 aspect-[4/5] shrink-0 overflow-hidden rounded-xl border border-border/70 bg-muted/40">
                    <Image src={item.imageUrl || 'https://picsum.photos/seed/placeholder/200/200'} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-accent">{item.category}</span>
                        <h4 className="line-clamp-1 text-xs sm:text-sm font-semibold text-foreground leading-snug group-hover:text-accent transition-colors">
                          {item.name}
                        </h4>
                      </div>
                      <button 
                        onClick={() => handleRemove(item.id, item.name)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive active:scale-90"
                        type="button"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center rounded-lg border border-border/70 bg-muted/50 p-0.5">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-md transition-all hover:bg-white active:scale-90 disabled:opacity-30"
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold tabular-nums">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-md transition-all hover:bg-white active:scale-90"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-xs sm:text-sm font-bold tabular-nums text-foreground">
                        ₹{((item.price / 100) * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Drawer Footer */}
        {mounted && items.length > 0 && (
          <SheetFooter className="w-full flex-col gap-3 space-y-0 border-t border-border/70 bg-muted/25 p-5">
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Subtotal ({getItemCount()} items)</span>
                <span className="font-semibold text-foreground">₹{(getTotal() / 100).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-baseline justify-between border-t border-border/60 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">Total</span>
                <span className="text-lg font-extrabold text-foreground tracking-tight font-headline">
                  ₹{(getTotal() / 100).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="grid w-full grid-cols-1 gap-2 pt-1">
              <Button className="h-11 w-full rounded-2xl text-xs sm:text-sm font-bold shadow-md bg-zinc-950 text-white hover:bg-zinc-800 active:scale-[0.98] transition-all" asChild onClick={() => onOpenChange(false)}>
                <Link href="/checkout" className="flex items-center justify-center gap-2">
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="h-10 rounded-2xl border-border/80 text-xs font-semibold hover:bg-white active:scale-[0.98] transition-all" asChild onClick={() => onOpenChange(false)}>
                <Link href="/cart">
                  View Full Cart
                </Link>
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground pt-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Razorpay Secured • Instant Electronic Delivery</span>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
