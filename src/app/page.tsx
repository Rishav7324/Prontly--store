'use client';

import { useMemo, useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductGrid } from '@/components/store/ProductGrid';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight, 
  Zap, 
  Globe, 
  Cpu, 
  Search, 
  Star, 
  Users, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';

export default function Home() {
  const db = useFirestore();
  const [copied, setCopied] = useState(false);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'main') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const categoriesQuery = useMemoFirebase(() => db ? collection(db, 'categories') : null, [db]);
  const { data: categories } = useCollection(categoriesQuery);

  const productsQuery = useMemoFirebase(() => {
    return db ? collection(db, 'products') : null;
  }, [db]);

  const { data: rawProducts, loading } = useCollection(productsQuery);

  const featuredProducts = useMemo(() => {
    if (!rawProducts) return [];
    
    const allProductsSorted = [...rawProducts].sort((a: any, b: any) => {
      const dateA = a.createdAt?.toMillis?.() || a.updatedAt?.toMillis?.() || 0;
      const dateB = b.createdAt?.toMillis?.() || b.updatedAt?.toMillis?.() || 0;
      return dateB - dateA;
    });

    if (settings?.featuredProductIds && settings.featuredProductIds.length > 0) {
      const featured = allProductsSorted.filter(p => settings.featuredProductIds.includes(p.id));
      if (featured.length > 0) return featured;
    }
    
    return allProductsSorted.slice(0, 8);
  }, [rawProducts, settings]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText('PRONTLY20');
    setCopied(true);
    toast({ title: "Coupon Copied", description: "Use PRONTLY20 at checkout for 20% off." });
    setTimeout(() => setCopied(false), 2000);
  };

  const heroHeadline = settings?.homepageHeroCopy?.headline || "Elite Architecture for Modern Creators.";
  const heroSubheadline = settings?.homepageHeroCopy?.subheadline || "Professional-grade AI prompts, modular UI systems, and high-performance documentation. Engineered to scale your workflow.";

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary selection:text-white">
      <Navbar />
      
      <main className="flex-1">
        {/* COMPACT HERO SECTION */}
        <section className="relative pt-24 pb-16 lg:pt-40 lg:pb-24 overflow-hidden dreamy-gradient border-b border-stone-gray/5">
          <div className="container mx-auto px-4 relative z-10 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-4">
                  <Badge variant="outline" className="bg-white/80 border-primary/20 text-primary px-3 py-1 font-bold uppercase tracking-widest text-[9px] rounded-full shadow-sm">
                    <Sparkles className="h-2.5 w-2.5 mr-2 inline" />
                    Market Intelligence Platform
                  </Badge>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline leading-[1.05] text-midnight-ink tracking-tight max-w-xl">
                    {heroHeadline}
                  </h1>
                  <p className="text-sm md:text-base text-slate-blue max-w-lg leading-relaxed font-medium opacity-90">
                    {heroSubheadline}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button asChild size="lg" className="h-11 px-8 rounded-xl bg-deep-violet text-white font-bold shadow-xl shadow-deep-violet/20 transition-all active:scale-95 text-xs uppercase tracking-widest">
                    <Link href="/products">Explore Inventory</Link>
                  </Button>
                  <Button asChild variant="ghost" className="h-11 px-6 text-midnight-ink hover:text-primary font-bold transition-colors group text-xs uppercase tracking-widest">
                    <Link href="/signup" className="flex items-center gap-2">
                      Initialize account <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-8 pt-10 border-t border-stone-gray/10">
                  <div className="flex items-center gap-2 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-default group">
                    <ShieldCheck className="h-4 w-4 text-green-600 transition-colors group-hover:text-green-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-midnight-ink">Audit Verified</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-default group">
                    <Globe className="h-4 w-4 text-blue-600 transition-colors group-hover:text-blue-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-midnight-ink">Edge Delivery</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-default group">
                    <Cpu className="h-4 w-4 text-primary transition-colors group-hover:text-primary" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-midnight-ink">Performance Core</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 relative hidden lg:block">
                 <div className="relative group">
                    {/* Visual Stack Decoration */}
                    <div className="absolute -inset-4 bg-primary/5 rounded-[3rem] blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
                    
                    <div className="relative aspect-[4/5] w-full rounded-[2.5rem] shadow-2xl overflow-hidden bg-white border border-white/50 transform rotate-2 hover:rotate-0 transition-transform duration-700">
                        <Image 
                          src="https://picsum.photos/seed/prontly-platinum/1000/1250" 
                          alt="Interface" 
                          fill 
                          className="object-cover transition-transform duration-1000 group-hover:scale-105"
                          priority
                          data-ai-hint="luxury interface"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-midnight-ink/20 to-transparent" />
                    </div>
                    
                    {/* Floating Trust Badge */}
                    <div className="absolute -bottom-6 -left-8 bg-white/95 backdrop-blur-xl p-5 rounded-2xl shadow-2xl border border-white/50 animate-bounce-slow">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                              <Zap className="h-5 w-5" />
                           </div>
                           <div>
                              <p className="text-[8px] font-black uppercase text-ghost-gray tracking-widest mb-0.5">Uptime Sync</p>
                              <p className="text-base font-bold text-midnight-ink font-headline">99.9% Reliable</p>
                           </div>
                        </div>
                    </div>

                    {/* Floating Users Badge */}
                    <div className="absolute top-12 -right-6 bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/50">
                        <div className="flex items-center gap-3">
                           <div className="flex -space-x-2">
                             {[1,2,3].map(i => (
                               <div key={i} className="h-6 w-6 rounded-full border-2 border-white overflow-hidden bg-muted relative">
                                 <Image src={`https://picsum.photos/seed/user-${i}/100/100`} alt="User" fill className="object-cover" />
                               </div>
                             ))}
                           </div>
                           <div>
                             <p className="text-[8px] font-black uppercase text-ghost-gray tracking-widest">Active Peers</p>
                             <p className="text-xs font-bold text-midnight-ink">12k+ Creators</p>
                           </div>
                        </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* PERFORMANCE LEDGER - METRICS */}
        <section className="bg-white py-12 border-b border-stone-gray/5">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              {[
                { label: "Market Volume", val: "₹1.2Cr+", icon: TrendingUp },
                { label: "Verified Assets", val: "4.8k+", icon: ShieldCheck },
                { label: "Global Nodes", val: "120+", icon: Globe },
                { label: "Active Creators", val: "18k+", icon: Users },
              ].map((m, i) => (
                <div key={i} className="flex flex-col items-center md:items-start text-center md:text-left space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <m.icon className="h-3.5 w-3.5 text-primary opacity-60" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-ghost-gray">{m.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-midnight-ink font-headline">{m.val}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMPACT CATEGORIES NEXUS */}
        <section className="py-20 bg-porcelain-white/30">
          <div className="container mx-auto px-4 max-w-7xl">
            <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-2">
                <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 font-bold uppercase text-[8px] tracking-widest px-3 py-1 rounded-full">
                  Asset Nexus
                </Badge>
                <h2 className="text-3xl md:text-4xl font-headline text-midnight-ink tracking-tight">Specialized categories.</h2>
              </div>
              <Button variant="ghost" asChild className="text-primary font-bold h-auto p-0 flex items-center gap-2 text-xs uppercase tracking-widest hover:translate-x-1 transition-all">
                <Link href="/products">Explore full inventory <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </header>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
              {categories?.map((cat: any) => (
                <Link key={cat.id} href={`/products?category=${cat.slug}`} className="group">
                  <Card className="h-full bg-white border border-stone-gray/10 shadow-sm group-hover:border-primary/20 group-hover:shadow-xl transition-all duration-500 rounded-2xl overflow-hidden">
                    <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                      <div className="h-10 w-10 rounded-xl bg-porcelain-white flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                        <span className="text-xl">{cat.iconEmoji}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-midnight-ink font-headline leading-tight">{cat.name}</h4>
                        <p className="text-[10px] text-slate-blue font-bold uppercase tracking-tighter opacity-60 mt-1">120+ Assets</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CURATED GRID - VELOCITY LEADERS */}
        <section className="container mx-auto px-4 py-20 max-w-7xl">
          <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-2 text-center md:text-left">
              <Badge variant="outline" className="text-green-600 border-green-500/20 bg-green-500/5 font-bold uppercase text-[8px] tracking-widest px-3 py-1 rounded-full">
                Market Velocity
              </Badge>
              <h2 className="text-3xl md:text-4xl font-headline text-midnight-ink tracking-tight">Curated high-performance assets.</h2>
            </div>
            <div className="hidden md:flex gap-2">
               <Button variant="outline" size="sm" className="rounded-full h-9 px-5 text-[10px] font-black uppercase tracking-widest border-stone-gray/10">Bestsellers</Button>
               <Button variant="ghost" size="sm" className="rounded-full h-9 px-5 text-[10px] font-black uppercase tracking-widest text-slate-blue">New Drops</Button>
            </div>
          </header>

          <ProductGrid products={featuredProducts} loading={loading} />
          
          <div className="mt-16 flex justify-center">
             <Button asChild variant="outline" size="lg" className="h-11 px-10 rounded-xl border-stone-gray/20 font-bold text-midnight-ink hover:bg-midnight-ink hover:text-white transition-all shadow-sm text-xs uppercase tracking-widest">
                <Link href="/products">View All {rawProducts?.length || 0} Products</Link>
             </Button>
          </div>
        </section>

        {/* AUTHORIZATION TERMINAL - PROMO */}
        <section className="container mx-auto px-4 py-16 max-w-7xl">
           <div className="rounded-[3rem] bg-porcelain-white border border-stone-gray/10 p-8 md:p-16 flex flex-col lg:flex-row items-center gap-12 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                 <Zap className="h-64 w-64 text-midnight-ink" />
              </div>
              
              <div className="flex-1 space-y-6 text-center lg:text-left z-10">
                 <div className="inline-flex items-center gap-2 px-3 py-1 bg-deep-violet/5 border border-deep-violet/10 rounded-full">
                    <Clock className="h-3 w-3 text-deep-violet" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-deep-violet">Limited Authorization Terminal</span>
                 </div>
                 <h2 className="text-3xl md:text-5xl font-headline text-midnight-ink tracking-tight leading-[1.1]">Accelerate your ecosystem with a <span className="text-primary italic">20% discount.</span></h2>
                 <p className="text-sm md:text-base text-slate-blue leading-relaxed max-w-xl">
                   Join the professional tier and unlock full access to our source file vault. Valid for all new account initializations this week.
                 </p>
              </div>

              <div className="w-full lg:w-96 z-10">
                 <div className="p-8 rounded-[2rem] bg-white shadow-2xl border border-primary/10">
                    <div className="space-y-4">
                       <Label className="text-[10px] font-black uppercase text-ghost-gray tracking-widest ml-1">Use Coupon Code</Label>
                       <div className="relative">
                          <Input readOnly value="PRONTLY20" className="h-16 bg-muted/30 border-dashed border-primary/30 rounded-2xl text-xl font-bold text-center tracking-[0.2em] pr-20" />
                          <button 
                            onClick={handleCopyCode}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-primary font-bold text-xs uppercase hover:underline"
                          >
                            {copied ? <Check className="h-4 w-4" /> : 'Copy'}
                          </button>
                       </div>
                       <div className="flex items-center justify-between pt-2">
                          <p className="text-[9px] font-bold text-slate-blue uppercase">Verification: <span className="text-green-500">Active</span></p>
                          <p className="text-[9px] font-bold text-slate-blue uppercase">Expires: <span className="text-red-500">48 Hours</span></p>
                       </div>
                       <Button asChild className="w-full h-14 rounded-xl font-bold bg-midnight-ink text-white hover:bg-midnight-ink/90 text-sm uppercase tracking-widest mt-4">
                          <Link href="/signup">Claim Discount</Link>
                       </Button>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* COMMUNITY PULSE - TESTIMONIALS */}
        <section className="bg-white py-24 border-y border-stone-gray/5">
           <div className="container mx-auto px-4 max-w-7xl">
              <header className="mb-16 text-center space-y-3">
                 <Badge className="bg-primary/5 text-primary border-none uppercase tracking-widest font-black text-[9px] px-3 py-1">Community Pulse</Badge>
                 <h2 className="text-3xl md:text-5xl font-headline text-midnight-ink tracking-tight">Voices from the frontier.</h2>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {[
                   { name: "Siddharth K.", role: "AI Researcher", text: "The prompt engineering guides here are at a different level. Absolute production standards.", avatar: "1" },
                   { name: "Elena Rossi", role: "UI/UX Lead", text: "Cleanest modular architecture I've found in months. Saved us weeks of development time.", avatar: "2" },
                   { name: "Marcus Chen", role: "Founder, SaaS Lab", text: "Instant delivery and perpetual updates make Prontly our go-to for technical assets.", avatar: "3" },
                 ].map((t, i) => (
                   <Card key={i} className="border-stone-gray/10 bg-porcelain-white/50 rounded-2xl shadow-sm hover:shadow-md transition-all">
                      <CardContent className="p-8 space-y-6">
                         <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />)}
                         </div>
                         <p className="text-sm italic text-slate-blue leading-relaxed font-medium">"{t.text}"</p>
                         <div className="flex items-center gap-4 pt-4 border-t border-stone-gray/5">
                            <div className="h-10 w-10 rounded-full overflow-hidden bg-muted relative">
                               <Image src={`https://picsum.photos/seed/face-${t.avatar}/100/100`} alt={t.name} fill className="object-cover" />
                            </div>
                            <div>
                               <p className="text-sm font-bold text-midnight-ink leading-tight">{t.name}</p>
                               <p className="text-[10px] text-ghost-gray font-bold uppercase tracking-widest mt-0.5">{t.role}</p>
                            </div>
                         </div>
                      </CardContent>
                   </Card>
                 ))}
              </div>
           </div>
        </section>

        {/* COMPACT CTA */}
        <section className="container mx-auto px-4 py-24 max-w-7xl">
          <div className="rounded-[4rem] bg-midnight-ink text-white p-12 lg:p-24 text-center space-y-8 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(83,58,253,0.2),transparent)]" />
            
            <div className="relative z-10 space-y-6 max-w-3xl mx-auto">
              <Badge className="bg-white/10 text-white border-white/20 uppercase tracking-widest font-black py-1 px-4 rounded-full text-[9px]">Initialization</Badge>
              <h2 className="text-3xl md:text-6xl font-headline tracking-tight leading-[1.05]">Accelerate your creative output.</h2>
              <p className="text-sm md:text-lg text-white/60 font-light leading-relaxed max-w-xl mx-auto">Join thousands of creators using Prontly to scale their technical and artistic infrastructure.</p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
                <Button asChild size="lg" className="bg-white text-midnight-ink hover:bg-porcelain-white h-14 px-12 text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95">
                  <Link href="/signup">Get Started Now</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-white border-white/20 hover:bg-white/10 h-14 px-12 text-xs font-black uppercase tracking-widest rounded-2xl">
                  <Link href="/products">View full catalog</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
