import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductGrid } from '@/components/store/ProductGrid';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Globe, 
  Cpu, 
  Star, 
  Package, 
  Clock,
  CheckCircle2,
  TrendingUp,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { firebaseConfig } from '@/firebase/config';
import { RecentPurchasePopup } from '@/components/store/RecentPurchasePopup';

/**
 * @fileOverview High-performance Server-Side Homepage.
 * Fetches data on the server to ensure perfect SEO and Crawler rendering.
 */
async function getHomeData() {
  const projectId = firebaseConfig.projectId;
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  
  try {
    const [catRes, prodRes] = await Promise.all([
      fetch(`${baseUrl}/categories`, { next: { revalidate: 3600 } }),
      fetch(`${baseUrl}/products?pageSize=100`, { next: { revalidate: 60 } })
    ]);

    const catData = await catRes.json();
    const prodData = await prodRes.json();

    const categories = (catData.documents || []).map((doc: any) => {
      const fields = doc.fields || {};
      return {
        id: doc.name.split('/').pop(),
        name: fields.name?.stringValue || "",
        slug: fields.slug?.stringValue || "",
        iconEmoji: fields.iconEmoji?.stringValue || "📦",
      };
    });

    const products = (prodData.documents || []).map((doc: any) => {
      const fields = doc.fields || {};
      const priceVal = fields.price?.integerValue || fields.price?.doubleValue || "0";
      const compareVal = fields.compareAtPrice?.integerValue || fields.compareAtPrice?.doubleValue || "0";
      
      return {
        id: doc.name.split('/').pop(),
        slug: fields.slug?.stringValue || "",
        name: fields.name?.stringValue || "Untitled Asset",
        price: parseInt(priceVal.toString()),
        compareAtPrice: parseInt(compareVal.toString()),
        categorySlug: fields.categorySlug?.stringValue || "asset",
        images: fields.images?.arrayValue?.values?.map((v: any) => v.stringValue) || [],
        averageRating: parseFloat(fields.averageRating?.doubleValue || fields.averageRating?.integerValue || "5.0"),
        salesCount: parseInt((fields.salesCount?.integerValue || 0).toString()),
        shortDescription: fields.shortDescription?.stringValue || "",
        isPublished: fields.isPublished?.booleanValue ?? true,
        isFeatured: fields.isFeatured?.booleanValue || false
      };
    });

    return { categories, products };
  } catch (error) {
    console.error('[HOMEPAGE_FETCH_ERROR]:', error);
    return { categories: [], products: [] };
  }
}

