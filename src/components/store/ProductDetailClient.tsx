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
  ExternalLink,
  ArrowLeft,
  Loader2,
  Zap,
  Plus,
  Minus
} from "lucide-react";
import Image from "next/image";
import { useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, limit, doc } from "firebase/firestore";
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
import { Label } from "@/components/ui/label";
import { Navbar } from "../layout/Navbar";
import { Footer } from "../layout/Footer";

const ProductShare = ({ product }: { product: any }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copied!", description: "Share it with your network." });
  };

  const handleShare = (platform: string) => {
    let url = '';
    const text = `Check out ${product.name} on Prontly Store!`;
    
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
        <Button variant="outline" size="sm" className="h-9 px-3 gap-2 border-stone-gray/20 text-slate-blue">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl border-stone-gray/10 bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-midnight-ink">Share Asset</DialogTitle>
          <DialogDescription className="text-slate-blue">Spread the word about this professional workflow tool.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 py-4">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">Link</Label>
            <Input
              id="link"
              defaultValue={shareUrl}
              readOnly
              className="h-10 bg-muted/30 border-none rounded-xl font-mono text-xs px-4"
            />
          </div>
          <Button type="submit" size="sm" className="px-3 h-10 rounded-xl bg-midnight-ink" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-stone-gray/10">
          <Button variant="outline" className="rounded-xl h-10 gap-2 flex-1 border-stone-gray/20 text-slate-blue" onClick={() => handleShare('x')}>
            <Twitter className="h-4 w-4" /> X.com
          </Button>
          <Button variant="outline" className="rounded-xl h-10 gap-2 flex-1 border-stone-gray/20 text-slate-blue" onClick={() => handleShare('whatsapp')}>
            <ExternalLink className="h-4 w-4" /> WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ProductBreadcrumbs = ({ category, name }: { category: string, name: string }) => (
  <nav className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.25em] text-ghost-gray mb-10 overflow-hidden whitespace-nowrap">
    <Link href="/products" className="hover:text-primary transition-colors shrink-0">Catalog</Link>
    <ChevronRight className="h-2.5 w-2.5 shrink-0 opacity-40" />
    <Link href={`/products?category=${category}`} className="hover:text-primary transition-colors shrink-0">{category}</Link>
    <ChevronRight className="h-2.5 w-2.5 shrink-0 opacity-40" />
    <span className="text-midnight-ink truncate max-w-[180px]">{name}</span>
  </nav>
);

