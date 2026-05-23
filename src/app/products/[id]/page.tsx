
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
  CheckCircle2, 
  Heart, 
  ArrowRight,
  ChevronRight,
  Info,
  Loader2
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
 * --- SUB-COMPONENT: Breadcrumbs ---
 */
const ProductBreadcrumbs = ({ name }: { name: string }) => (
  <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-8">
    <Link href="/products" className="hover:text-primary transition-colors">Marketplace</Link>
    <ChevronRight className="h-3 w-3" />
    <span className="text-foreground">{name}</span>
  </nav>
);

/**
 * --- SUB-COMPONENT: Header ---
 */
const ProductHeader = ({ product, isWishlisted, onToggleWishlist }: any) => (
  <div className="space-y-4 mb-8">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 uppercase font-bold text-[10px] tracking-widest">
          {product.categorySlug || 'Digital Asset'}
        </Badge>
        <div className="flex items-center gap-1.5 text-yellow-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
          <Star className="h-3.5 w-3.5 fill-current" />
          <span className="font-bold text-foreground text-xs">{product.averageRating || '5.0'}</span>
          <span className="text-muted-foreground text-[10px] ml-1">({product.salesCount || 0} sales)</span>
        </div>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onToggleWishlist}
        className={cn("rounded-full h-10 w-10 border border-white/5 bg-white/5", isWishlisted ? "text-red-500 fill-current" : "text-muted-foreground")}
      >
        <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
      </Button>
    </div>
    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-headline leading-tight">{product.name}</h1>
  </div>
);

/**
 * --- SUB-COMPONENT: Visuals ---
 */
const ProductVisuals = ({ product }: { product: any }) => (
  <div className="relative aspect-[4/5] md:aspect-square w-full overflow-hidden rounded-[2.5rem] border border-white/5 bg-muted shadow-2xl">
    <Image 
      src={product.images?.[0] || 'https://picsum.photos/seed/placeholder/1200/1200'} 
      alt={product.name} 
      fill 
      className="object-cover" 
      priority
    />
    <Badge className="absolute left-6 top-6 bg-primary/90 backdrop-blur-md px-4 py-1.5 border-none shadow-lg font-bold text-[10px] uppercase">Premium Asset</Badge>
  </div>
);

/**
 * --- SUB-COMPONENT: Description ---
 */
const ProductDescription = ({ product }: { product: any }) => (
  <Card className="p-10 border-white/5 bg-card/30 rounded-[3rem] shadow-xl">
    <div className="flex items-center gap-3 mb-8">
      <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
        <Info className="h-5 w-5" />
      </div>
      <h2 className="text-2xl font-bold font-headline">Product Overview</h2>
    </div>
    <div 
      className="prose-content max-w-4xl"
      dangerouslySetInnerHTML={{ __html: product.description || '' }}
    />
    <div className="flex flex-wrap gap-2 mt-10 pt-10 border-t border-white/5">
      {product.tags?.map((tag: string) => (
        <Badge key={tag} variant="outline" className="bg-white/5 border-white/5 text-muted-foreground rounded-full px-4 py-1.5 text-[10px] font-bold">
          #{tag}
        </Badge>
      ))}
    </div>
  </Card>
);

/**
 * --- SUB-COMPONENT: Technical Tabs ---
 */
