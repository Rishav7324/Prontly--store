
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Search, ShoppingBag, ArrowLeft } from 'lucide-react';

export default function ProductNotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 flex flex-col items-center justify-center text-center py-20">
        <div className="h-24 w-24 rounded-[2rem] bg-primary/5 flex items-center justify-center mb-8 border border-primary/10 shadow-inner">
          <Search className="h-10 w-10 text-primary opacity-40" />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold font-headline mb-4 tracking-tight">Asset Not Found.</h1>
        <p className="text-xl text-muted-foreground max-w-md mb-12 leading-relaxed">
          The digital asset you are looking for has been moved, renamed, or is currently restricted.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
          <Button asChild size="lg" className="rounded-xl h-14 px-8 font-bold shadow-xl shadow-primary/20 flex-1">
            <Link href="/products">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Browse Catalog
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-xl h-14 px-8 font-bold flex-1">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>

        <div className="mt-20 pt-10 border-t border-white/5 w-full max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">
            Error Protocol 404 • Product Resource Missing
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
