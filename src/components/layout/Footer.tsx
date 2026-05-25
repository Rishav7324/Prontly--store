'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Twitter, Instagram, Github, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Footer() {
  return (
    <footer className="border-t bg-secondary/20 py-24">
      <div className="container mx-auto px-4 max-w-[1200px]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 lg:gap-24">
          <div className="md:col-span-4 space-y-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight text-foreground">Prontly</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs font-body">
              Specialized digital infrastructure for modern creators and enterprises. Precision tools for high-performance development.
            </p>
            <div className="flex gap-4">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded text-muted-foreground hover:text-primary">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded text-muted-foreground hover:text-primary">
                <Instagram className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.1em] text-foreground">Catalog</h4>
            <ul className="space-y-4 text-sm text-muted-foreground font-medium">
              <li><Link href="/products" className="hover:text-primary transition-colors">Marketplace</Link></li>
              <li><Link href="/blog" className="hover:text-primary transition-colors">Resources</Link></li>
              <li><Link href="/wishlist" className="hover:text-primary transition-colors">Wishlist</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-6">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.1em] text-foreground">Legal</h4>
            <ul className="space-y-4 text-sm text-muted-foreground font-medium">
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms</Link></li>
              <li><Link href="/refund-policy" className="hover:text-primary transition-colors">Refunds</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-8">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.1em] text-foreground">Support</h4>
            <p className="text-sm text-muted-foreground">Inquiries regarding enterprise licensing or custom assets should be directed to our support desk.</p>
            <div className="flex items-center gap-3 text-primary font-bold group">
              <Mail className="h-4 w-4" />
              <span className="hover:underline cursor-pointer">support@prontly.in</span>
            </div>
          </div>
        </div>

        <div className="mt-24 pt-12 border-t flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] text-muted-foreground font-bold uppercase tracking-[0.1em]">
          <p>© {new Date().getFullYear()} Prontly Store — Built for Creators</p>
          <div className="flex gap-8">
            <span className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-green-500" /> Operational</span>
            <span>Patna, Bihar</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
