'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/use-cart';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingBag, X, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, getTotal, getItemCount } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRemove = (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    removeItem(id);
    toast({ title: "Item Removed", description: `${name} has been removed.` });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 border-l border-stone-gray/10 bg-white">
        <SheetHeader className="p-6 border-b border-stone-gray/10">
          <SheetTitle className="flex items-center gap-3 font-headline text-2xl font-bold text-midnight-ink">
            <ShoppingBag className="h-6 w-6 text-primary" />
            Shopping Cart ({mounted ? getItemCount() : 0})
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          {!mounted ? (
            <div className="flex items-center justify-center h-full">
              <ShoppingBag className="h-8 w-8 animate-pulse text-muted-foreground opacity-20" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center opacity-30">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">Your inventory is empty.</p>
              <Button variant="link" onClick={() => onOpenChange(false)} className="text-primary font-bold">
                Browse Assets
              </Button>
            </div>
          ) : (
            <div className="space-y-6 py-8">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 group">
                  <div className="relative h-20 w-20 rounded-xl overflow-hidden border border-stone-gray/10 bg-muted shrink-0 shadow-sm">
                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-midnight-ink truncate leading-tight group-hover:text-primary transition-colors">{item.name}</h4>
                        <button 
                          onClick={(e) => handleRemove(e, item.id, item.name)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          type="button"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-[9px] font-black uppercase text-ghost-gray tracking-widest mt-1">{item.category}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-stone-gray/10 rounded-lg p-0.5 bg-porcelain-white/50">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="h-6 w-6 flex items-center justify-center hover:bg-white rounded transition-all"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-2.5 w-2.5" />
                        </button>
                        <span className="w-8 text-center text-[10px] font-bold">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-6 w-6 flex items-center justify-center hover:bg-white rounded transition-all"
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-midnight-ink font-headline">
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
          <SheetFooter className="p-6 border-t border-stone-gray/10 flex-col gap-4 bg-porcelain-white/50">
            <div className="w-full space-y-3 mb-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-medium">Subtotal</span>
                <span className="font-bold">₹{(getTotal() / 100).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-headline font-bold text-lg text-midnight-ink">Net Value</span>
                <span className="font-headline font-bold text-2xl text-primary">₹{(getTotal() / 100).toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 w-full">
              <Button className="h-12 rounded-xl font-bold shadow-lg shadow-primary/20" asChild onClick={() => onOpenChange(false)}>
                <Link href="/checkout">Execute Checkout</Link>
              </Button>
              <Button variant="outline" className="h-11 rounded-xl font-bold border-stone-gray/20 hover:bg-white transition-all text-xs group" asChild onClick={() => onOpenChange(false)}>
                <Link href="/cart">
                  Full Cart Interface
                  <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
