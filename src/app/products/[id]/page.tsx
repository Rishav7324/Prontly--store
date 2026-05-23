
"use client";

import { use, useMemo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { ReviewSystem } from "@/components/store/ReviewSystem";
import { ProductGrid } from "@/components/store/ProductGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShoppingCart, 
  Star, 
  Share2, 
  Download, 
  ShieldCheck, 
  Clock, 
  FileCode, 
  CheckCircle2, 
  Heart, 
  MessageSquare, 
  ArrowRight,
  ChevronRight
} from "lucide-react";
import Image from "next/image";
import { useDoc, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where, limit } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Footer } from "@/components/layout/Footer";
import { analytics } from "@/lib/analytics";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";

/**
 * --- SUB-COMPONENT: Product Header ---
 */
function ProductHeader({ product, isWishlisted, onToggleWishlist }: { product: any; isWishlisted: boolean; onToggleWishlist: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="bg-secondary/50 text-primary border-primary/20 px-3 py-1 uppercase font-bold text-[10px] tracking-widest">
            {product.categorySlug || 'Digital Asset'}
          </Badge>
          <div className="flex items-center gap-1.5 text-yellow-500">
            <Star className="h-4 w-4 fill-current" />
            <span className="font-bold text-foreground">{product.averageRating || '5.0'}</span>
            <span className="text-muted-foreground text-sm">({product.salesCount || 0} sales)</span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggleWishlist}
          className={cn("rounded-full h-12 w-12 border border-white/5 bg-white/5", isWishlisted ? "text-red-500 fill-current" : "text-muted-foreground")}
        >
          <Heart className={cn("h-6 w-6", isWishlisted && "fill-current")} />
        </Button>
      </div>
      <h1 className="text-4xl md:text-6xl font-bold font-headline leading-tight">{product.name}</h1>
      <p className="text-xl text-muted-foreground leading-relaxed">{product.shortDescription}</p>
    </div>
  );
}

/**
 * --- SUB-COMPONENT: Technical Tabs ---
 */
