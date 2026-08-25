'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/use-cart';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
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
      <SheetContent className="flex w-full flex-col border-l border-stone-gray/10 bg-white p-0 sm:max-w-sm">
        <SheetHeader className="border-b border-stone-gray/10 px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-sm font-semibold font-headline text-midnight-ink">
            <ShoppingBag className="h-4 w-4 text-primary" />
            Cart ({mounted ? getItemCount() : 0})
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4">
          {!mounted ? (
            <div className="flex h-full items-center justify-center">
              <ShoppingBag className="h-6 w-6 animate-pulse text-muted-foreground opacity-20" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-[320px] flex-col items-center justify-center space-y-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50 opacity-50">
                <ShoppingBag className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-xs font-medium text-muted-foreground">Your cart is empty.</p>
              <Button variant="link" onClick={() => onOpenChange(false)} className="h-auto p-0 text-xs font-medium text-primary hover:underline">
                Browse assets
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-stone-gray/5 py-2">
              {items.map((item) => (
                <div key={item.id} className="group flex gap-3 py-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-stone-gray/10 bg-muted">
                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="line-clamp-1 text-xs font-medium leading-snug text-midnight-ink transition-colors group-hover:text-primary">{item.name}</h4>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">{item.category}</p>
                      </div>
                      <button 
                        onClick={() => handleRemove(item.id, item.name)}
                        className="shrink-0 rounded-lg p-1 text-muted-foreground transition-all hover:bg-destructive/5 hover:text-destructive"
                        type="button"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center rounded-md border border-stone-gray/10 bg-porcelain-white/50 p-0.5">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex h-5 w-5 items-center justify-center rounded transition-all hover:bg-white"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-2.5 w-2.5" />
                        </button>
                        <span className="w-7 text-center text-[10px] font-semibold tabular-nums">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="flex h-5 w-5 items-center justify-center rounded transition-all hover:bg-white"
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </button>
                      </div>
                      <span className="text-xs font-bold tabular-nums text-midnight-ink">
                        ₹{(item.price / 100 * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {mounted && items.length > 0 && (
          <SheetFooter className="w-full flex-col gap-3 space-y-0 border-t border-stone-gray/10 bg-porcelain-white/50 p-4">
            <div className="w-full space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">₹{(getTotal() / 100).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-midnight-ink">Total</span>
                <span className="text-base font-bold text-primary">₹{(getTotal() / 100).toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div className="grid w-full grid-cols-1 gap-2">
              <Button className="h-9 w-full rounded-lg text-sm font-medium shadow-sm" asChild onClick={() => onOpenChange(false)}>
                <Link href="/checkout">
                  Checkout
                  <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button variant="outline" className="h-9 rounded-lg border-stone-gray/20 text-xs font-medium transition-all hover:bg-white group" asChild onClick={() => onOpenChange(false)}>
                <Link href="/cart">
                  View full cart
                  <ArrowRight className="ml-1.5 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