export default async function Home() {
  const { categories, products } = await getHomeData();

  const trendingProducts = products
    .filter(p => p.isPublished !== false)
    .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
    .slice(0, 4);

  const stats = {
    downloads: products.reduce((sum, p) => sum + (p.salesCount || 0), 0) || 5000,
    count: products.length,
    rating: products.length > 0 
      ? (products.reduce((sum, p) => sum + (p.averageRating || 5.0), 0) / products.length).toFixed(1)
      : '4.9'
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-accent selection:text-white">
      <Navbar />
      
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-24 pb-12 lg:pt-32 lg:pb-20 overflow-hidden">
          <div className="container mx-auto px-4 relative z-10 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-4">
                  <Badge variant="outline" className="bg-white border-accent/20 text-accent px-3 py-1 font-semibold uppercase tracking-wider text-[11px] rounded-full shadow-sm">
                    <Sparkles className="h-3 w-3 mr-2 inline text-accent fill-accent/10" />
                    Premium Digital Assets Built for Results
                  </Badge>
                  <h1 className="text-display-lg text-foreground">
                    Scale Your Creative <span className="text-accent">Workflow</span> with Verified Tools
                  </h1>
                  <h2 className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed font-normal">
                    Discover professionally crafted prompts, automation systems, creator resources, and business-ready digital assets.
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Button asChild size="lg" className="rounded-xl shadow-xl shadow-accent/20 group">
                    <Link href="/products" className="flex items-center gap-2">
                      Explore Products
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-xl border-stone-gray/10 hover:bg-white shadow-sm">
                    <Link href="/products?view=categories">View Categories</Link>
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-x-10 gap-y-4 pt-8 border-t border-stone-gray/5">
                  {[
                    { label: `${stats.downloads}+ Downloads`, icon: Zap },
                    { label: `${stats.count} Assets`, icon: Package },
                    { label: `${stats.rating} Rating`, icon: Star },
                    { label: "Instant Access", icon: Clock },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-primary/5 flex items-center justify-center">
                        <stat.icon className="h-3.5 w-3.5 text-accent" />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-midnight-ink">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating Product Stack */}
              <div className="lg:col-span-5 relative hidden lg:block">
                 <div className="relative h-[450px] w-full">
                    {trendingProducts.length > 0 ? (
                      <>
                        <div className="absolute top-0 right-0 w-72 aspect-[4/5] bg-white border border-stone-gray/10 rounded-2xl overflow-hidden shadow-2xl transform rotate-6 translate-x-10 translate-y-10 transition-all duration-700 hover:rotate-3 hover:translate-y-6">
                           <Image 
                             src={trendingProducts[0]?.images?.[0] || 'https://picsum.photos/seed/p1/600/800'} 
                             alt={trendingProducts[0]?.name} 
                             fill 
                             className="object-cover" 
                             sizes="400px"
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                              <p className="text-white font-bold text-base">{trendingProducts[0]?.name}</p>
                           </div>
                        </div>

                        {trendingProducts.length > 1 && (
                          <div className="absolute top-16 right-16 w-72 aspect-[4/5] bg-white border border-stone-gray/10 rounded-2xl overflow-hidden shadow-xl transform -rotate-3 transition-all duration-1000 hover:rotate-0">
                             <Image 
                               src={trendingProducts[1]?.images?.[0] || 'https://picsum.photos/seed/p2/600/800'} 
                               alt={trendingProducts[1]?.name} 
                               fill 
                               className="object-cover"
                               sizes="400px"
                             />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center border-2 border-dashed border-stone-gray/10 rounded-[3rem] bg-muted/5">
                        <Package className="h-16 w-16 text-muted-foreground opacity-20" />
                      </div>
                    )}
                 </div>
              </div>
            </div>
          </div>
          <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] -z-10" />
        </section>

        {/* CATEGORIES NEXUS */}
        <section className="py-12 bg-muted/30 border-y border-stone-gray/5">
          <div className="container mx-auto px-4 max-w-7xl">
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div className="space-y-1">
                <h2 className="text-headline-xl">Catalog Categories</h2>
                <p className="text-muted-foreground text-sm font-medium">Explore the depth of our verified collections.</p>
              </div>
              <Button variant="ghost" asChild className="text-accent font-bold hover:bg-accent/5 px-4 h-10 rounded-xl">
                <Link href="/products">Browse All <ArrowRight className="h-4 w-4 ml-2" /></Link>
              </Button>
            </header>

            <div className="flex overflow-x-auto gap-5 pb-4 no-scrollbar snap-x">
              {categories?.map((cat: any) => {
                const assetCount = products.filter((p: any) => p.categorySlug === cat.slug).length;
                return (
                  <Link key={cat.id} href={`/products?category=${cat.slug}`} className="snap-start shrink-0">
                    <div className="w-52 h-60 bg-white border border-stone-gray/10 rounded-2xl p-6 flex flex-col items-center text-center justify-center space-y-4 transition-all hover:-translate-y-1 hover:shadow-xl group">
                      <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center shadow-inner group-hover:bg-primary/5 transition-colors">
                        <span className="text-2xl group-hover:grayscale-0 transition-all">{cat.iconEmoji || '📦'}</span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm leading-tight text-midnight-ink">{cat.name}</h4>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{assetCount} Assets</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* TRENDING NOW */}
        <section className="py-16 container mx-auto px-4 max-w-7xl">
           <header className="mb-10 text-center space-y-2">
              <Badge variant="outline" className="bg-secondary/5 border-secondary/20 text-secondary px-3 py-1 rounded-full uppercase tracking-widest text-[10px] font-black">Velocity Feed</Badge>
              <h2 className="text-3xl md:text-5xl font-bold font-headline text-midnight-ink tracking-tight">Trending Now</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">Most popular digital products currently in the creative cycle.</p>
           </header>
           <ProductGrid products={trendingProducts} />
           <div className="mt-12 text-center">
              <Button asChild variant="outline" className="rounded-xl h-12 px-8 font-bold border-stone-gray/10">
                <Link href="/products">View Full Catalog</Link>
              </Button>
           </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="py-16 bg-white border-y border-stone-gray/5 overflow-hidden relative">
           <div className="container mx-auto px-4 max-w-7xl relative z-10">
              <header className="max-w-2xl mb-12 space-y-2">
                <h2 className="text-3xl md:text-5xl font-bold font-headline text-midnight-ink tracking-tight">Built for Professional Performance.</h2>
                <p className="text-lg text-slate-blue leading-relaxed">Why leading creators choose Prontly for their digital toolkits.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
                 {[
                   { title: "Instant Access", desc: "Download source files immediately after payment verification via Global R2 Edge.", icon: Zap },
                   { title: "Expert Crafted", desc: "Professionally engineered prompts tested for production accuracy and results.", icon: Cpu },
                   { title: "Lifetime Updates", desc: "Access future version updates and maintenance at no additional cost.", icon: CheckCircle2 },
                   { title: "Secure Payments", desc: "Enterprise-grade encryption and PCI-compliant processing for every transaction.", icon: ShieldCheck },
                   { title: "Mobile Friendly", desc: "Manage your dashboard and access your digital library from any device, anywhere.", icon: Globe },
                   { title: "Verified Quality", desc: "All digital assets undergo rigorous verification before listing.", icon: Shield },
                 ].map((feature, i) => (
                   <div key={i} className="flex gap-5 group">
                      <div className="h-12 w-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 shrink-0 shadow-sm">
                         <feature.icon className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-bold text-midnight-ink">{feature.title}</h4>
                        <p className="text-muted-foreground text-sm leading-relaxed font-medium">{feature.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </section>

        {/* CTA SECTION */}
        <section className="container mx-auto px-4 py-16 max-w-7xl">
           <div className="rounded-[2rem] bg-midnight-ink text-white p-10 lg:p-16 text-center space-y-6 relative overflow-hidden shadow-2xl group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.15),transparent)]" />
              <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
                 <Zap className="h-48 w-48 text-white" />
              </div>
              
              <div className="relative z-10 space-y-4 max-w-3xl mx-auto">
                <Badge className="bg-white/10 text-white border-white/20 uppercase tracking-[0.2em] font-black py-1 px-4 rounded-full text-[10px]">Ready to Build?</Badge>
                <h2 className="text-3xl text-white md:text-5xl font-bold font-headline leading-tight tracking-tight">Start Building Faster With Premium Assets</h2>
                <p className="text-base text-white/60 font-medium max-w-xl mx-auto leading-relaxed">Join thousands of creators scaling their creative workflows with our verified catalog.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
                  <Button asChild size="lg" className="bg-white text-midnight-ink hover:bg-white/90 h-14 px-12 text-sm font-bold rounded-xl shadow-xl transition-all hover:scale-105">
                    <Link href="/products">Get Started Now</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="text-white border-white/20 hover:bg-white/10 h-14 px-12 text-sm font-bold rounded-xl">
                    <Link href="/products?view=categories">Browse Categories</Link>
                  </Button>
                </div>
              </div>
           </div>
        </section>
      </main>

      <RecentPurchasePopup />
      <Footer />
    </div>
  );
}
