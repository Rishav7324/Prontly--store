
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { ProductCard } from "@/components/store/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Zap, Rocket, Shield, Crown, Search } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Link from "next/link";

const featuredProducts = [
  {
    id: "1",
    title: "Master AI Copywriting Prompt Pack",
    price: "₹1,499",
    category: "AI Prompts",
    imageUrl: PlaceHolderImages.find(img => img.id === "product-1")?.imageUrl || "",
    rating: 4.9,
    sales: "1.2k"
  },
  {
    id: "2",
    title: "SaaS Starter UI Dashboard Kit",
    price: "₹3,999",
    category: "Templates",
    imageUrl: PlaceHolderImages.find(img => img.id === "product-2")?.imageUrl || "",
    rating: 4.8,
    sales: "850"
  },
  {
    id: "3",
    title: "Ultimate SEO & Growth Guide 2024",
    price: "₹999",
    category: "E-Books",
    imageUrl: PlaceHolderImages.find(img => img.id === "product-3")?.imageUrl || "",
    rating: 5.0,
    sales: "2.5k"
  },
  {
    id: "4",
    title: "Clean Architecture React Template",
    price: "₹2,499",
    category: "Code",
    imageUrl: PlaceHolderImages.find(img => img.id === "product-4")?.imageUrl || "",
    rating: 4.7,
    sales: "420"
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_120%,rgba(85,78,210,0.15),rgba(15,15,19,1))]" />
        <div className="container mx-auto px-4 text-center">
          <Badge variant="outline" className="mb-6 border-primary/50 text-primary py-1 px-4 text-sm font-medium animate-bounce">
            New: GPT-4o Optimized Prompts Now Available!
          </Badge>
          <h1 className="mx-auto max-w-4xl font-headline text-5xl font-bold tracking-tight md:text-7xl">
            Empower Your Workflow with <br />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Premium Digital Assets</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
            The curated marketplace for AI prompts, UI kits, templates, and guides built for creators who value precision and speed.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="h-12 px-8 text-base shadow-xl shadow-primary/20">
              Start Browsing
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base">
              Explore AI Prompts
            </Button>
          </div>

          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <span className="font-semibold">Secure Delivery</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <span className="font-semibold">Instant Access</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <span className="font-semibold">Premium Quality</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <span className="font-semibold">Optimized for Pro</span>
            </div>
          </div>
        </div>
      </section>

      {/* Product Discovery Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-bold font-headline">Trending Assets</h2>
            <p className="text-muted-foreground mt-1">Handpicked digital products gaining traction this week.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">All</Button>
            <Button variant="ghost" size="sm">AI Prompts</Button>
            <Button variant="ghost" size="sm">UI Kits</Button>
            <Button variant="ghost" size="sm">Templates</Button>
          </div>
        </div>

        <div className="bento-grid">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>

        <div className="mt-16 text-center">
          <Button variant="link" size="lg" className="text-primary hover:text-accent font-semibold group">
            View All Marketplace Items
            <Search className="ml-2 h-4 w-4 transition-transform group-hover:scale-110" />
          </Button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="rounded-3xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-white/5 p-12 text-center overflow-hidden relative">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <h2 className="text-3xl md:text-5xl font-bold font-headline mb-6">Want to sell your digital assets?</h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
            Join 5,000+ creators earning passive income on Prontly. We handle hosting, payments, and global taxes for you.
          </p>
          <Button size="lg" className="h-14 px-10 text-lg bg-accent text-accent-foreground hover:bg-accent/90">
            Apply as Creator
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-20 bg-muted/20">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <Zap className="h-6 w-6 text-primary" fill="currentColor" />
              <span className="font-headline text-2xl font-bold">PRONTLY</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Premium digital storefront for the modern creator. Quality assets, secure delivery, global reach.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6">Marketplace</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-primary transition-colors">AI Prompts</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">UI Dashboards</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Mobile Kits</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Notion Templates</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Support</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Refund Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Newsletter</h4>
            <p className="text-sm text-muted-foreground mb-4">Get notified about free weekly assets.</p>
            <div className="flex gap-2">
              <Input placeholder="email@example.com" className="bg-background border-none" />
              <Button>Join</Button>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-20 pt-8 border-t text-center text-sm text-muted-foreground">
          © 2026 Prontly Store. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
