
"use client";

import { use } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { PromptOptimizer } from "@/components/store/PromptOptimizer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Star, Share2, Download, ShieldCheck, Clock, FileCode } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  // Mock data for demonstration
  const product = {
    title: "Master AI Copywriting Prompt Pack",
    price: "₹1,499",
    category: "AI Prompts",
    rating: 4.9,
    reviews: 124,
    description: "Unlock the full potential of large language models with this comprehensive set of 50+ hand-crafted copywriting prompts. Specifically optimized for conversion-focused marketing, SEO articles, and social media storytelling.",
    basePrompt: "Act as a senior conversion copywriter. Write a compelling product description for a digital product called {product_name} that targets {target_audience}. Focus on the unique value proposition and use a persuasive tone.",
    features: [
      "50+ Modular Prompts",
      "Compatible with GPT-4, Claude 3, & Gemini",
      "PDF Integration Guide Included",
      "Lifetime Updates",
      "Commercial License"
    ]
  };

  const mainImage = PlaceHolderImages.find(img => img.id === "product-1")?.imageUrl || "";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Product Info & Optimizer */}
          <div className="lg:col-span-8 space-y-12">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border bg-muted">
              <Image 
                src={mainImage} 
                alt={product.title} 
                fill 
                className="object-cover" 
                priority
                data-ai-hint="product hero"
              />
              <Badge className="absolute left-6 top-6 bg-primary px-3 py-1">Featured Product</Badge>
            </div>

            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                <Badge variant="secondary">{product.category}</Badge>
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="font-bold text-foreground">{product.rating}</span>
                  <span className="text-muted-foreground text-sm">({product.reviews} reviews)</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold font-headline">{product.title}</h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
                {product.description}
              </p>
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
                <PromptOptimizer basePrompt={product.basePrompt} />
              </TabsContent>
              
              <TabsContent value="details" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold font-headline">What's Included</h3>
                    <ul className="space-y-3">
                      {product.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-3 text-muted-foreground">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold font-headline">Tech Specs</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between border-b py-2">
                        <span className="text-muted-foreground">Format</span>
                        <span>PDF, Markdown, Notion</span>
                      </div>
                      <div className="flex justify-between border-b py-2">
                        <span className="text-muted-foreground">Size</span>
                        <span>4.2 MB</span>
                      </div>
                      <div className="flex justify-between border-b py-2">
                        <span className="text-muted-foreground">Released</span>
                        <span>May 2024</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="license">
                <Card className="p-6 bg-secondary/30">
                  <h3 className="text-lg font-bold mb-4">Standard Digital License</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    You can use this asset for unlimited personal and commercial projects. You may not resell or redistribute the source files in their original form. For full terms, visit our license page.
                  </p>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column: Pricing & Sticky Checkout */}
          <div className="lg:col-span-4">
            <div className="sticky top-28 space-y-6">
              <Card className="p-8 border-primary/20 shadow-2xl shadow-primary/5">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-muted-foreground font-medium">Single License</span>
                  <span className="text-3xl font-bold font-headline text-accent">{product.price}</span>
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

              <Card className="p-6 bg-secondary/20">
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  Creator Profile
                </h4>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 overflow-hidden relative border">
                    <Image src="https://picsum.photos/seed/creator1/100/100" alt="Creator" fill className="object-cover" />
                  </div>
                  <div>
                    <span className="font-bold block">Prontly Labs</span>
                    <span className="text-xs text-muted-foreground">Top-rated Creator</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Crown({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}
