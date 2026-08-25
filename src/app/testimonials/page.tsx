import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { generateMeta } from '@/lib/seo/generate-meta';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Heart, ArrowRight } from 'lucide-react';
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

      <main className="flex-1 container mx-auto px-4 pt-28 pb-14 max-w-5xl">
        <header className="max-w-xl mb-10">
          <Badge variant="outline" className="mb-2 text-[10px] font-medium border-primary/50 text-primary bg-primary/5 px-2 py-0">
            <Sparkles className="h-3 w-3 mr-1" />
            Verified Customer Stories
          </Badge>
          <h1 className="text-lg md:text-xl font-semibold font-headline mb-3 leading-snug tracking-tight">
            The Wall of <span className="text-primary">Love.</span>
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Professional creators are accelerating their workflow with Prontly's digital assets. Be among the first to share your journey.
          </p>
        </header>

        <div className="text-center py-16 rounded-xl border border-dashed shadow-sm p-6">
          <Heart className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-30" />
          <h4 className="text-sm font-semibold mb-1">Real Stories Coming Soon</h4>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">We're currently collecting feedback from our early adopters. Check back shortly to see the impact.</p>
          <div className="mt-5">
            <Link href="/products" className="inline-flex items-center gap-1.5 text-primary text-xs font-medium hover:underline">
              Browse our latest assets <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        <section className="mt-12 pt-10 border-t text-center space-y-4">
          <h2 className="text-base md:text-lg font-semibold font-headline">Ready to create something great?</h2>
          <Link
            href="/products"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-5 text-xs font-medium text-white shadow-sm hover:bg-primary/90 transition-colors"
          >
            Explore the Marketplace
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
