import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { generateMeta } from '@/lib/seo/generate-meta';
import { Badge } from '@/components/ui/badge';
import { Zap, ShieldCheck, Cpu, Globe, Rocket, Users } from 'lucide-react';
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
      
      <main className="flex-1 container mx-auto px-4 pt-28 pb-16 max-w-7xl">
        <header className="max-w-3xl mb-16">
          <Badge variant="outline" className="mb-6 border-primary/50 text-primary py-1 px-4 text-sm font-medium rounded-full bg-primary/5">
            Our Mission
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold font-headline mb-8 leading-tight tracking-tight text-midnight-ink">
            Accelerating the <span className="text-primary">Creative Class.</span>
          </h1>
          <p className="text-xl text-slate-blue leading-relaxed font-medium">
            Prontly is a specialized digital marketplace dedicated to high-performance assets. We bridge the gap between complex AI systems and professional creative workflows.
          </p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-24">
          <div className="lg:col-span-8 space-y-10">
            <div className="prose-content">
              <h2 className="text-3xl font-bold font-headline text-midnight-ink mb-6">The Prontly Standard</h2>
              <p>
                In an era dominated by noise, Prontly stands for technical precision. We noticed that while digital assets are abundant, verified, production-ready tools are rare. Most creators spend more time "fixing" assets than using them.
              </p>
              <p>
                Founded in Patna, India, Prontly was built to solve this friction. Every AI prompt, UI template, and technical guide in our catalog undergoes a rigorous verification process. We don't just list products; we engineer solutions that work from the first download.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                <div key={i} className="p-8 rounded-[2rem] bg-muted/20 border border-stone-gray/10 group hover:bg-white hover:border-primary/20 transition-all duration-500 shadow-sm">
                  <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h4 className="text-lg font-bold text-midnight-ink mb-2">{item.title}</h4>
                  <p className="text-sm text-slate-blue leading-relaxed font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-32 p-8 rounded-[2.5rem] bg-midnight-ink text-white space-y-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 transition-transform duration-1000">
                <Cpu className="h-48 w-48" />
              </div>
              <div className="relative z-10 space-y-4">
                <h3 className="text-2xl font-bold font-headline leading-tight">Ready to build your next breakthrough?</h3>
                <p className="text-sm text-white/60 leading-relaxed font-medium">Join 5,000+ professional creators who trust Prontly for their technical infrastructure.</p>
                <Button asChild size="lg" className="w-full bg-white text-midnight-ink hover:bg-white/90 h-14 rounded-xl font-bold text-sm">
                  <Link href="/products">Explore Catalog</Link>
                </Button>
              </div>
            </div>
          </aside>
        </section>

        <section className="py-20 border-t border-stone-gray/10">
          <div className="text-center max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold font-headline text-midnight-ink">Global Infrastructure. Local Roots.</h2>
            <p className="text-lg text-slate-blue font-medium">
              We operate out of Patna, Bihar, utilizing world-class cloud architecture to serve a global audience of modern creators.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