function TechnicalTabs({ product }: { product: any }) {
  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/30 p-1 rounded-2xl">
        <TabsTrigger value="details" className="rounded-xl transition-all">Technical Specs</TabsTrigger>
        <TabsTrigger value="license" className="rounded-xl transition-all">Usage License</TabsTrigger>
      </TabsList>
      
      <TabsContent value="details" className="space-y-6 animate-in fade-in duration-500">
        <Card className="p-8 bg-card/50 border-white/5 rounded-[2rem]">
          <h3 className="text-2xl font-bold font-headline mb-6 text-foreground">Specifications</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
            {[
              { label: 'Format', value: product.fileFormat || 'PDF/ZIP' },
              { label: 'Size', value: product.fileSize ? `${(product.fileSize / 1024 / 1024).toFixed(2)} MB` : 'N/A' },
              { label: 'Version', value: product.fileVersion || '1.0' },
              { label: 'Delivery', value: 'Instant Download' },
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
        <Card className="p-8 bg-primary/5 border-primary/20 rounded-[2rem]">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-2xl font-bold">Creator License</h3>
          </div>
          <ul className="space-y-4">
            {[
              'Unlimited usage in personal and client projects',
              'Perpetual access to all future updates',
              'Modify files to fit your specific workflow',
              'No redistribution or resale permitted'
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
  );
}

/**
 * --- SUB-COMPONENT: Purchase Sidebar ---
 */
function PurchaseSidebar({ 
  product, 
  onBuyNow, 
  onAddToCart 
}: { 
  product: any; 
  onBuyNow: () => void; 
  onAddToCart: () => void;
}) {
  return (
    <div className="sticky top-28 space-y-6">
      <Card className="p-8 border-white/5 bg-card/30 backdrop-blur-xl rounded-[2.5rem] shadow-2xl">
        <div className="flex items-baseline justify-between mb-8">
          <span className="text-muted-foreground font-medium text-sm">One-time Investment</span>
          <div className="text-right">
            {product.compareAtPrice > product.price && (
              <span className="text-sm text-muted-foreground line-through block opacity-60">₹{(product.compareAtPrice / 100).toLocaleString('en-IN')}</span>
            )}
            <span className="text-4xl font-bold font-headline text-accent">
              ₹{(product.price / 100).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
        
        <div className="space-y-5 mb-8">
          {[
            { icon: ShieldCheck, text: 'Secure Razorpay Payment', color: 'text-green-500' },
            { icon: Clock, text: 'Instant Asset Unlock', color: 'text-primary' },
            { icon: Download, text: 'Global R2 Source Files', color: 'text-primary' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 text-xs font-medium">
              <div className={`p-2 rounded-lg bg-background/50 border border-white/5 ${item.color}`}>
                <item.icon className="h-4 w-4" />
              </div>
              <span className="text-muted-foreground">{item.text}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <Button 
            size="lg" 
            className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            onClick={onBuyNow}
          >
            Buy Now
          </Button>
          <Button 
            size="lg" 
            variant="secondary" 
            className="w-full h-14 rounded-2xl text-lg font-bold border-white/5 hover:bg-white/10 transition-all"
            onClick={onAddToCart}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            Add to Cart
          </Button>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center justify-center gap-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Secure Branded Checkout</p>
          <div className="flex gap-4">
            <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-primary hover:text-white transition-all"><Share2 className="h-4 w-4" /></Button>
          </div>
        </div>
      </Card>

      <div className="bg-muted/10 rounded-3xl p-6 border border-dashed border-muted-foreground/20 text-center">
        <p className="text-xs text-muted-foreground leading-relaxed italic">
          Enterprise license needed? <br />
          <Link href="/contact" className="text-primary font-bold hover:underline not-italic">Contact our sales team</Link>
        </p>
      </div>
    </div>
  );
}

/**
 * --- MAIN PAGE COMPONENT ---
 */
export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const db = useFirestore();
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const productRef = useMemoFirebase(() => (db ? doc(db, 'products', id) : null), [db, id]);
  const { data: product, loading } = useDoc(productRef);

  const suggestedQuery = useMemoFirebase(() => {
    if (!db || !product?.categorySlug) return null;
    return query(
      collection(db, 'products'),
      where('categorySlug', '==', product.categorySlug),
      limit(5)
    );
  }, [db, product?.categorySlug]);

  const { data: rawSuggested } = useCollection(suggestedQuery);
  
  const suggestedProducts = useMemo(() => {
    return rawSuggested?.filter(p => p.id !== id).slice(0, 4) || [];
  }, [rawSuggested, id]);

  useEffect(() => {
    if (product) {
      analytics.viewProduct(product);
    }
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.images?.[0] || '',
      category: product.categorySlug || 'Digital Asset'
    });
    analytics.addToCart(product);
    toast({ title: "Added to cart", description: `${product.name} is ready for checkout.` });
  };

  const handleBuyNow = () => {
    if (!product) return;
    // Add to cart first
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.images?.[0] || '',
      category: product.categorySlug || 'Digital Asset'
    });
    analytics.addToCart(product);
    // Then navigate to checkout immediately
    router.push('/checkout');
  };

  const isWishlisted = mounted ? isInWishlist(id) : false;

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
              <Skeleton className="h-[200px] w-full" />
            </div>
            <div className="lg:col-span-4">
              <Skeleton className="h-[400px] w-full rounded-2xl" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold font-headline">Product not found</h1>
          <Button asChild className="mt-4"><Link href="/products">Back to Store</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 flex-1">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-8">
          <Link href="/products" className="hover:text-primary transition-colors">Marketplace</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-24">
          {/* Main Visuals & Content */}
          <div className="lg:col-span-8 space-y-12">
            <div className="relative aspect-[4/5] md:aspect-video w-full overflow-hidden rounded-[2.5rem] border border-white/5 bg-muted shadow-2xl">
              <Image 
                src={product.images?.[0] || 'https://picsum.photos/seed/placeholder/1200/1500'} 
                alt={product.name} 
                fill 
                className="object-cover" 
                priority
              />
              <Badge className="absolute left-6 top-6 bg-primary/90 backdrop-blur-md px-4 py-1.5 border-none shadow-lg font-bold text-[10px] uppercase">Premium Asset</Badge>
            </div>

            <ProductHeader 
              product={product} 
              isWishlisted={isWishlisted} 
              onToggleWishlist={() => toggleItem(id)} 
            />

            <div className="space-y-6">
              <div 
                className="prose-content"
                dangerouslySetInnerHTML={{ __html: product.description || '' }}
              />

              <div className="flex flex-wrap gap-2 pt-4">
                {product.tags?.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="bg-white/5 border-white/5 text-muted-foreground rounded-full px-4 py-1 text-[10px] font-bold">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>

            <TechnicalTabs product={product} />
          </div>

          {/* Pricing & CTA Sidebar */}
          <div className="lg:col-span-4">
            <PurchaseSidebar 
              product={product} 
              onBuyNow={handleBuyNow}
              onAddToCart={handleAddToCart} 
            />
          </div>
        </div>

        {/* FULL WIDTH: Review System (Shifted after Buy Now) */}
        <section className="py-24 border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <ReviewSystem productId={id} productName={product.name} />
          </div>
        </section>

        {/* FULL WIDTH: Suggested Products */}
        {suggestedProducts.length > 0 && (
          <section className="space-y-10 border-t border-white/5 pt-20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold font-headline">Other Premium Assets</h2>
                <p className="text-muted-foreground mt-1">Recommended items from our collection.</p>
              </div>
              <Button variant="ghost" asChild className="text-primary hover:text-accent font-bold gap-2">
                <Link href={`/products?category=${product.categorySlug}`}>
                  View Category <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <ProductGrid products={suggestedProducts} />
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
