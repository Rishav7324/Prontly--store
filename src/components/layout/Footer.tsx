'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Globe, CreditCard } from 'lucide-react';

const columns = [
  {
    title: 'Marketplace',
    links: [
      ['All Products', '/products'],
      ['Categories', '/products?view=categories'],
      ['Blog', '/blog'],
      ['Wishlist', '/wishlist'],
    ],
  },
  {
    title: 'Company',
    links: [
      ['About', '/about'],
      ['Contact', '/contact'],
      ['Privacy', '/privacy'],
      ['Terms', '/terms'],
    ],
  },
  {
    title: 'Policies',
    links: [
      ['Delivery Policy', '/delivery-policy'],
      ['Refund Policy', '/refund-policy'],
      ['Cookie Settings', '/cookies'],
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t bg-white w-full max-w-[100vw] overflow-x-hidden">
      <div className="container-page py-8 md:py-10">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-6 md:gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-5 space-y-4 min-w-0">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <div className="relative h-7 w-7 rounded-lg overflow-hidden shadow-sm transition-transform group-hover:scale-105">
                <Image src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png" alt="Prontly" fill className="object-cover" />
              </div>
              <span className="font-semibold text-sm tracking-tight">Prontly</span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              High-quality digital assets for professional creators. Tools that accelerate your production workflow.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              {[['Secure', ShieldCheck], ['Instant', Globe], ['Verified', CreditCard]].map(([label, Icon]: any) => (
                <span key={label} className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted rounded-md px-2 py-1">
                  <Icon className="h-3 w-3 text-accent" /> {label}
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          {columns.map((col) => (
            <div key={col.title} className="md:col-span-2 min-w-0">
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-5 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[10px] text-muted-foreground">© {new Date().getFullYear()} Prontly. All rights reserved.</p>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <CreditCard className="h-3 w-3" /> Verified payments
          </p>
        </div>
      </div>
    </footer>
  );
}
