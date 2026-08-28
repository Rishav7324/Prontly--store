'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Zap, Lock, Heart, ArrowUpRight, CheckCircle2 } from 'lucide-react';

const columns = [
  {
    title: 'Marketplace',
    links: [
      ['All Products', '/products'],
      ['Categories', '/products?view=categories'],
      ['Blog & Guides', '/blog'],
      ['Wishlist', '/wishlist'],
      ['My Downloads', '/dashboard'],
    ],
  },
  {
    title: 'Company',
    links: [
      ['About Us', '/about'],
      ['Contact Support', '/contact'],
      ['Community', '/blog'],
      ['Privacy Policy', '/privacy'],
      ['Terms of Service', '/terms'],
    ],
  },
  {
    title: 'Customer Trust',
    links: [
      ['Delivery Policy', '/delivery-policy'],
      ['Refund Policy', '/refund-policy'],
      ['30-Day Guarantee', '/refund-policy'],
      ['Licensing Terms', '/terms'],
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border/80 bg-white w-full max-w-[100vw] overflow-x-hidden pb-safe">
      <div className="container-page py-12 md:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-12 gap-8 lg:gap-10 mb-12">
          
          {/* Brand & Mission */}
          <div className="col-span-2 md:col-span-5 space-y-4 min-w-0 pr-0 md:pr-6">
            <Link href="/" className="flex items-center gap-2.5 group w-fit">
              <div className="relative h-8 w-8 rounded-xl overflow-hidden shadow-xs border border-border/60 transition-transform group-hover:scale-105">
                <Image src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png" alt="Prontly" fill className="object-cover" />
              </div>
              <span className="font-bold text-lg tracking-tight font-headline text-foreground">Prontly</span>
            </Link>
            
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm">
              The premier marketplace for production-grade digital assets, AI prompts, and developer templates. One-time purchase, lifetime access.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/60 rounded-lg px-2.5 py-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Razorpay Verified
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/60 rounded-lg px-2.5 py-1">
                <Zap className="h-3.5 w-3.5 text-amber-600" /> Cloudflare R2
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-800 bg-blue-50 border border-blue-200/60 rounded-lg px-2.5 py-1">
                <Lock className="h-3.5 w-3.5 text-blue-600" /> 256-Bit SSL
              </span>
            </div>
          </div>

          {/* Navigation Columns */}
          {columns.map((col) => (
            <div key={col.title} className="col-span-1 md:col-span-2 min-w-0">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground mb-3.5 font-headline">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link 
                      href={href} 
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 group"
                    >
                      <span>{label}</span>
                      <ArrowUpRight className="h-2.5 w-2.5 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 transition-all text-accent" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter / Guarantee Column */}
          <div className="col-span-2 md:col-span-1 min-w-0 hidden lg:block">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground mb-3.5 font-headline">Fulfillment</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5 font-medium text-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> Realtime Links
              </p>
              <p className="text-[11px] leading-relaxed">
                Download links delivered in milliseconds post checkout.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom copyright & legal bar */}
        <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Prontly Store. Built for creators and developers worldwide.</p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <span>•</span>
            <Link href="/refund-policy" className="hover:text-foreground transition-colors">Refunds</Link>
            <span>•</span>
            <Link href="/delivery-policy" className="hover:text-foreground transition-colors">Delivery</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
