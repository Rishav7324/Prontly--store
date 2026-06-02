
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Twitter, Instagram, Mail, Github, Linkedin, Globe, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Footer() {
  return (
    <footer className="border-t bg-porcelain-white py-24">
      <div className="container mx-auto px-4 max-w-[1400px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 lg:gap-24 mb-20">
          <div className="lg:col-span-4 space-y-8">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-white transition-transform group-hover:scale-110 shadow-sm border border-stone-gray/5">
                <Image 
                  src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png" 
                  alt="Prontly Logo" 
                  fill 
                  className="object-cover"
                />
              </div>
              <span className="font-bold text-2xl tracking-tight text-midnight-ink font-headline">Prontly Store</span>
            </Link>
            <p className="text-slate-blue text-sm leading-relaxed max-w-sm font-medium opacity-80">
              The professional ecosystem for modern digital creation. Specialized technical prompts and UI systems engineered for production scale.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Twitter, href: "#" },
                { icon: Linkedin, href: "#" },
                { icon: Instagram, href: "#" },
                { icon: Github, href: "#" },
              ].map((social, i) => (
                <Button key={i} variant="ghost" size="icon" className="h-10 w-10 rounded-xl border border-stone-gray/10 text-slate-blue hover:text-primary hover:bg-white transition-all shadow-sm">
                  <social.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
            <div className="pt-4 flex items-center gap-4">
               <div className="flex items-center gap-2 px-3 py-1 bg-green-500/5 rounded-full border border-green-500/10">
                  <ShieldCheck className="h-3 w-3 text-green-500" />
                  <span className="text-[9px] font-black uppercase text-green-600 tracking-widest">PCI Compliant</span>
               </div>
               <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/5 rounded-full border border-blue-500/10">
                  <Globe className="h-3 w-3 text-blue-500" />
                  <span className="text-[9px] font-black uppercase text-blue-600 tracking-widest">Global Edge</span>
               </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-midnight-ink">Product</h4>
            <ul className="space-y-4">
              <li><Link href="/products" className="text-sm text-slate-600 hover:text-primary transition-colors font-medium">All Products</Link></li>
              <li><Link href="/products?view=categories" className="text-sm text-slate-600 hover:text-primary transition-colors font-medium">Categories</Link></li>
              <li><Link href="/products?sort=newest" className="text-sm text-slate-600 hover:text-primary transition-colors font-medium">New Releases</Link></li>
              <li><Link href="/products?view=featured" className="text-sm text-slate-600 hover:text-primary transition-colors font-medium">Bestsellers</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-midnight-ink">Resources</h4>
            <ul className="space-y-4">
              <li><Link href="/blog" className="text-sm text-slate-600 hover:text-primary transition-colors font-medium">Insights Blog</Link></li>
              <li><Link href="/blog" className="text-sm text-slate-600 hover:text-primary transition-colors font-medium">Expert Guides</Link></li>
              <li><Link href="/testimonials" className="text-sm text-slate-600 hover:text-primary transition-colors font-medium">Case Studies</Link></li>
              <li><Link href="/wishlist" className="text-sm text-slate-600 hover:text-primary transition-colors font-medium">Personal Wishlist</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-midnight-ink">Company</h4>
            <ul className="space-y-4">
              <li><Link href="/testimonials" className="text-sm text-slate-600 hover:text-primary transition-colors font-medium">About Prontly</Link></li>
              <li><Link href="mailto:contact@prontly.in" className="text-sm text-slate-600 hover:text-primary transition-colors font-medium">Contact Us</Link></li>
              <li><Link href="mailto:support@prontly.in" className="text-sm text-slate-600 hover:text-primary transition-colors font-medium">Tech Support</Link></li>
              <li><Link href="/blog" className="text-sm text-slate-600 hover:text-primary transition-colors font-medium">Community</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-midnight-ink">Legal</h4>
            <ul className="space-y-4">
              <li><Link href="/privacy" className="text-sm text-slate-600 hover:text-primary transition-colors font-medium">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-slate-600 hover:text-primary transition-colors font-medium">Terms of Use</Link></li>
              <li><Link href="/refund-policy" className="text-sm text-slate-600 hover:text-primary transition-colors font-medium">Refund Policy</Link></li>
              <li><Link href="/delivery-policy" className="text-sm text-slate-600 hover:text-primary transition-colors font-medium">Delivery Engine</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-stone-gray/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[10px] text-ghost-gray font-black uppercase tracking-[0.2em]">
            © {new Date().getFullYear()} Prontly Store • Digital Fulfillment Globally
          </p>
          <div className="flex items-center gap-8">
             <div className="flex items-center gap-2 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
                <Image src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png" alt="Stripe" width={40} height={20} className="object-contain" />
                <span className="text-[9px] font-bold text-midnight-ink uppercase tracking-wider">Secured Payments</span>
             </div>
             <Link href="/cookies" className="text-[10px] text-ghost-gray font-black uppercase tracking-[0.2em] hover:text-primary transition-colors">Cookie Dashboard</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