const TechnicalTabs = ({ product }: { product: any }) => (
  <Tabs defaultValue="details" className="w-full">
    <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/30 p-1 rounded-2xl">
      <TabsTrigger value="details" className="rounded-xl transition-all font-bold">Technical Specs</TabsTrigger>
      <TabsTrigger value="license" className="rounded-xl transition-all font-bold">Usage License</TabsTrigger>
    </TabsList>
    
    <TabsContent value="details" className="space-y-6">
      <Card className="p-8 bg-card/50 border-white/5 rounded-[2.5rem]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
          {[
            { label: 'Format', value: product.fileFormat || 'PDF/ZIP' },
            { label: 'Size', value: product.fileSize ? `${(product.fileSize / 1024 / 1024).toFixed(2)} MB` : 'N/A' },
            { label: 'Version', value: product.fileVersion || '1.0' },
            { label: 'Delivery', value: 'Instant Unlock' },
          ].map((spec) => (
            <div key={spec.label} className="flex justify-between items-center py-4 border-b border-white/5">
              <span className="text-muted-foreground font-medium text-sm">{spec.label}</span>
              <span className="font-bold text-sm">{spec.value}</span>
            </div>
          ))}
        </div>
      </Card>
    </TabsContent>

    <TabsContent value="license">
      <Card className="p-8 bg-primary/5 border-primary/20 rounded-[2.5rem]">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-bold">Creator Rights</h3>
        </div>
        <ul className="space-y-4">
          {[
            'Unlimited usage in personal projects',
            'Perpetual access to all source files',
            'Lifetime free technical updates',
            'Commercial license for client work included'
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-muted-foreground text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Card>
    </TabsContent>
  </Tabs>
);

/**
 * --- SUB-COMPONENT: Purchase Sidebar ---
 */
const PurchaseSidebar = ({ product, onBuyNow, onAddToCart }: any) => (
  <div className="sticky top-28 space-y-6">
    <Card className="p-8 border-white/5 bg-card/30 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <ShoppingCart className="h-32 w-32" />
      </div>
      <div className="relative z-10">
        <div className="mb-8">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">One-time Investment</p>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold font-headline text-accent">
              ₹{(product.price / 100).toLocaleString('en-IN')}
            </span>
            {product.compareAtPrice > product.price && (
              <span className="text-lg text-muted-foreground line-through opacity-40">₹{(product.compareAtPrice / 100).toLocaleString('en-IN')}</span>
            )}
          </div>
        </div>
        
        <div className="space-y-4 mb-10">
          {[
            { icon: ShieldCheck, text: 'Razorpay Verified', color: 'text-green-500' },
            { icon: Clock, text: 'Instant Delivery', color: 'text-primary' },
            { icon: Download, text: 'Perpetual Access', color: 'text-primary' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-tighter">
              <div className={cn("p-1.5 rounded-lg bg-white/5 border border-white/5", item.color)}>
                <item.icon className="h-3.5 w-3.5" />
              </div>
              <span className="text-muted-foreground/80">{item.text}</span>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <Button 
            size="lg" 
            className="w-full h-16 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            onClick={onBuyNow}
          >
            Buy Now
          </Button>
          <Button 
            size="lg" 
            variant="secondary" 
            className="w-full h-16 rounded-2xl text-lg font-bold border-white/5 hover:bg-white/10 transition-all"
            onClick={onAddToCart}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            Add to Cart
          </Button>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center justify-center gap-4">
          <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-black opacity-60">Secure Branded Ecosystem</p>
          <div className="flex gap-4">
            <Button variant="ghost" size="icon" className="rounded-full bg-white/5 h-10 w-10 hover:bg-primary hover:text-white transition-all"><Share2 className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </Card>

    <div className="bg-muted/10 rounded-3xl p-6 border border-dashed border-muted-foreground/20 text-center">
      <p className="text-xs text-muted-foreground leading-relaxed italic">
        Need assistance with this asset? <br />
        <Link href="/contact" className="text-primary font-bold hover:underline not-italic">Visit Help Center</Link>
      </p>
    </div>
  </div>
);

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

  useEffect(() => { setMounted(true); }, []);
  
  const productRef = useMemoFirebase(() => (db ? doc(db, 'products', id) : null), [db, id]);
  const { data: product, loading } = useDoc(productRef);

  const suggestedQuery = useMemoFirebase(() => {
    if (!db || !product?.categorySlug) return null;
    return query(collection(db, 'products'), where('categorySlug', '==', product.categorySlug), limit(5));
  }, [db, product?.categorySlug]);

  const { data: rawSuggested } = useCollection(suggestedQuery);
  const suggestedProducts = useMemo(() => rawSuggested?.filter(p => p.id !== id).slice(0, 4) || [], [rawSuggested, id]);

  useEffect(() => { if (product) analytics.viewProduct(product); }, [product]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({ id: product.id, name: product.name, price: product.price, imageUrl: product.images?.[0] || '', category: product.categorySlug || 'Asset' });
    toast({ title: "Added to cart", description: `${product.name} is ready for checkout.` });
  };

  const handleBuyNow = () => {
    if (!product) return;
    addItem({ id: product.id, name: product.name, price: product.price, imageUrl: product.images?.[0] || '', category: product.categorySlug || 'Asset' });
    router.push('/checkout');
  };

  const isWishlisted = mounted ? isInWishlist(id) : false;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="container mx-auto px-4 py-12 space-y-8 flex-1">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-6">
              <Skeleton className="h-[500px] w-full rounded-[2.5rem]" />
              <Skeleton className="h-16 w-3/4" />
            </div>
            <div className="lg:col-span-4">
              <Skeleton className="h-[450px] w-full rounded-[2.5rem]" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) return <div className="min-h-screen flex items-center justify-center font-headline text-3xl">Asset not found.</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 flex-1">
        <ProductBreadcrumbs name={product.name} />

        {/* TOP SECTION: Visuals + Action Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
          <div className="lg:col-span-8">
            <ProductHeader 
              product={product} 
              isWishlisted={isWishlisted} 
              onToggleWishlist={() => toggleItem(id)} 
            />
            <ProductVisuals product={product} />
          </div>

          <div className="lg:col-span-4">
            <PurchaseSidebar 
              product={product} 
              onBuyNow={handleBuyNow}
              onAddToCart={handleAddToCart} 
            />
          </div>
        </div>

        {/* FULL WIDTH: Description (Shifted after buttons) */}
        <section className="mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8">
              <ProductDescription product={product} />
            </div>
            <div className="lg:col-span-4">
              <TechnicalTabs product={product} />
            </div>
          </div>
        </section>

        {/* FULL WIDTH: Review System */}
        <section className="py-20 border-t border-white/5">
          <ReviewSystem productId={id} productName={product.name} />
        </section>

        {/* FULL WIDTH: Suggested Products */}
        {suggestedProducts.length > 0 && (
          <section className="space-y-10 border-t border-white/5 pt-20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold font-headline">Recommended Assets</h2>
                <p className="text-muted-foreground mt-1">Based on your current selection.</p>
              </div>
              <Button variant="ghost" asChild className="text-primary hover:text-accent font-bold gap-2">
                <Link href={`/products?category=${product.categorySlug}`}>
                  Explore Category <ArrowRight className="h-4 w-4" />
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