export function ProductDetailClient({ product: hydratedProduct }: { product: any }) {
  const router = useRouter();
  const db = useFirestore();
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const [mounted, setMounted] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>(hydratedProduct.images?.[0] || '');
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  const productRef = useMemoFirebase(() => (db ? doc(db, 'products', hydratedProduct.id) : null), [db, hydratedProduct.id]);
  const { data: liveProduct, loading: liveLoading } = useDoc(productRef);

  const product = liveProduct || hydratedProduct;

  useEffect(() => { 
    setMounted(true); 
    if (product) analytics.viewProduct(product);
  }, [product]);

  const suggestedQuery = useMemoFirebase(() => {
    if (!db || !product?.categorySlug) return null;
    return query(collection(db, 'products'), where('categorySlug', '==', product.categorySlug), limit(5));
  }, [db, product?.categorySlug]);

  const { data: rawSuggested } = useCollection(suggestedQuery);
  const suggestedProducts = rawSuggested?.filter(p => p.id !== product.id).slice(0, 4) || [];

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
      <main className="container mx-auto px-4 pt-32 pb-24 flex-1 max-w-7xl">
        <ProductBreadcrumbs category={product.categorySlug} name={product.name} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-24">
          {/* Visual Showcase */}
          <div className="lg:col-span-7 space-y-8">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2.5rem] border border-stone-gray/10 bg-porcelain-white shadow-2xl group">
              <Image 
                src={selectedImage || 'https://picsum.photos/seed/placeholder/1200/800'} 
                alt={product.name} 
                fill 
                className="object-cover transition-transform duration-1000 group-hover:scale-105" 
                priority
              />
              <div className="absolute top-6 left-6">
                 <Badge className="bg-white/80 backdrop-blur-md text-midnight-ink border-none px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl">
                   {product.categorySlug}
                 </Badge>
              </div>
            </div>
            
            {product.images?.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x">
                {product.images.map((img: string, i: number) => (
                  <button 
                    key={i} 
                    onClick={() => setSelectedImage(img)}
                    className={cn(
                      "relative h-24 w-32 rounded-2xl border transition-all shrink-0 overflow-hidden snap-start shadow-sm",
                      selectedImage === img ? "border-primary ring-4 ring-primary/5 scale-105" : "border-stone-gray/10 opacity-70 hover:opacity-100"
                    )}
                  >
                    <Image src={img} alt={`${product.name} thumbnail ${i + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Configuration Terminal */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 space-y-10">
              <div className="space-y-6">
                <div>
                  <h1 className="text-4xl font-bold text-midnight-ink leading-tight tracking-tight font-headline">
                    {product.name}
                  </h1>
                  <div className="flex items-center gap-6 mt-6 py-5 border-y border-stone-gray/5">
                    <div className="flex items-center gap-1.5 text-yellow-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-bold text-midnight-ink text-sm font-headline">{product.averageRating || '5.0'}</span>
                      <span className="text-ghost-gray text-[10px] font-black uppercase tracking-widest ml-1">({product.reviewCount || 0})</span>
                    </div>
                    <div className="h-4 w-px bg-stone-gray/10" />
                    <div className="flex items-center gap-1.5 text-primary">
                      <Layers className="h-4 w-4" />
                      <span className="font-bold text-midnight-ink text-sm font-mono">{product.salesCount || 0}</span>
                      <span className="text-ghost-gray text-[10px] font-black uppercase tracking-widest ml-1">Sales</span>
                    </div>
                    {liveLoading && <Loader2 className="ml-auto h-4 w-4 animate-spin text-primary opacity-20" />}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-baseline gap-4">
                    <span className="text-5xl font-bold text-midnight-ink font-headline tracking-tighter">
                      ₹{(product.price / 100).toLocaleString('en-IN')}
                    </span>
                    {product.compareAtPrice > product.price && (
                      <span className="text-xl text-ghost-gray line-through decoration-rose-500/30">
                        ₹{(product.compareAtPrice / 100).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-blue text-base leading-relaxed font-medium">
                    {product.shortDescription || "Unlock premium asset specifications with perpetual licensing. Verified for professional creative performance."}
                  </p>
                </div>

                <div className="flex flex-col gap-4 pt-6">
                  <Button 
                    size="lg" 
                    className="w-full h-16 rounded-2xl bg-midnight-ink hover:bg-black text-white font-bold shadow-2xl shadow-black/20 transition-all hover:scale-[1.02] active:scale-95"
                    onClick={handleBuyNow}
                  >
                    Execute Acquisition
                  </Button>
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-12 rounded-xl border-stone-gray/20 text-midnight-ink hover:bg-white hover:border-primary transition-all font-bold"
                      onClick={handleAddToCart}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Cart
                    </Button>
                    <Button 
                      variant="outline"
                      className={cn(
                        "h-12 rounded-xl border-stone-gray/20 transition-all font-bold",
                        isWishlisted ? "text-rose-500 bg-rose-50/50 border-rose-200" : "text-midnight-ink hover:bg-white hover:border-primary"
                      )}
                      onClick={() => toggleItem(product.id)}
                    >
                      <Heart className={cn("mr-2 h-4 w-4", isWishlisted && "fill-current")} />
                      {isWishlisted ? "Saved" : "Wishlist"}
                    </Button>
                  </div>
                </div>

                {/* Smart Expandable Description */}
                <div className="pt-10 space-y-4 border-t border-stone-gray/10">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-black uppercase text-ghost-gray tracking-[0.2em] flex items-center gap-2">
                      <Info className="h-4 w-4 text-primary" />
                      Detailed Specifications
                    </h2>
                  </div>
                  
                  <div className="relative">
                    <div className={cn(
                      "prose-content text-sm leading-relaxed text-slate-blue overflow-hidden transition-all duration-700",
                      isDescExpanded ? "max-h-[5000px]" : "max-h-[220px]"
                    )}>
                      <div dangerouslySetInnerHTML={{ __html: product.description || '' }} />
                    </div>
                    
                    {!isDescExpanded && (
                      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                    )}
                  </div>

                  <Button 
                    variant="ghost" 
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    className="w-full h-10 gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 rounded-xl transition-all"
                  >
                    {isDescExpanded ? (
                      <><Minus className="h-3 w-3" /> Condense Description</>
                    ) : (
                      <><Plus className="h-3 w-3" /> Reveal Full Specifications</>
                    )}
                  </Button>
                </div>

                <div className="pt-8 space-y-6 border-t border-stone-gray/10">
                   <div className="flex items-center justify-between">
                     <h3 className="text-[10px] font-black uppercase text-ghost-gray tracking-[0.2em]">Technical Metadata</h3>
                     <ProductShare product={product} />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                     {[
                       { label: 'Format', val: product.fileFormat || 'SOURCE', icon: Layers },
                       { label: 'Version', val: product.fileVersion || '1.0', icon: Zap },
                       { label: 'License', val: 'Perpetual', icon: ShieldCheck },
                       { label: 'Delivery', val: 'Instant', icon: Clock },
                     ].map((item, i) => (
                       <div key={i} className="p-4 rounded-2xl border border-stone-gray/5 bg-muted/20 flex flex-col gap-2 group hover:bg-white hover:border-primary/20 transition-all">
                         <item.icon className="h-4 w-4 text-primary" />
                         <div>
                           <p className="text-[8px] text-ghost-gray font-black uppercase tracking-widest">{item.label}</p>
                           <p className="text-xs font-bold text-midnight-ink">{item.val}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="py-24 border-t border-stone-gray/5">
          <header className="mb-16">
             <Badge variant="outline" className="border-primary/20 text-primary uppercase font-black text-[10px] tracking-widest mb-3 px-3 py-1">Community Feed</Badge>
             <h2 className="text-3xl font-bold font-headline text-midnight-ink">Audit Log & Reviews.</h2>
          </header>
          <ReviewSystem productId={product.id} productName={product.name} />
        </section>

        {suggestedProducts.length > 0 && (
          <section className="space-y-16 border-t border-stone-gray/5 pt-24 pb-32">
            <div className="flex items-end justify-between">
              <div className="space-y-2">
                <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 font-black uppercase text-[10px] tracking-[0.2em] px-3 py-1">
                  Discovery Nexus
                </Badge>
                <h2 className="text-4xl font-bold font-headline text-midnight-ink tracking-tight">Expand Your Workflow.</h2>
              </div>
              <Button variant="ghost" asChild className="text-primary font-black uppercase text-[10px] tracking-widest hover:bg-primary/5 rounded-xl h-10 px-6 transition-all">
                <Link href="/products" className="flex items-center gap-2">
                  Full Catalog <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
            <ProductGrid products={suggestedProducts} />
          </section>
        )}

        <div className="flex justify-center py-20 border-t border-stone-gray/5 mt-20">
          <Button variant="ghost" asChild className="text-ghost-gray font-black uppercase tracking-widest text-[10px] hover:text-primary rounded-full px-8 h-12 bg-muted/30">
            <Link href="/products" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Return to Catalog
            </Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

