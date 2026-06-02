import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { generateMeta } from '@/lib/seo/generate-meta';
import { Badge } from '@/components/ui/badge';
import { Star, Quote, Sparkles, Heart } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "Customer Reviews & Success Stories",
    description: "Read what professional creators and developers say about Prontly Store's premium AI prompts and digital assets.",
    path: '/testimonials',
    // Keep noindex until real testimonials are added
  });
}

export default function TestimonialsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-20">
        <header className="max-w-3xl mb-20">
          <Badge variant="outline" className="mb-6 border-primary/50 text-primary py-1 px-4 text-sm font-medium rounded-full bg-primary/5">
            <Sparkles className="h-3 w-3 mr-2" />
            Verified Customer Stories
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold font-headline mb-8 leading-tight">
            The Wall of <span className="text-primary">Love.</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Professional creators are accelerating their workflow with Prontly's digital assets. Be among the first to share your journey.
          </p>
        </header>

        <div className="text-center py-40 bg-muted/5 border-dashed border-2 rounded-[3rem] border-white/5">
          <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h4 className="text-2xl font-bold font-headline mb-2">Real Stories Coming Soon</h4>
          <p className="text-muted-foreground max-w-sm mx-auto">We're currently collecting feedback from our early adopters. Check back shortly to see the impact.</p>
          <div className="mt-8">
            <Link href="/products" className="text-primary font-bold hover:underline">Browse our latest assets →</Link>
          </div>
        </div>

        <section className="mt-32 pt-20 border-t border-white/5 text-center">
          <h2 className="text-3xl font-bold font-headline mb-6">Ready to create something great?</h2>
          <Link 
            href="/products" 
            className="inline-flex h-14 items-center justify-center rounded-2xl bg-primary px-10 text-lg font-bold text-white shadow-xl shadow-primary/20 hover:scale-105 transition-all"
          >
            Explore the Marketplace
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
