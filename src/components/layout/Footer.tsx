'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Twitter, Instagram, Mail, Github, Linkedin, Globe, ShieldCheck, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Footer() {
  return (
    <footer className="border-t bg-white py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-12">
          {/* Column 1: Brand & Identity */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-primary shadow-sm">
                <Image 
                  src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png" 
                  alt="Prontly Logo" 
                  fill 
                  className="object-cover"
                />
              </div>
              <span className="font-bold text-2xl tracking-tight text-midnight-ink">Prontly</span>
            </Link>
            <p className="text-slate-blue text-base leading-relaxed max-w-sm font-medium">
              High-quality digital assets for creators and developers. 
              Find the tools you need to build your projects faster.
            </p>
            
            <div className="flex gap-3">
              {[
                { icon: Twitter, href: "#" },
                { icon: Linkedin, href: "#" },
                { icon: Instagram, href: "#" },
                { icon: Github, href: "#" },
              ].map((social, i) => (
                <Button key={i} variant="ghost" size="icon" className="h-10 w-10 rounded-xl border border-stone-gray/10 text-slate-blue hover:text-primary hover:bg-muted transition-all">
                  <social.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-4">
               <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-100">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Secure Checkout</span>
               </div>
               <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
                  <Globe className="h-4 w-4 text-blue-600" />
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Instant Delivery</span>
               </div>
            </div>
          </div>

          {/* Column 2: Navigation Links in a nested grid */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-midnight-ink">Shop</h4>
              <ul className="space-y-3">
                <li><Link href="/products" className="text-sm text-slate-600 hover:text-primary transition-colors">All Products</Link></li>
                <li><Link href="/products?view=categories" className="text-sm text-slate-600 hover:text-primary transition-colors">Categories</Link></li>
                <li><Link href="/blog" className="text-sm text-slate-600 hover:text-primary transition-colors">Blog & Guides</Link></li>
                <li><Link href="/wishlist" className="text-sm text-slate-600 hover:text-primary transition-colors">My Wishlist</Link></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-midnight-ink">Support</h4>
              <ul className="space-y-3">
                <li><Link href="mailto:support@prontly.in" className="text-sm text-slate-600 hover:text-primary transition-colors">Help Center</Link></li>
                <li><Link href="/delivery-policy" className="text-sm text-slate-600 hover:text-primary transition-colors">Delivery Info</Link></li>
                <li><Link href="/privacy" className="text-sm text-slate-600 hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-sm text-slate-600 hover:text-primary transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-stone-gray/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[11px] text-slate-400 font-medium">
            © {new Date().getFullYear()} Prontly. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 opacity-50">
                <CreditCard className="h-4 w-4 text-midnight-ink" />
                <span className="text-[10px] font-bold text-midnight-ink uppercase tracking-wider">Verified Payments</span>
             </div>
             <Link href="/cookies" className="text-[11px] text-slate-400 hover:text-primary transition-colors font-medium">Cookie Settings</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
