'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Zap, Github, Twitter, Instagram, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { createResendContact, listResendAudiences } from '@/app/actions/resend-actions';

export function Footer() {
  const db = useFirestore();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'main') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !email) return;

    setIsSubmitting(true);
    try {
      // 1. Log in Firestore
      await addDoc(collection(db, 'newsletter_subscribers'), {
        email: email.toLowerCase(),
        createdAt: serverTimestamp(),
        source: 'footer'
      });

      // 2. Sync with Resend if audience ID exists (optional background sync)
      const audiences = await listResendAudiences();
      if (audiences.success && audiences.data.length > 0) {
        await createResendContact({
          audienceId: audiences.data[0].id,
          email: email.toLowerCase(),
          unsubscribed: false
        });
      }

      setIsSubscribed(true);
      toast({ title: "Subscribed!", description: "You've been added to our mailing list." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to join newsletter." });
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <li><Link href="/testimonials" className="hover:text-primary transition-colors flex items-center gap-2">Wall of Love <Badge variant="secondary" className="text-[8px] px-1.5 py-0">New</Badge></Link></li>
              <li><Link href="/blog" className="hover:text-primary transition-colors">Resource Blog</Link></li>
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
            {isSubscribed ? (
              <div className="flex items-center gap-2 text-green-500 text-sm font-bold animate-in fade-in zoom-in duration-300">
                <CheckCircle2 className="h-5 w-5" />
                Welcome to Prontly!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <Input 
                  type="email"
                  placeholder="Email address" 
                  className="bg-background border-none text-xs"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button size="sm" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Join'}
                </Button>
              </form>
            )}
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
