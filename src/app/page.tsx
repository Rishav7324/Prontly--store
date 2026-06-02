
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
  Check,
  Smartphone,
  CheckSquare,
  Package,
  History,
  MessageSquare,
  ArrowUpRight,
  HelpCircle,
  Mail,
  ShoppingCart
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { analytics } from '@/lib/analytics';

export default function Home() {
  const db = useFirestore();
  const [copied, setCopied] = useState(false);

  // Mock "Recently Purchased" Notification for conversion optimization
  useEffect(() => {
    const timer = setTimeout(() => {
      toast({
        title: "Recent Purchase",
        description: "A creator just acquired the 'Master AI Prompt Pack'.",
        duration: 5000,
      });
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

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
    return [...rawProducts].filter(p => p.isPublished !== false).sort((a,b) => (b.salesCount || 0) - (a.salesCount || 0)).slice(0, 8);
  }, [rawProducts]);

  const trendingProducts = useMemo(() => {
    if (!rawProducts) return [];
    return [...rawProducts].filter(p => p.isPublished !== false).slice(0, 4);
  }, [rawProducts]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText('PRONTLY20');
    setCopied(true);
    toast({ title: "Coupon Copied", description: "Use PRONTLY20 at checkout for 20% off." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary selection:text-white">
      <Navbar />
      
      <main className="flex-1">
        {/* PREMIUM HERO SECTION */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden dreamy-gradient">
          <div className="container mx-auto px-4 relative z-10 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
              <div className="lg:col-span-7 space-y-8">
                <div className="space-y-4">
                  <Badge variant="outline" className="bg-white/80 border-primary/20 text-primary px-4 py-1.5 font-bold uppercase tracking-widest text-[10px] rounded-full shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Sparkles className="h-3 w-3 mr-2 inline text-primary fill-primary/20" />
                    Trusted by 12,000+ Modern Creators
                  </Badge>
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-headline leading-[1.05] text-midnight-ink tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-1000">
                    Premium AI Prompts & Digital Assets <span className="text-primary italic">Built for Results</span>
                  </h1>
                  <p className="text-lg md:text-xl text-slate-blue max-w-xl leading-relaxed font-medium opacity-90 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    Discover professionally crafted prompts, automation systems, creator resources, and business-ready digital workflows.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                  <Button asChild size="lg" className="h-14 px-10 rounded-2xl bg-primary text-white font-bold shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 text-sm uppercase tracking-widest">
                    <Link href="/products" onClick={() => analytics.pageView('Products Catalog')}>Explore Products</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="h-14 px-8 rounded-2xl text-midnight-ink border-stone-gray/20 hover:bg-porcelain-white font-bold transition-all text-sm uppercase tracking-widest">
                    <Link href="/products?view=categories">View Categories</Link>
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-x-12 gap-y-6 pt-12 border-t border-stone-gray/10 animate-in fade-in duration-1000">
                  {[
                    { label: "5000+ Downloads", icon: Zap },
                    { label: "500+ Products", icon: Package },
                    { label: "4.9/5.0 Rating", icon: Star },
                    { label: "Instant Access", icon: Clock },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center gap-3 group">
                      <stat.icon className="h-5 w-5 text-primary/60 transition-transform group-hover:scale-110" />
                      <span className="text-[11px] font-black uppercase tracking-widest text-midnight-ink opacity-70">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating Product Cards Visual */}
              <div className="lg:col-span-5 relative hidden lg:block perspective-1000">
                 <div className="relative group h-[600px] w-full">
                    {/* Layered Visual Stack */}
                    <div className="absolute top-0 right-0 w-80 aspect-[4/5] rounded-[2.5rem] bg-white shadow-2xl border border-stone-gray/10 overflow-hidden transform rotate-6 translate-x-12 translate-y-12 transition-all duration-700 group-hover:rotate-3 group-hover:translate-x-8">
                       <Image src="https://picsum.photos/seed/pr-v1/600/800" alt="Asset 1" fill className="object-cover" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                          <div className="text-white space-y-1">
                             <p className="text-[10px] font-black uppercase tracking-widest opacity-60">AI Systems</p>
                             <p className="font-bold text-lg">Automation Engine v2</p>
                          </div>
                       </div>
                    </div>

                    <div className="absolute top-20 right-20 w-80 aspect-[4/5] rounded-[2.5rem] bg-white shadow-2xl border border-stone-gray/10 overflow-hidden transform -rotate-3 transition-all duration-1000 group-hover:rotate-0">
                       <Image src="https://picsum.photos/seed/pr-v2/600/800" alt="Asset 2" fill className="object-cover" />
                       <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex items-center justify-center">
                          <Button className="rounded-full bg-white text-primary font-bold h-14 w-14 p-0 shadow-2xl">
                             <ArrowRight className="h-6 w-6" />
                          </Button>
                       </div>
                    </div>

                    {/* Performance Floating Stats */}
                    <div className="absolute -bottom-10 -left-10 bg-white/95 backdrop-blur-xl p-6 rounded-[2rem] shadow-2xl border border-white/50 animate-bounce-slow">
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                              <TrendingUp className="h-6 w-6" />
                           </div>
                           <div>
                              <p className="text-[10px] font-black uppercase text-ghost-gray tracking-widest">Growth Velocity</p>
                              <p className="text-xl font-bold text-midnight-ink font-headline">+142% Productivity</p>
                           </div>
                        </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED CATEGORIES - HORIZONTAL SCROLL */}
        <section className="py-20 bg-porcelain-white/50">
          <div className="container mx-auto px-4 max-w-7xl">
            <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-2">
                <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 font-bold uppercase text-[9px] tracking-widest px-3 py-1 rounded-full">Explore Ecosystem</Badge>
                <h2 className="text-4xl font-headline text-midnight-ink tracking-tight">Technical Categories.</h2>
              </div>
              <Button variant="ghost" asChild className="text-primary font-bold hover:translate-x-1 transition-all text-xs uppercase tracking-widest">
                <Link href="/products">Browse All Collections <ArrowRight className="h-4 w-4 ml-2" /></Link>
              </Button>
            </header>

            <div className="flex overflow-x-auto gap-6 pb-8 no-scrollbar -mx-4 px-4 snap-x">
              {categories?.map((cat: any) => (
                <Link key={cat.id} href={`/products?category=${cat.slug}`} className="snap-start shrink-0">
                  <Card className="w-64 h-72 bg-white border border-stone-gray/10 shadow-sm hover:shadow-2xl hover:border-primary/20 hover:-translate-y-2 transition-all duration-500 rounded-[2rem] overflow-hidden group">
                    <CardContent className="p-10 flex flex-col items-center text-center h-full justify-center space-y-6">
                      <div className="h-20 w-20 rounded-[1.5rem] bg-porcelain-white flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                        <span className="text-4xl">{cat.iconEmoji || '📦'}</span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-bold text-midnight-ink font-headline leading-tight">{cat.name}</h4>
                        <p className="text-[10px] text-slate-blue font-bold uppercase tracking-widest opacity-60">120+ Verified Assets</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* TRENDING NOW - VELOCITY FEED */}
        <section className="py-24 container mx-auto px-4 max-w-7xl">
           <header className="mb-16 text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/5 border border-rose-500/10 rounded-full">
                 <Zap className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Trending Now</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-headline text-midnight-ink tracking-tight">Most popular this week.</h2>
              <p className="text-slate-blue max-w-lg mx-auto">The highest-performing assets as voted by the community usage metrics.</p>
           </header>
           
           <ProductGrid products={trendingProducts} loading={loading} />
        </section>

        {/* WHY CHOOSE PRONTLY - VALUE GRID */}
        <section className="py-24 bg-midnight-ink text-white">
           <div className="container mx-auto px-4 max-w-7xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                 {[
                   { title: "Instant Access", desc: "Download your source files immediately after payment verification.", icon: Zap },
                   { title: "Expert Crafted", desc: "Professionally engineered prompts tested for production accuracy.", icon: Cpu },
                   { title: "Lifetime Updates", desc: "Future version updates and technical maintenance included for free.", icon: CheckCircle2 },
                   { title: "Secure Payments", desc: "Enterprise-grade encryption protecting every digital transaction.", icon: ShieldCheck },
                   { title: "Mobile Friendly", desc: "Access your dashboard and library from any device, anywhere.", icon: Smartphone },
                   { title: "Premium Quality", desc: "High-value digital assets curated for elite performance.", icon: Star },
                 ].map((feature, i) => (
                   <div key={i} className="space-y-4 group">
                      <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                         <feature.icon className="h-7 w-7" />
                      </div>
                      <h4 className="text-xl font-bold font-headline">{feature.title}</h4>
                      <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                   </div>
                 ))}
              </div>
           </div>
        </section>

        {/* FEATURED COLLECTIONS */}
        <section className="py-32 container mx-auto px-4 max-w-7xl">
           <header className="mb-16">
              <Badge variant="outline" className="mb-4 border-primary/20 text-primary uppercase font-bold text-[10px]">Curated Bundles</Badge>
              <h2 className="text-4xl md:text-5xl font-headline text-midnight-ink tracking-tight">Featured Collections.</h2>
           </header>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {[
                { title: "Creator Bundle", count: 45, img: "https://picsum.photos/seed/cb/1000/600", color: "bg-blue-500" },
                { title: "AI Business Kit", count: 28, img: "https://picsum.photos/seed/abk/1000/600", color: "bg-purple-500" }
              ].map((coll, i) => (
                <div key={i} className="relative group h-[400px] rounded-[3rem] overflow-hidden shadow-2xl">
                   <Image src={coll.img} alt={coll.title} fill className="object-cover transition-transform duration-1000 group-hover:scale-110" />
                   <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-all group-hover:backdrop-blur-none" />
                   <div className="absolute inset-0 p-12 flex flex-col justify-end">
                      <p className="text-white/60 font-bold uppercase tracking-widest text-xs mb-2">{coll.count} Assets Included</p>
                      <h3 className="text-3xl md:text-4xl font-bold text-white font-headline mb-8">{coll.title}</h3>
                      <Button className="w-fit h-14 px-10 rounded-2xl bg-white text-midnight-ink hover:bg-white/90 font-bold shadow-2xl">
                         Explore Collection <ChevronRight className="ml-2 h-5 w-5" />
                      </Button>
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* SOCIAL PROOF - GLASSMORPHISM TESTIMONIALS */}
        <section className="py-24 dreamy-gradient border-y border-stone-gray/5">
           <div className="container mx-auto px-4 max-w-7xl">
              <header className="mb-20 text-center max-w-2xl mx-auto space-y-4">
                 <h2 className="text-4xl font-headline text-midnight-ink tracking-tight">What Creators Say.</h2>
                 <p className="text-slate-blue">Verified feedback from the frontier of digital creation.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {[
                   { name: "Siddharth K.", role: "AI Researcher", text: "The technical precision here is unmatched. These assets saved our team 20+ hours of R&D.", avatar: "1" },
                   { name: "Elena Rossi", role: "UX Director", text: "Clean, modular, and performant. Finally a store that understands professional creator needs.", avatar: "2" },
                   { name: "Marcus Chen", role: "SaaS Founder", text: "Instant ROI. The automation systems are built for scale and work perfectly across our stack.", avatar: "3" },
                 ].map((t, i) => (
                   <Card key={i} className="bg-white/40 backdrop-blur-xl border-white/50 rounded-[2rem] shadow-xl hover:shadow-2xl transition-all group p-8 space-y-6">
                      <div className="flex gap-1">
                         {[1,2,3,4,5].map(s => <Star key={s} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />)}
                      </div>
                      <p className="text-base text-midnight-ink leading-relaxed italic font-medium">"{t.text}"</p>
                      <div className="flex items-center gap-4 pt-6 border-t border-black/5">
                         <div className={cn("relative rounded-full overflow-hidden flex-shrink-0", "h-12 w-12 border-2 border-white shadow-lg")}>
                            <Image src={`https://picsum.photos/seed/u${i}/100/100`} alt={t.name} fill className="object-cover" />
                         </div>
                         <div>
                            <p className="font-bold text-midnight-ink text-sm">{t.name}</p>
                            <p className="text-[10px] text-primary font-black uppercase tracking-widest">{t.role}</p>
                         </div>
                      </div>
                   </Card>
                 ))}
              </div>
           </div>
        </section>

        {/* BLOG PREVIEW */}
        <section className="py-32 container mx-auto px-4 max-w-7xl">
           <header className="mb-16 flex justify-between items-end">
              <h2 className="text-4xl font-headline text-midnight-ink tracking-tight">Creator Insights.</h2>
              <Button variant="link" className="text-primary font-bold">Full Blog <ArrowRight className="ml-2 h-4 w-4" /></Button>
           </header>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[1,2,3].map(i => (
                <Link key={i} href="/blog" className="group space-y-6">
                   <div className="aspect-video relative rounded-[2rem] overflow-hidden shadow-lg">
                      <Image src={`https://picsum.photos/seed/blog${i}/800/600`} alt="Blog" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                   </div>
                   <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase text-primary tracking-widest">Tutorial • 5 Min Read</p>
                      <h4 className="text-2xl font-bold font-headline text-midnight-ink group-hover:text-primary transition-colors">Mastering Advanced Prompt Engineering for Businesses</h4>
                      <p className="text-slate-blue text-sm line-clamp-2">Learn how to structure enterprise-grade prompts for maximum consistency and output reliability.</p>
                   </div>
                </Link>
              ))}
           </div>
        </section>

        {/* NEWSLETTER SECTION */}
        <section className="py-24 bg-porcelain-white/80">
           <div className="container mx-auto px-4 max-w-4xl text-center space-y-8">
              <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
                 <Mail className="h-8 w-8" />
              </div>
              <div className="space-y-4">
                 <h2 className="text-4xl font-bold font-headline text-midnight-ink">Get New Prompts Every Week.</h2>
                 <p className="text-slate-blue max-w-md mx-auto">Join our inner circle for exclusive prompts, deep discounts, and early access to technical drops.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                 <Input placeholder="Enter your elite email..." className="h-14 rounded-2xl px-6 bg-white border-stone-gray/10 shadow-inner" />
                 <Button size="lg" className="h-14 px-10 rounded-2xl bg-midnight-ink text-white font-bold shadow-xl">Subscribe</Button>
              </div>
              <div className="flex justify-center gap-8 pt-4">
                 {["Exclusive Prompts", "Discounts", "Early Access"].map((b, i) => (
                   <div key={i} className="flex items-center gap-2 text-[10px] font-black uppercase text-ghost-gray tracking-widest">
                      <CheckCircle2 className="h-3 w-3 text-green-500" /> {b}
                   </div>
                 ))}
              </div>
           </div>
        </section>

        {/* FAQ SECTION */}
        <section className="py-32 container mx-auto px-4 max-w-3xl">
           <header className="mb-16 text-center space-y-4">
              <Badge variant="outline" className="border-stone-gray/20 text-ghost-gray">Support Console</Badge>
              <h2 className="text-4xl font-bold font-headline text-midnight-ink">Frequently Asked.</h2>
           </header>
           
           <Accordion type="single" collapsible className="w-full space-y-4">
              {[
                { q: "How do downloads work?", a: "Once payment is verified, assets appear instantly in your dashboard 'My Library' section. You'll also receive a secure download link via email." },
                { q: "Do products receive updates?", a: "Yes. All our digital assets include perpetual updates. When we release a v2.0, you'll find the new source files in your library at no extra cost." },
                { q: "What is your refund policy?", a: "Due to the digital nature of our goods, we typically do not offer refunds. However, if an asset is technically defective, our support team will issue a resolution within 24 hours." },
                { q: "Is commercial use allowed?", a: "Most products include a Personal Use license. For redistribution or large-scale commercial rights, please contact our enterprise desk." }
              ].map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border border-stone-gray/10 rounded-2xl bg-white px-6">
                  <AccordionTrigger className="text-base font-bold text-midnight-ink hover:no-underline">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-slate-600 leading-relaxed pb-6">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
           </Accordion>
        </section>

        {/* FINAL CTA */}
        <section className="container mx-auto px-4 py-24 max-w-7xl">
           <div className="rounded-[4rem] bg-primary text-white p-12 lg:p-24 text-center space-y-8 relative overflow-hidden shadow-2xl group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)]" />
              <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
                 <Zap className="h-64 w-64" />
              </div>
              
              <div className="relative z-10 space-y-6 max-w-3xl mx-auto">
                <Badge className="bg-white/10 text-white border-white/20 uppercase tracking-widest font-black py-1 px-4 rounded-full text-[10px]">Start Creating Today</Badge>
                <h2 className="text-5xl md:text-7xl font-headline tracking-tight leading-[1.05]">Start Building Faster With Premium Assets.</h2>
                <p className="text-lg md:text-xl text-white/70 font-light leading-relaxed max-w-xl mx-auto">Join 12,000+ creators scaling their technical workflows with our verified library.</p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-10">
                  <Button asChild size="lg" className="bg-white text-primary hover:bg-porcelain-white h-16 px-12 text-sm font-black uppercase tracking-widest rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95">
                    <Link href="/products">Get Started Now</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="text-white border-white/20 hover:bg-white/10 h-16 px-12 text-sm font-black uppercase tracking-widest rounded-2xl">
                    <Link href="/products">Browse Categories</Link>
                  </Button>
                </div>
              </div>
           </div>
        </section>
      </main>

      <Footer />

      {/* MOBILE STICKY NAVIGATION */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-50 pointer-events-none">
         <nav className="w-full h-14 bg-midnight-ink/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl flex items-center justify-around px-6 pointer-events-auto">
            <Link href="/" className="text-white opacity-60 hover:opacity-100 transition-opacity"><Globe className="h-6 w-6" /></Link>
            <Link href="/products" className="text-white opacity-60 hover:opacity-100 transition-opacity"><Search className="h-6 w-6" /></Link>
            <Link href="/cart" className="text-white opacity-60 hover:opacity-100 transition-opacity relative">
              <ShoppingCart className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full text-[8px] font-black flex items-center justify-center">0</span>
            </Link>
            <Link href="/dashboard" className="text-white opacity-60 hover:opacity-100 transition-opacity"><Users className="h-6 w-6" /></Link>
         </nav>
      </div>
    </div>
  );
}
