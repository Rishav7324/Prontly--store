"use client";

import { useDownloads } from '@/hooks/useDownloads';
import { DownloadCard } from '@/components/dashboard/DownloadCard';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, ShoppingBag, Loader2, Sparkles, HelpCircle, Ban, ShieldCheck } from 'lucide-react';
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
      
      <main className="flex-1 container mx-auto px-4 pb-16 pt-20 md:pt-24 max-w-5xl">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/40 text-primary text-[10px] font-medium px-2 py-0.5 bg-primary/5">
                Digital Vault v2
              </Badge>
              {isRefetching && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            </div>
            <h1 className="text-lg md:text-xl font-semibold leading-tight">My Library</h1>
            <p className="text-xs text-muted-foreground max-w-2xl">
              Access your perpetual licenses and source files. All assets are delivered via Cloudflare Global Edge.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="h-9 rounded-lg gap-2">
              <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh Vault
            </Button>
          </div>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 rounded-xl bg-card animate-pulse border border-border/60" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-red-500/5 rounded-xl border border-dashed border-red-500/20 p-4">
            <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Ban className="h-6 w-6 text-red-500" />
            </div>
            <h2 className="text-sm font-semibold mb-1.5">Vault Sync Failure</h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mb-6">We encountered an error while synchronizing your library. Please verify your credentials and retry.</p>
            <Button size="sm" onClick={() => refetch()} className="h-9 rounded-lg">Retry Connection</Button>
          </div>
        ) : downloads?.length === 0 ? (
          <div className="text-center py-16 bg-muted/20 border-dashed border rounded-xl border-border/60 p-4">
            <div className="h-14 w-14 rounded-lg bg-white/50 dark:bg-white/5 flex items-center justify-center mx-auto mb-5">
              <ShoppingBag className="h-7 w-7 text-muted-foreground opacity-40" />
            </div>
            <h2 className="text-base font-semibold mb-2">The vault is currently empty.</h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-6">
              Acquire professional AI prompts and high-performance UI systems to start building your technical workflows.
            </p>
            <Button asChild size="sm" className="h-9 rounded-lg px-8">
              <Link href="/products">Explore Catalog</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {downloads?.map(record => (
                <DownloadCard key={record.productId} record={record} />
              ))}
            </div>

            {/* Support / Info Section */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl shadow-sm p-4 md:p-6 flex flex-col lg:flex-row items-center gap-6">
              <div className="h-11 w-11 rounded-lg bg-primary flex items-center justify-center shadow-md shrink-0">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="space-y-3 text-center lg:text-left flex-1">
                <h3 className="text-sm font-semibold">Perpetual Access Protection</h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
                  Each purchase grants you a perpetual license for personal and commercial use (internal). Your source files are stored in a distributed edge vault, ensuring 99.9% uptime for your creative workflow. If you reach your download limit, our support team can issue a manual license refresh.
                </p>
                <div className="flex flex-wrap justify-center lg:justify-start gap-2 pt-1">
                  <Button variant="outline" size="sm" className="h-8 rounded-lg" asChild>
                    <a href="mailto:store.support@prontly.in">Contact Data Support</a>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 rounded-lg gap-1.5 text-primary hover:bg-primary/5" asChild>
                    <Link href="/delivery-policy">Delivery Policy <HelpCircle className="h-3 w-3" /></Link>
                  </Button>
                </div>
              </div>
              <ShieldCheck className="hidden lg:block h-16 w-16 text-primary opacity-10 shrink-0" />
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
