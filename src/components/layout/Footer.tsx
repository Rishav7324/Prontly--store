'use client';

import Link from 'next/link';
import { Zap, Github, Twitter, Instagram, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Footer() {
  return (
    <footer className="border-t py-20 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" fill="currentColor" />
              <span className="font-headline text-2xl font-bold tracking-tight">PRONTLY</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              The premier marketplace for high-performance AI prompts, UI templates, and professional digital assets.
            </p>
            <div className="flex gap-4">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Github className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-wider">Marketplace</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/products?category=prompts" className="hover:text-primary transition-colors">AI Prompts</Link></li>
              <li><Link href="/products?category=templates" className="hover:text-primary transition-colors">UI Kits & Templates</Link></li>
              <li><Link href="/products?category=guides" className="hover:text-primary transition-colors">Learning Guides</Link></li>
              <li><Link href="/products" className="hover:text-primary transition-colors">New Arrivals</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-wider">Support</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/refund-policy" className="hover:text-primary transition-colors">Refund Policy</Link></li>
              <li><Link href="/delivery-policy" className="hover:text-primary transition-colors">Shipping & Delivery</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="font-bold text-sm uppercase tracking-wider">Newsletter</h4>
            <p className="text-xs text-muted-foreground">
              Get weekly updates on new assets and exclusive discounts.
            </p>
            <form className="flex gap-2">
              <Input 
                placeholder="Email address" 
                className="bg-background border-none text-xs"
              />
              <Button size="sm">Join</Button>
            </form>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span>support@prontly.in</span>
            </div>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Prontly Store. Built for the modern creator.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-primary">Privacy</Link>
            <Link href="/terms" className="hover:text-primary">Terms</Link>
            <Link href="/cookies" className="hover:text-primary transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
