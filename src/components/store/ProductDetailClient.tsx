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
  Zap
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
      <DialogContent className="sm:max-w-md rounded-md border-stone-gray/20 bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-midnight-ink">Share Asset</DialogTitle>
          <DialogDescription className="text-slate-blue">Spread the word about this professional digital asset.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 py-4">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">Link</Label>
            <Input
              id="link"
              defaultValue={shareUrl}
              readOnly
              className="h-10 bg-powder-blue border-none rounded font-mono text-xs px-4"
            />
          </div>
          <Button type="submit" size="sm" className="px-3 h-10 rounded bg-deep-violet" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-stone-gray/10">
          <Button variant="outline" className="rounded h-10 gap-2 flex-1 border-stone-gray/20 text-slate-blue" onClick={() => handleShare('x')}>
            <Twitter className="h-4 w-4" /> X.com
          </Button>
          <Button variant="outline" className="rounded h-10 gap-2 flex-1 border-stone-gray/20 text-slate-blue" onClick={() => handleShare('whatsapp')}>
            <ExternalLink className="h-4 w-4" /> WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ProductBreadcrumbs = ({ category, name }: { category: string, name: string }) => (
  <nav className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-ghost-gray mb-8 overflow-hidden whitespace-nowrap">
    <Link href="/products" className="hover:text-deep-violet transition-colors shrink-0">Marketplace</Link>
    <ChevronRight className="h-2.5 w-2.5 shrink-0 opacity-50" />
    <Link href={`/products?category=${category}`} className="hover:text-deep-violet transition-colors shrink-0">{category}</Link>
    <ChevronRight className="h-2.5 w-2.5 shrink-0 opacity-50" />
    <span className="text-midnight-ink truncate max-w-[150px]">{name}</span>
  </nav>
);

