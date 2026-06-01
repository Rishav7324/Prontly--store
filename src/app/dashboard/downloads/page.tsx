"use client";

import { useDownloads } from '@/hooks/useDownloads';
import { DownloadCard } from '@/components/dashboard/DownloadCard';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, RefreshCw, ShoppingBag, Loader2, Sparkles, HelpCircle, Ban, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

/**
 * @fileOverview Secure Digital Vault Page.
 * Displays purchased digital assets with cryptographic download controls.
 */
export default function DownloadsPage() {
  const { data: downloads, isLoading, error, refetch, isRefetching } = useDownloads();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-16 max-w-6xl">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-primary/50 text-primary uppercase font-black text-[10px] tracking-[0.2em] px-3 py-1 bg-primary/5">
                Digital Vault v2
              </Badge>
              {isRefetching && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            </div>
            <h1 className="text-5xl md:text-7xl font-bold font-headline leading-tight tracking-tight">My Library.</h1>
            <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Access your perpetual licenses and source files. All assets are cryptographically protected and delivered via Cloudflare Global Edge.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => refetch()} className="rounded-2xl h-12 px-6 gap-2 border-white/10 hover:bg-white/5">
              <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh Vault
            </Button>
          </div>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-72 rounded-[3rem] bg-card/20 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-32 bg-red-500/5 rounded-[4rem] border border-dashed border-red-500/20">
            <div className="h-24 w-24 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-8">
              <Ban className="h-12 w-12 text-red-500" />
            </div>
            <h3 className="text-3xl font-bold font-headline mb-4">Vault Sync Failure</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-10 text-lg leading-relaxed">We encountered a guidelines error while synchronizing your library. Please verify your credentials and retry.</p>
            <Button onClick={() => refetch()} className="rounded-2xl px-12 h-16 font-bold shadow-2xl shadow-primary/20">Retry Connection</Button>
          </div>
        ) : downloads?.length === 0 ? (
          <div className="text-center py-40 bg-muted/5 border-dashed border-2 rounded-[5rem] border-white/5">
            <div className="h-28 w-28 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-10">
              <ShoppingBag className="h-14 w-14 text-muted-foreground opacity-20" />
            </div>
            <h2 className="text-4xl font-bold font-headline mb-6 tracking-tight">The vault is currently empty.</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-12 text-xl leading-relaxed font-light">
              Acquire professional AI prompts and high-performance UI systems to start building your digital architecture.
            </p>
            <Button asChild size="lg" className="rounded-2xl h-18 px-14 font-bold shadow-2xl shadow-primary/30 text-lg">
              <Link href="/products">Explore Marketplace</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {downloads?.map(record => (
                <DownloadCard key={record.productId} record={record} />
              ))}
            </div>

            {/* Support / Info Section */}
            <div className="bg-primary/5 border border-primary/20 rounded-[4rem] p-12 md:p-16 flex flex-col lg:flex-row items-center gap-12 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShieldCheck className="h-64 w-64 text-primary" />
              </div>
              <div className="h-24 w-24 rounded-[2rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 shrink-0 relative z-10">
                <Sparkles className="h-12 w-12 text-white" />
              </div>
              <div className="space-y-6 text-center lg:text-left relative z-10 flex-1">
                <h3 className="text-3xl font-bold font-headline tracking-tight text-midnight-ink">Perpetual Access Protection</h3>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
                  Each purchase grants you a perpetual license for personal and commercial use (internal). Your source files are stored in a distributed edge vault, ensuring 99.9% uptime for your creative workflow. If you reach your download limit, our support team can issue a manual license refresh.
                </p>
                <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4">
                  <Button variant="outline" className="rounded-2xl h-14 px-8 font-bold border-white/10 hover:bg-white/5" asChild>
                    <a href="mailto:store.support@prontly.in">Contact Data Support</a>
                  </Button>
                  <Button variant="ghost" className="rounded-2xl h-14 px-8 gap-2 text-primary font-bold hover:bg-primary/5" asChild>
                    <Link href="/delivery-policy">Delivery guidelines <HelpCircle className="h-5 w-5" /></Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
