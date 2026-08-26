"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ReviewSystem } from "@/components/store/ReviewSystem";
import { ProductGrid } from "@/components/store/ProductGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  Star, 
  Share2, 
  ShieldCheck, 
  Clock, 
  Heart, 
  ArrowRight,
  ChevronRight,
  Info,
  Copy,
  Check,
  Twitter,
  Layers,
  ArrowLeft,
  Loader2,
  Zap,
  Plus,
  Minus,
  MessageSquare
} from "lucide-react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { analytics } from "@/lib/analytics";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Navbar } from "../layout/Navbar";
import { Footer } from "../layout/Footer";

const ProductShare = ({ product }: { product: any }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link Copied", description: "The asset path is now in your clipboard." });
  };

  const handleShare = (platform: string) => {
    let url = '';
    const text = `Take a look at the ${product.name} on Prontly. Perfect for professional workflows.`;
    
    switch (platform) {
      case 'x':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'whatsapp':
        url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + shareUrl)}`;
        break;
    }
    
    if (url) window.open(url, '_blank');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 rounded-lg px-3 gap-2 text-xs font-medium hover:bg-muted">
          <Share2 className="h-3.5 w-3.5" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-xl p-4">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg md:text-xl font-semibold">Distribute Intelligence</DialogTitle>
          <DialogDescription className="text-xs">Synchronize this professional tool with your creative network.</DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
           <div className="flex items-center gap-2 p-1 bg-muted/40 rounded-lg border border-border/60">
              <Input
                readOnly
                defaultValue={shareUrl}
                className="h-8 bg-transparent border-none focus-visible:ring-0 font-mono text-[10px] px-2"
              />
              <Button size="sm" className="h-8 rounded-lg gap-1.5 font-medium" onClick={handleCopy}>
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
           </div>

           <div className="grid grid-cols-2 gap-2">
             <Button variant="outline" size="sm" className="h-9 rounded-lg gap-2 text-xs font-medium hover:text-blue-600 hover:border-blue-200" onClick={() => handleShare('x')}>
               <Twitter className="h-3.5 w-3.5" /> X.com
             </Button>
             <Button variant="outline" size="sm" className="h-9 rounded-lg gap-2 text-xs font-medium hover:text-green-600 hover:border-green-200" onClick={() => handleShare('whatsapp')}>
               <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
             </Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ProductBreadcrumbs = ({ category, name }: { category: string, name: string }) => (
  <nav className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground mb-4 overflow-hidden whitespace-nowrap">
    <Link href="/products" className="hover:text-primary transition-colors shrink-0">Catalog</Link>
    <ChevronRight className="h-2.5 w-2.5 shrink-0 opacity-50" />
    <Link href={`/products?category=${category}`} className="hover:text-primary transition-colors shrink-0">{category}</Link>
    <ChevronRight className="h-2.5 w-2.5 shrink-0 opacity-50" />
    <span className="text-foreground truncate max-w-[180px]">{name}</span>
  </nav>
);

export function ProductDetailClient({ product: hydratedProduct }: { product: any }) {
  const router = useRouter();
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const [mounted, setMounted] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>(hydratedProduct.images?.[0] || '');
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  // Live product refresh — fetch full record by id once (Neon via API)
  const [liveProduct, setLiveProduct] = useState<any>(null);
  const [liveLoading, setLiveLoading] = useState(false);

  useEffect(() => {
    if (!hydratedProduct?.id) return;
    let cancelled = false;
    setLiveLoading(true);
    fetch(`/api/products/${hydratedProduct.id}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled || !json?.success || !json.data) return;
        const row = json.data;
        // averageRating is stored on a 0–50 scale server-side; normalize to 0–5
        const merged = {
          ...hydratedProduct,
          ...row,
          averageRating:
            typeof row.averageRating === 'number'
              ? Math.round(row.averageRating) / 10
              : hydratedProduct.averageRating,
        };
        setLiveProduct(merged);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLiveLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hydratedProduct]);

  const product = liveProduct || hydratedProduct;

  useEffect(() => { 
    setMounted(true); 
    if (product) analytics.viewProduct(product);
  }, [product]);

  // Suggested products — same category, exclude current, max 4
  const { data: rawSuggested } = useQuery({
    queryKey: ['products', 'suggested', product?.categorySlug],
    queryFn: async () => {
      const res = await fetch('/api/products');
      const json = await res.json();
      return json?.success ? json.data : [];
    },
    enabled: !!product?.categorySlug,
  });

  const suggestedProducts =
    (rawSuggested || [])
      .filter((p: any) => p.categorySlug === product.categorySlug && p.id !== product.id)
      .slice(0, 4) || [];

  const handleAddToCart = () => {
    addItem({ id: product.id, name: product.name, price: product.price, imageUrl: product.images?.[0] || '', category: product.categorySlug || 'Asset' });
    toast({ title: "Added to cart", description: `${product.name} is ready for checkout.` });
  };

  const handleBuyNow = () => {
    addItem({ id: product.id, name: product.name, price: product.price, imageUrl: product.images?.[0] || '', category: product.categorySlug || 'Asset' });
    router.push('/checkout');
  };

  const isWishlisted = mounted ? isInWishlist(product.id) : false;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 pt-16 md:pt-20 pb-10 flex-1 max-w-6xl overflow-x-hidden min-w-0">
        <ProductBreadcrumbs category={product.categorySlug} name={product.name} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          {/* Visual Showcase */}
          <div className="lg:col-span-7 space-y-3">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm group">
              <Image 
                src={selectedImage || 'https://picsum.photos/seed/placeholder/1200/800'} 
                alt={product.name} 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-105" 
                priority
              />
              <div className="absolute top-3 left-3">
                 <Badge className="bg-white/80 backdrop-blur-md text-midnight-ink border-none px-2 py-0.5 rounded-full text-[10px] font-medium shadow-sm">
                   {product.categorySlug}
                 </Badge>
              </div>
            </div>
            
            {product.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar snap-x">
                {product.images.map((img: string, i: number) => (
                  <button 
                    key={i} 
                    onClick={() => setSelectedImage(img)}
                    className={cn(
                      "relative h-14 w-18 min-w-14 rounded-lg border transition-all shrink-0 overflow-hidden snap-start",
                      selectedImage === img ? "border-primary ring-2 ring-primary/20" : "border-border/60 opacity-70 hover:opacity-100"
                    )}
                  >
                    <Image src={img} alt={`${product.name} thumbnail ${i + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Configuration Panel */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-5">
              <div className="space-y-4">
                <div>
                  <h1 className="text-lg md:text-xl font-semibold leading-snug break-words">
                    {product.name}
                  </h1>
                  <div className="flex items-center gap-3 mt-2.5 py-2.5 border-y border-border/60 text-xs">
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="h-3 w-3 fill-current" />
                      <span className="font-semibold">{product.averageRating || '5.0'}</span>
                      <span className="text-muted-foreground ml-0.5">({product.reviewCount || 0})</span>
                    </div>
                    <div className="h-3 w-px bg-border/60" />
                    <div className="flex items-center gap-1 text-primary">
                      <Layers className="h-3 w-3" />
                      <span className="font-semibold">{product.salesCount || 0}</span>
                      <span className="text-muted-foreground ml-0.5">Sales</span>
                    </div>
                    {liveLoading && <Loader2 className="ml-auto h-3 w-3 animate-spin text-primary opacity-30" />}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-xl md:text-2xl font-semibold tracking-tight">
                      ₹{(product.price / 100).toLocaleString('en-IN')}
                    </span>
                    {product.compareAtPrice > product.price && (
                      <span className="text-xs text-muted-foreground line-through decoration-rose-500/40">
                        ₹{(product.compareAtPrice / 100).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {product.shortDescription || "Unlock premium asset specifications with perpetual licensing. Verified for professional creative performance."}
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <Button 
                    size="sm" 
                    className="w-full h-9 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-sm font-medium active:scale-[0.98] transition-all"
                    onClick={handleBuyNow}
                  >
                    Buy Now
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-9 rounded-lg text-xs font-medium"
                      onClick={handleAddToCart}
                    >
                      <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
                      Add to Cart
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-9 rounded-lg text-xs font-medium",
                        isWishlisted ? "text-rose-500 bg-rose-50/60 border-rose-200" : ""
                      )}
                      onClick={() => toggleItem(product.id)}
                    >
                      <Heart className={cn("mr-1.5 h-3.5 w-3.5", isWishlisted && "fill-current")} />
                      {isWishlisted ? "Saved" : "Wishlist"}
                    </Button>
                  </div>
                </div>

                {/* Compact Expandable Description */}
                <div className="pt-5 space-y-2 border-t border-border/60">
                  <h2 className="text-[10px] font-medium text-muted-foreground flex items-center gap-1.5">
                    <Info className="h-3 w-3 text-primary" />
                    Specifications
                  </h2>
                  
                  <div className="relative">
                    <div 
                      className={cn(
                        "prose-content text-xs leading-relaxed overflow-hidden transition-all duration-500",
                        isDescExpanded ? "max-h-[5000px]" : "max-h-[120px]"
                      )}
                      dangerouslySetInnerHTML={{ __html: product.description || '' }} 
                    />
                    
                    {!isDescExpanded && (
                      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                    )}
                  </div>

                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    className="w-full h-8 rounded-lg gap-1.5 text-xs font-medium text-primary hover:bg-primary/5"
                  >
                    {isDescExpanded ? (
                      <><Minus className="h-3 w-3" /> Show Less</>
                    ) : (
                      <><Plus className="h-3 w-3" /> Reveal Full Specs</>
                    )}
                  </Button>
                </div>

                <div className="pt-4 space-y-3 border-t border-border/60">
                   <div className="flex items-center justify-between">
                     <h3 className="text-[10px] font-medium text-muted-foreground">Metadata</h3>
                     <ProductShare product={product} />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-2">
                     {[
                       { label: 'Format', val: product.fileFormat || 'SOURCE', icon: Layers },
                       { label: 'Version', val: product.fileVersion || '1.0', icon: Zap },
                       { label: 'License', val: 'Perpetual', icon: ShieldCheck },
                       { label: 'Delivery', val: 'Instant', icon: Clock },
                     ].map((item, i) => (
                       <div key={i} className="p-2.5 rounded-lg border border-border/60 bg-muted/30 flex items-start gap-2 hover:bg-card hover:border-primary/25 transition-colors">
                         <item.icon className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                         <div className="min-w-0">
                           <p className="text-[10px] font-medium text-muted-foreground">{item.label}</p>
                           <p className="text-xs font-semibold truncate">{item.val}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="py-10 border-t border-border/60">
          <header className="mb-6 flex items-end justify-between">
             <h2 className="text-base md:text-lg font-semibold">Reviews</h2>
             <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 text-[10px] font-medium px-2 py-0.5 rounded-md">Community Feed</Badge>
          </header>
          <ReviewSystem productId={product.id} productName={product.name} />
        </section>

        {suggestedProducts.length > 0 && (
          <section className="space-y-6 border-t border-border/60 pt-10 pb-14">
            <div className="flex items-center justify-between">
              <h2 className="text-base md:text-lg font-semibold">More like this</h2>
              <Button variant="ghost" asChild size="sm" className="h-8 rounded-lg text-primary font-medium">
                <Link href="/products" className="flex items-center gap-1.5 text-xs">
                  Full Catalog <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
            <ProductGrid products={suggestedProducts} />
          </section>
        )}

        <div className="flex justify-center py-8 border-t border-border/60 mt-6">
          <Button variant="ghost" asChild size="sm" className="h-9 rounded-lg text-muted-foreground hover:text-primary">
            <Link href="/products" className="flex items-center gap-2 text-xs font-medium">
              <ArrowLeft className="h-3.5 w-3.5" /> Return to Catalog
            </Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
