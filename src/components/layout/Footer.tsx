'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Twitter, Instagram, Github, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Footer() {
  return (
    <footer className="border-t border-chalk py-24 bg-white">
      <div className="container mx-auto px-4 max-w-[1200px]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 lg:gap-24">
          <div className="md:col-span-4 space-y-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-powder">
                <Image 
                  src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png" 
                  alt="Prontly Logo" 
                  fill 
                  className="object-cover"
                />
              </div>
              <span className="font-medium text-lg uppercase tracking-tight text-obsidian">Prontly</span>
            </Link>
            <p className="text-gravel text-sm leading-relaxed max-w-xs font-body">
              Specialized digital inventory for modern architectural and AI workflows. Precision tools for high-performance creation.
            </p>
            <div className="flex gap-4">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full border border-chalk">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full border border-chalk">
                <Instagram className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gravel">Catalog</h4>
            <ul className="space-y-4 text-sm text-gravel font-medium">
              <li><Link href="/products?category=prompts" className="hover:text-obsidian transition-colors">AI Prompts</Link></li>
              <li><Link href="/products?category=templates" className="hover:text-obsidian transition-colors">UI Templates</Link></li>
              <li><Link href="/blog" className="hover:text-obsidian transition-colors">Resources</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-6">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gravel">Policies</h4>
            <ul className="space-y-4 text-sm text-gravel font-medium">
              <li><Link href="/privacy" className="hover:text-obsidian transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-obsidian transition-colors">Terms</Link></li>
              <li><Link href="/refund-policy" className="hover:text-obsidian transition-colors">Refunds</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-8">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gravel">Inquiries</h4>
            <p className="text-sm text-gravel">Direct inquiries regarding enterprise licensing or custom assets to our support terminal.</p>
            <div className="flex items-center gap-3 text-obsidian font-semibold group">
              <Mail className="h-5 w-5 text-gravel" />
              <span className="border-b border-obsidian pb-1 group-hover:border-obsidian/40 transition-all">store@prontly.in</span>
            </div>
          </div>
        </div>

        <div className="mt-24 pt-12 border-t border-chalk flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] text-gravel font-medium uppercase tracking-[0.1em]">
          <p>© {new Date().getFullYear()} Prontly Store — पटना, भारत</p>
          <div className="flex gap-8">
            <span>Status: Operational</span>
            <span>Uptime: 99.9%</span>
          </div>
        </div>
      </div>
    </footer>
  );
}