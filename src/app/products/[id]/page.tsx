
"use client";

import { use, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { PromptOptimizer } from "@/components/store/PromptOptimizer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Star, Share2, Download, ShieldCheck, Clock, FileCode, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { useDoc, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Footer } from "@/components/layout/Footer";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const db = useFirestore();
  
  const productRef = useMemo(() => (db ? doc(db, 'products', id) : null), [db, id]);
  const { data: product, loading } = useDoc(productRef);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="container mx-auto px-4 py-12 space-y-8 flex-1">
          <Skeleton className="aspect-[4/5] md:aspect-video w-full rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
            <div className="lg:col-span-4">
              <Skeleton className="h-[500px] w-full rounded-2xl" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
      </div>
    );
  }

  // Schema.org Structured Data
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.name,
    'image': product.images?.[0] || '',
    'description': product.shortDescription || product.description,
    'brand': {
      '@type': 'Brand',
      'name': 'Prontly'
    },
    'offers': {
      '@type': 'Offer',
      'url': `https://store.prontly.in/products/${id}`,
      'priceCurrency': 'INR',
      'price': (product.price / 100).toFixed(2),
      'availability': product.isPublished ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        
        <main className="container mx-auto px-4 py-12 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            <div className="lg:col-span-8 space-y-12">
              <div className="relative aspect-[4/5] md:aspect-video w-full overflow-hidden rounded-3xl border border-white/5 bg-muted shadow-2xl">
                <Image 
                  src={product.images?.[0] || 'https://picsum.photos/seed/placeholder/1200/1500'} 
                  alt={product.name} 
                  fill 
                  className="object-cover" 
                  priority
                />
                <Badge className="absolute left-6 top-6 bg-primary/90 backdrop-blur-md px-4 py-1.5 border-none shadow-lg">Featured Asset</Badge>
              </div>

              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {product.images.slice(1).map((img: string, idx: number) => (
                    <div key={idx} className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/5 bg-muted">
                      <Image src={img} alt={`${product.name} gallery ${idx}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                  <Badge variant="secondary" className="bg-secondary/50 text-primary border-primary/20 px-3 py-1">{product.categorySlug || 'Digital Asset'}</Badge>
                  <div className="flex items-center gap-1.5 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-bold text-foreground">4.9</span>
                    <span className="text-muted-foreground text-sm">({product.salesCount || 0} sales)</span>
                  </div>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold font-headline leading-tight">{product.name}</h1>
                <div 
                  className="text-lg text-muted-foreground leading-relaxed max-w-3xl prose prose-invert prose-p:mb-4"
                  dangerouslySetInnerHTML={{ __html: product.description || '' }}
                />
              </div>

              <Tabs defaultValue="optimizer" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/30 p-1 rounded-xl">
                  <TabsTrigger value="optimizer" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                    <FileCode className="h-4 w-4" />
                    Prompt Tester
                  </TabsTrigger>
                  <TabsTrigger value="details" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Technical Specs</TabsTrigger>
                  <TabsTrigger value="license" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all">License</TabsTrigger>
                </TabsList>
                
                <TabsContent value="optimizer" className="animate-in fade-in duration-500">
                  <PromptOptimizer basePrompt={product.description || ''} />
                </TabsContent>
                
                <TabsContent value="details" className="space-y-6 animate-in fade-in duration-500">
                  <Card className="p-8 bg-card/50 border-white/5 rounded-3xl">
                    <h3 className="text-2xl font-bold font-headline mb-6">Technical Specifications</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                      {[
                        { label: 'Format', value: product.fileFormat || 'PDF/ZIP' },
                        { label: 'Size', value: `${(product.fileSize / 1024 / 1024).toFixed(2)} MB` },
                        { label: 'Version', value: product.fileVersion || '1.0' },
                        { label: 'Compatibility', value: 'Any AI Model' },
                      ].map((spec) => (
                        <div key={spec.label} className="flex justify-between items-center py-3 border-b border-white/5">
                          <span className="text-muted-foreground font-medium">{spec.label}</span>
                          <span className="font-bold">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="license" className="animate-in fade-in duration-500">
                  <Card className="p-8 bg-primary/5 border-primary/20 rounded-3xl">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold">Standard Creator License</h3>
                    </div>
                    <ul className="space-y-4">
                      {[
                        'Lifetime access to original and updated source files',
                        'Unlimited usage in personal and commercial client projects',
                        'Modify and adapt the asset for your specific workflow',
                        'No redistribution or resale of the original source files'
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-muted-foreground">
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <div className="lg:col-span-4">
              <div className="sticky top-28 space-y-6">
                <Card className="p-8 border-white/5 bg-card/30 backdrop-blur-xl rounded-[2.5rem] shadow-2xl">
                  <div className="flex items-baseline justify-between mb-8">
                    <span className="text-muted-foreground font-medium">Digital License</span>
                    <div className="text-right">
                      {product.compareAtPrice > 0 && (
                        <span className="text-sm text-muted-foreground line-through block">₹{(product.compareAtPrice / 100).toLocaleString('en-IN')}</span>
                      )}
                      <span className="text-4xl font-bold font-headline text-accent">
                        ₹{(product.price / 100).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-5 mb-8">
                    {[
                      { icon: ShieldCheck, text: 'Verified Secure Payment', color: 'text-green-500' },
                      { icon: Clock, text: 'Instant Digital Delivery', color: 'text-primary' },
                      { icon: Download, text: 'Lifetime Future Updates', color: 'text-primary' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-4 text-sm font-medium">
                        <div className={`p-2 rounded-lg bg-background/50 border border-white/5 ${item.color}`}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <Button size="lg" className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                      Unlock Now
                    </Button>
                    <Button size="lg" variant="secondary" className="w-full h-14 rounded-2xl text-lg font-bold border-white/5 hover:bg-white/10 transition-all">
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Add to Cart
                    </Button>
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center justify-center gap-4">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Spread the word</p>
                    <div className="flex gap-4">
                      <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-primary hover:text-white transition-all"><Share2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </Card>

                <div className="bg-muted/20 rounded-3xl p-6 border border-dashed border-muted-foreground/20 text-center">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Need help with this purchase? <br />
                    <button className="text-primary font-bold hover:underline">Chat with our support team</button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