export function ProductDetailClient({ product: hydratedProduct }: { product: any }) {
  const router = useRouter();
  const db = useFirestore();
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const [mounted, setMounted] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>(hydratedProduct.images?.[0] || '');

  // Real-time data binding using the true Firestore ID
  const productRef = useMemoFirebase(() => (db ? doc(db, 'products', hydratedProduct.id) : null), [db, hydratedProduct.id]);
  const { data: liveProduct, loading: liveLoading } = useDoc(productRef);

  // Use live data if available, otherwise fallback to hydrated data from the server
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
    <main className="container mx-auto px-4 py-12 flex-1 max-w-7xl">
      <ProductBreadcrumbs category={product.categorySlug} name={product.name} />

      <div className="mb-8">
        <Badge className="bg-deep-violet/5 text-deep-violet border-none px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-widest mb-2">
          {product.categorySlug}
        </Badge>
        <h1 className="text-3xl font-bold text-midnight-ink leading-tight tracking-tight">
          {product.name}
          {liveLoading && <Loader2 className="inline ml-3 h-4 w-4 animate-spin opacity-20" />}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-20">
        <div className="lg:col-span-7 space-y-8">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md border border-stone-gray/10 bg-porcelain-white shadow-sm">
            <Image 
              src={selectedImage || 'https://picsum.photos/seed/placeholder/1200/800'} 
              alt={product.name} 
              fill 
              className="object-cover" 
              priority
            />
          </div>
          
          {product.images?.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
              {product.images.map((img: string, i: number) => (
                <button 
                  key={i} 
                  onClick={() => setSelectedImage(img)}
                  className={cn(
                    "relative h-20 w-32 rounded border transition-all shrink-0 overflow-hidden",
                    selectedImage === img ? "border-deep-violet ring-2 ring-deep-violet/10" : "border-stone-gray/20 opacity-70 hover:opacity-100"
                  )}
                >
                  <Image src={img} alt={`${product.name} thumbnail ${i + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5">
          <div className="sticky top-28 space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-6 py-4 border-y border-stone-gray/10">
                <div className="flex items-center gap-1.5 text-yellow-500">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="font-bold text-midnight-ink text-sm">{product.averageRating || '5.0'}</span>
                  <span className="text-ghost-gray text-xs ml-1">({product.reviewCount || 0})</span>
                </div>
                <div className="h-4 w-[1px] bg-stone-gray/20" />
                <div className="flex items-center gap-1.5 text-slate-blue">
                  <Layers className="h-4 w-4" />
                  <span className="font-bold text-midnight-ink text-sm">{product.salesCount || 0}</span>
                  <span className="text-ghost-gray text-xs ml-1">Installs</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-midnight-ink tracking-tighter">
                    ₹{(product.price / 100).toLocaleString('en-IN')}
                  </span>
                </div>

                <p className="text-slate-blue text-sm leading-relaxed">
                  {product.shortDescription || "Unlock professional-grade assets with a perpetual license. Lifetime updates included."}
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <Button 
                  size="lg" 
                  className="w-full h-12 rounded bg-deep-violet hover:bg-deep-violet/90 text-white font-bold stripe-shadow-sm transition-all"
                  onClick={handleBuyNow}
                >
                  Buy Now
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-10 rounded border-stone-gray/20 text-midnight-ink hover:bg-powder-blue transition-all"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>
                  <Button 
                    variant="outline"
                    className={cn(
                      "h-10 rounded border-stone-gray/20 transition-all",
                      isWishlisted ? "text-deep-violet bg-deep-violet/5 border-deep-violet/30" : "text-midnight-ink hover:bg-powder-blue"
                    )}
                    onClick={() => toggleItem(product.id)}
                  >
                    <Heart className={cn("mr-2 h-4 w-4", isWishlisted && "fill-current")} />
                    {isWishlisted ? "Saved" : "Wishlist"}
                  </Button>
                </div>
              </div>

              <div className="pt-8 space-y-4 border-t border-stone-gray/10">
                <h2 className="text-sm font-bold text-midnight-ink flex items-center gap-2">
                  <Info className="h-4 w-4 text-deep-violet" />
                  Specifications
                </h2>
                <div 
                  className="prose-content text-sm"
                  dangerouslySetInnerHTML={{ __html: product.description || '' }}
                />
              </div>

              <div className="pt-8 space-y-4 border-t border-stone-gray/10">
                 <div className="flex items-center justify-between">
                   <h3 className="text-[10px] font-black uppercase text-ghost-gray tracking-[0.15em]">Technical Audit</h3>
                   <ProductShare product={product} />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                   {[
                     { label: 'Format', val: product.fileFormat || 'SOURCE', icon: Layers },
                     { label: 'Version', val: product.fileVersion || '1.0', icon: Zap },
                     { label: 'License', val: 'Perpetual', icon: ShieldCheck },
                     { label: 'Delivery', val: 'Instant', icon: Clock },
                   ].map((item, i) => (
                     <div key={i} className="p-4 rounded border border-stone-gray/10 bg-porcelain-white flex flex-col gap-2">
                       <item.icon className="h-4 w-4 text-deep-violet" />
                       <div>
                         <p className="text-[9px] text-ghost-gray font-bold uppercase">{item.label}</p>
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

      <section className="py-20 border-t border-stone-gray/10">
        <ReviewSystem productId={product.id} productName={product.name} />
      </section>

      {suggestedProducts.length > 0 && (
        <section className="space-y-12 border-t border-stone-gray/10 pt-20 pb-32">
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <Badge variant="outline" className="border-deep-violet/20 text-deep-violet bg-deep-violet/5 font-bold uppercase text-[9px] tracking-[0.2em] px-2 py-0.5">
                Similar infrastructure
              </Badge>
              <h2 className="text-3xl font-bold font-headline text-midnight-ink tracking-tight">Expand your toolkit.</h2>
            </div>
            <Button variant="ghost" asChild className="text-deep-violet font-bold h-auto p-0 flex items-center gap-2 hover:bg-transparent hover:translate-x-1 transition-all">
              <Link href="/products" className="flex items-center gap-2">
                Full catalog <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <ProductGrid products={suggestedProducts} />
        </section>
      )}

      <div className="flex justify-center py-20 border-t border-stone-gray/10 mt-20">
        <Button variant="ghost" asChild className="text-muted-foreground hover:text-primary rounded-full px-6">
          <Link href="/blog" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
          </Link>
        </Button>
      </div>
    </main>
  );
}
