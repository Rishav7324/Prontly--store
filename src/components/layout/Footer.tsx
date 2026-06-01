'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Twitter, Instagram, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Footer() {
  return (
    <footer className="border-t bg-secondary/10 py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16">
          <div className="md:col-span-4 space-y-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-white/5 transition-transform group-hover:scale-110">
                <Image 
                  src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png" 
                  alt="Prontly Logo" 
                  fill 
                  className="object-cover"
                />
              </div>
              <span className="font-bold text-lg tracking-tight text-foreground font-headline">Prontly Store</span>
            </Link>
            <p className="text-slate-blue text-xs leading-relaxed max-w-xs font-medium opacity-80">
              High-performance digital infrastructure for elite creators. Specialized tools for professional development and scale.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded text-slate-blue hover:text-primary">
                <Twitter className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded text-slate-blue hover:text-primary">
                <Instagram className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h4 className="text-[9px] font-black uppercase tracking-widest text-midnight-ink">Marketplace</h4>
            <ul className="space-y-2 text-xs text-slate-blue font-bold">
              <li><Link href="/products" className="hover:text-primary transition-colors">Catalog</Link></li>
              <li><Link href="/blog" className="hover:text-primary transition-colors">Insights</Link></li>
              <li><Link href="/wishlist" className="hover:text-primary transition-colors">Wishlist</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h4 className="text-[9px] font-black uppercase tracking-widest text-midnight-ink">Governance</h4>
            <ul className="space-y-2 text-xs text-slate-blue font-bold">
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms</Link></li>
              <li><Link href="/refund-policy" className="hover:text-primary transition-colors">Refunds</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-4">
            <h4 className="text-[9px] font-black uppercase tracking-widest text-midnight-ink">Technical Support</h4>
            <p className="text-xs text-slate-blue font-medium opacity-80 leading-relaxed">Direct inquiries regarding custom architecture or enterprise access should be sent to our desk.</p>
            <div className="flex items-center gap-2 text-primary font-bold text-xs group">
              <Mail className="h-3.5 w-3.5" />
              <span className="hover:underline cursor-pointer">store.support@prontly.in</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-[9px] text-ghost-gray font-black uppercase tracking-[0.2em]">
          <p>© {new Date().getFullYear()} Prontly Store • Godda, Jharkhand </p>
          <div className="flex items-center gap-4">
            <Link href="/cookies" className="hover:text-primary">Cookie guidelines</Link>
            <Link href="/delivery-policy" className="hover:text-primary">Delivery System</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}