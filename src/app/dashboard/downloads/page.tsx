"use client";

import { useDownloads } from '@/hooks/useDownloads';
import { DownloadCard } from '@/components/dashboard/DownloadCard';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, RefreshCw, ShoppingBag, Loader2, Sparkles, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function DownloadsPage() {
  const { data: downloads, isLoading, error, refetch, isRefetching } = useDownloads();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-16 max-w-5xl">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-primary/50 text-primary uppercase font-black text-[10px] tracking-widest px-3 py-1 bg-primary/5">
                Secure Vault
              </Badge>
              {isRefetching && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold font-headline leading-tight">My Digital Library.</h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Access your perpetual licenses and source files. Your downloads are cryptographically protected and served via Cloudflare edge.
            </p>
          </div>
          <Button variant="ghost" onClick={() => refetch()} className="rounded-full gap-2 text-muted-foreground hover:text-primary">
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh Library
          </Button>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 rounded-[2.5rem] bg-card/20 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-24 bg-red-500/5 rounded-[3rem] border border-dashed border-red-500/20">
            <div className="h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <Ban className="h-10 w-10 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold font-headline mb-2">Sync Failure</h3>
            <p className="text-muted-foreground max-w-xs mx-auto mb-8">We couldn't reach the vault. Check your connection and try again.</p>
            <Button onClick={() => refetch()} className="rounded-2xl px-10 h-14 font-bold shadow-lg">Retry Connection</Button>
          </div>
        ) : downloads?.length === 0 ? (
          <div className="text-center py-32 bg-muted/5 border-dashed border-2 rounded-[4rem] border-white/5">
            <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-8">
              <ShoppingBag className="h-12 w-12 text-muted-foreground opacity-20" />
            </div>
            <h2 className="text-3xl font-bold font-headline mb-4">The vault is empty</h2>
            <p className="text-muted-foreground max-w-sm mx-auto mb-10 text-lg leading-relaxed">
              Unlock professional AI prompts and high-end UI kits to start building your library.
            </p>
            <Button asChild size="lg" className="rounded-2xl h-16 px-12 font-bold shadow-2xl shadow-primary/20">
              <Link href="/products">Explore Marketplace</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {downloads?.map(record => (
                <DownloadCard key={record.productId} record={record} />
              ))}
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-10">
              <div className="h-20 w-20 rounded-3xl bg-primary flex items-center justify-center shadow-xl shadow-primary/30 shrink-0">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <div className="space-y-4 text-center md:text-left">
                <h3 className="text-2xl font-bold font-headline">Need an upgrade or higher limit?</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Our perpetual licenses grant you 5 download attempts per version. If you've reached your limit or need a commercial redistribution license, please reach out.
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                  <Button variant="outline" className="rounded-xl h-12 px-6 border-white/10" asChild>
                    <a href="mailto:support@store.prontly.in">Contact Support</a>
                  </Button>
                  <Button variant="ghost" className="rounded-xl h-12 px-6 gap-2 text-primary" asChild>
                    <Link href="/delivery-policy"><HelpCircle className="h-4 w-4" /> Delivery Policy</Link>
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