"use client";

import { use, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { PromptOptimizer } from "@/components/store/PromptOptimizer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Star, Share2, Download, ShieldCheck, Clock, FileCode } from "lucide-react";
import Image from "next/image";
import { useDoc, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const db = useFirestore();
  
  const productRef = useMemo(() => (db ? doc(db, 'products', id) : null), [db, id]);
  const { data: product, loading } = useDoc(productRef);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 space-y-8">
          <Skeleton className="h-[400px] w-full rounded-2xl" />
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
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            <div className="lg:col-span-8 space-y-12">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border bg-muted">
                <Image 
                  src={product.images?.[0] || 'https://picsum.photos/seed/placeholder/1200/600'} 
                  alt={product.name} 
                  fill 
                  className="object-cover" 
                  priority
                />
                <Badge className="absolute left-6 top-6 bg-primary px-3 py-1">Featured Product</Badge>
              </div>

              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                  <Badge variant="secondary">{product.categorySlug || 'Digital Asset'}</Badge>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-bold text-foreground">4.9</span>
                    <span className="text-muted-foreground text-sm">({product.salesCount || 0} sales)</span>
                  </div>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold font-headline">{product.name}</h1>
                <div 
                  className="text-lg text-muted-foreground leading-relaxed max-w-3xl prose prose-invert"
                  dangerouslySetInnerHTML={{ __html: product.description || '' }}
                />
              </div>

              <Tabs defaultValue="optimizer" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                  <TabsTrigger value="optimizer" className="gap-2">
                    <FileCode className="h-4 w-4" />
                    Prompt Tester
                  </TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="license">License</TabsTrigger>
                </TabsList>
                
                <TabsContent value="optimizer">
                  <PromptOptimizer basePrompt={product.description || ''} />
                </TabsContent>
                
                <TabsContent value="details" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold font-headline">Tech Specs</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between border-b py-2">
                          <span className="text-muted-foreground">Format</span>
                          <span>{product.fileFormat || 'PDF'}</span>
                        </div>
                        <div className="flex justify-between border-b py-2">
                          <span className="text-muted-foreground">Size</span>
                          <span>{(product.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        <div className="flex justify-between border-b py-2">
                          <span className="text-muted-foreground">Version</span>
                          <span>{product.fileVersion || '1.0'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="license">
                  <Card className="p-6 bg-secondary/30">
                    <h3 className="text-lg font-bold mb-4">Standard Digital License</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      You can use this asset for unlimited personal and commercial projects. You may not resell or redistribute the source files in their original form.
                    </p>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <div className="lg:col-span-4">
              <div className="sticky top-28 space-y-6">
                <Card className="p-8 border-primary/20 shadow-2xl shadow-primary/5">
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-muted-foreground font-medium">Single License</span>
                    <span className="text-3xl font-bold font-headline text-accent">
                      ₹{(product.price / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 text-sm">
                      <ShieldCheck className="h-5 w-5 text-green-500" />
                      <span>Secure Payment via Razorpay</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="h-5 w-5 text-primary" />
                      <span>Instant Email Delivery</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Download className="h-5 w-5 text-primary" />
                      <span>Lifetime Access to Downloads</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button size="lg" className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20">
                      Buy Now
                    </Button>
                    <Button size="lg" variant="secondary" className="w-full h-14 text-lg font-bold">
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Add to Cart
                    </Button>
                  </div>

                  <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground uppercase tracking-widest">
                    <Share2 className="h-3 w-3" />
                    Share this product
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
