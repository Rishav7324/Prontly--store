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
  Zap
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

  const handleRemove = (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    removeItem(id);
    toast({ title: "Item Removed", description: `${name} has been removed from your cart.` });
  };

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-32 text-center">
          <div className="max-w-md mx-auto space-y-8">
            <div className="h-24 w-24 rounded-[2rem] bg-muted/50 flex items-center justify-center mx-auto border border-stone-gray/10 shadow-inner">
              <ShoppingBag className="h-10 w-10 text-muted-foreground opacity-30" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold font-headline text-midnight-ink">Your cart is empty</h1>
              <p className="text-muted-foreground">It seems you haven't added any digital assets yet.</p>
            </div>
            <Button asChild size="lg" className="rounded-xl px-10 h-12 font-bold shadow-lg shadow-primary/20">
              <Link href="/products">Browse Marketplace</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-6xl">
        <header className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="rounded-full bg-muted/50 h-10 w-10">
              <Link href="/products"><ChevronLeft className="h-5 w-5" /></Link>
            </Button>
            <div>
              <h1 className="text-4xl font-bold font-headline text-midnight-ink">Shopping Cart.</h1>
              <p className="text-sm text-muted-foreground mt-1">Ready to finalize your {getItemCount()} assets.</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-6">
            {items.map((item) => (
              <Card key={item.id} className="border-stone-gray/10 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="relative h-24 w-24 rounded-xl overflow-hidden border border-stone-gray/10 shrink-0 bg-muted">
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">{item.category}</p>
                          <h3 className="font-bold text-lg text-midnight-ink truncate">{item.name}</h3>
                        </div>
                        <button 
                          onClick={(e) => handleRemove(e, item.id, item.name)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-stone-gray/20 rounded-lg p-1 bg-porcelain-white/50">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-8 w-8 flex items-center justify-center hover:bg-white rounded-md transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-10 text-center text-sm font-bold font-mono">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-8 w-8 flex items-center justify-center hover:bg-white rounded-md transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="font-headline font-bold text-xl text-midnight-ink tabular-nums">
                          ₹{(item.price / 100 * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card className="border-stone-gray/10 bg-white rounded-[2rem] p-8 shadow-xl">
              <h2 className="text-xl font-bold font-headline text-midnight-ink mb-6">Order Recap</h2>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Subtotal</span>
                  <span className="font-bold font-headline">₹{(getTotal() / 100).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Processing Fee</span>
                  <span className="font-bold text-green-600 font-headline">₹0.00</span>
                </div>
                <div className="pt-6 border-t border-stone-gray/10 flex justify-between items-baseline">
                  <span className="font-bold text-lg text-midnight-ink uppercase text-[10px] tracking-widest">Net Value</span>
                  <div className="text-right">
                    <span className="text-4xl font-bold text-primary tracking-tighter font-headline">₹{(getTotal() / 100).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <Button asChild size="lg" className="w-full h-14 rounded-xl font-bold shadow-xl shadow-primary/20 text-lg group">
                  <Link href="/checkout">
                    Execute Order
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <div className="flex items-center justify-center gap-2 py-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-black uppercase text-ghost-gray tracking-widest">Secured by Razorpay</span>
                </div>
              </div>
            </Card>

            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Zap className="h-4 w-4" />
              </div>
              <p className="text-xs text-slate-blue leading-relaxed font-medium">
                Purchased assets are added to your <strong className="text-midnight-ink">Digital Library</strong> immediately after verification. Perpetual licenses included.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
