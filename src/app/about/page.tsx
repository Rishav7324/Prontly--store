import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { generateMeta } from '@/lib/seo/generate-meta';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, ShieldCheck, Cpu, Globe, Users } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "About Prontly — Engineering Digital Workflows",
    description: "Learn about Prontly's mission to provide professional creators with high-performance AI prompts and digital assets.",
    path: '/about'
  });
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 pt-20 md:pt-24 pb-14 max-w-6xl">
        <header className="max-w-2xl mb-10">
          <Badge variant="outline" className="mb-2 text-[10px] font-medium border-primary/50 text-primary bg-primary/5 px-2 py-0">
            Our Mission
          </Badge>
          <h1 className="text-2xl md:text-3xl font-semibold font-headline mb-3 leading-snug tracking-tight text-foreground">
            Accelerating the <span className="text-primary">Creative Class.</span>
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Prontly is a specialized digital marketplace dedicated to high-performance assets. We bridge the gap between complex AI systems and professional creative workflows.
          </p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
          <div className="lg:col-span-8 space-y-8">
            <div className="prose-content rounded-xl shadow-sm border p-4 bg-card">
              <h2 className="text-base md:text-lg font-semibold font-headline text-foreground mb-3">The Prontly Standard</h2>
              <p>
                In an era dominated by noise, Prontly stands for technical precision. We noticed that while digital assets are abundant, verified, production-ready tools are rare. Most creators spend more time "fixing" assets than using them.
              </p>
              <p>
                Founded in Patna, India, Prontly was built to solve this friction. Every AI prompt, UI template, and technical guide in our catalog undergoes a rigorous verification process. We don't just list products; we engineer solutions that work from the first download.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  title: "Verified Quality",
                  desc: "Every asset is tested for cross-platform compatibility and production accuracy.",
                  icon: ShieldCheck
                },
                {
                  title: "Edge Delivery",
                  desc: "Instant fulfillment via Cloudflare Global R2 ensures you get your files in seconds.",
                  icon: Zap
                },
                {
                  title: "Expert Curation",
                  desc: "Our catalog is managed by engineers and designers, not algorithms.",
                  icon: Users
                },
                {
                  title: "Statutory Trust",
                  desc: "Full compliance with DPDPA 2023 and Indian consumer protection standards.",
                  icon: Globe
                }
              ].map((item, i) => (
                <div key={i} className="rounded-xl shadow-sm p-4 border bg-card group hover:border-primary/20 transition-colors">
                  <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary mb-3">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">{item.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-28 rounded-xl shadow-sm border bg-midnight-ink text-white p-4 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 -rotate-12 pointer-events-none">
                <Cpu className="h-24 w-24" />
              </div>
              <div className="relative z-10 space-y-3">
                <h3 className="text-sm md:text-base font-semibold leading-snug">Ready to build your next breakthrough?</h3>
                <p className="text-xs text-white/60 leading-relaxed">Join 5,000+ professional creators who trust Prontly for their technical infrastructure.</p>
                <Button asChild className="w-full bg-white text-foreground hover:bg-white/90 h-9 rounded-lg font-medium text-xs">
                  <Link href="/products">Explore Catalog</Link>
                </Button>
              </div>
            </div>
          </aside>
        </section>

        <section className="py-10 border-t">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-lg md:text-xl font-semibold font-headline text-foreground">Global Infrastructure. Local Roots.</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              We operate out of Patna, Bihar, utilizing world-class cloud architecture to serve a global audience of modern creators.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
