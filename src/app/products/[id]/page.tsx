
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
  Loader2,
  Camera,
  Copy,
  Check,
  Twitter,
  Linkedin
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

/**
 * --- SUB-COMPONENT: Product Share ---
 */
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
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
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
        <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 border border-white/5 bg-white/5 text-muted-foreground hover:text-primary transition-all">
          <Share2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] border-white/10 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl font-bold">Share Asset</DialogTitle>
          <DialogDescription>Spread the word about this high-performance digital asset.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 py-4">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">Link</Label>
            <Input
              id="link"
              defaultValue={shareUrl}
              readOnly
              className="h-12 bg-muted/30 border-white/5 rounded-xl font-mono text-xs px-4"
            />
          </div>
          <Button type="submit" size="sm" className="px-3 h-12 rounded-xl" onClick={handleCopy}>
            <span className="sr-only">Copy</span>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-white/5">
          <Button variant="outline" className="rounded-xl h-12 gap-2 flex-1 border-white/10" onClick={() => handleShare('x')}>
            <Twitter className="h-4 w-4" /> X.com
          </Button>
          <Button variant="outline" className="rounded-xl h-12 gap-2 flex-1 border-white/10" onClick={() => handleShare('whatsapp')}>
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.87 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg> WhatsApp
          </Button>
          <Button variant="outline" className="rounded-xl h-12 gap-2 flex-1 border-white/10" onClick={() => handleShare('linkedin')}>
            <Linkedin className="h-4 w-4" /> LinkedIn
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

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
      <div className="flex items-center gap-2">
        <ProductShare product={product} />
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggleWishlist}
          className={cn("rounded-full h-10 w-10 border border-white/5 bg-white/5", isWishlisted ? "text-red-500 fill-current" : "text-muted-foreground")}
        >
          <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
        </Button>
      </div>
    </div>
    <h1 className="text-3xl md:text-4xl font-bold font-headline leading-tight">{product.name}</h1>
  </div>
);

/**
 * --- SUB-COMPONENT: Visuals ---
 */
const ProductVisuals = ({ product }: { product: any }) => {
  const images = product.images || ['https://picsum.photos/seed/placeholder/1200/1200'];
  const [selectedImage, setSelectedImage] = useState(images[0]);

  useEffect(() => {
    if (images.length > 0) {
      setSelectedImage(images[0]);
    }
  }, [product.id, images]);

  return (
    <div className="space-y-6">
      <div className="relative aspect-[4/5] md:aspect-square w-full overflow-hidden rounded-[2.5rem] border border-white/5 bg-muted shadow-2xl">
        <Image 
          src={selectedImage} 
          alt={product.name} 
          fill 
          className="object-cover transition-all duration-700" 
          priority
        />
        <Badge className="absolute left-6 top-6 bg-primary/90 backdrop-blur-md px-4 py-1.5 border-none shadow-lg font-bold text-[10px] uppercase">Premium Asset</Badge>
      </div>
      
      {images.length > 1 && (
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          {images.map((img: string, i: number) => (
            <button 
              key={i} 
              onClick={() => setSelectedImage(img)}
              className={cn(
                "relative h-20 w-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 active:scale-95",
                selectedImage === img ? "border-primary ring-4 ring-primary/10" : "border-white/5 opacity-60 hover:opacity-100 hover:border-white/20"
              )}
            >
              <Image src={img} alt={`${product.name} preview ${i + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * --- SUB-COMPONENT: Description ---
 */
const ProductDescription = ({ product }: { product: any }) => (
  <Card className="p-8 border-white/5 bg-card/30 rounded-[2.5rem] shadow-xl">
    <div className="flex items-center gap-3 mb-6">
      <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
        <Info className="h-5 w-5" />
      </div>
      <h2 className="text-2xl font-bold font-headline">Product Overview</h2>
    </div>
    <div 
      className="prose-content max-w-4xl"
      dangerouslySetInnerHTML={{ __html: product.description || '' }}
    />
    <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t border-white/5">
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
      <Card className="p-6 bg-card/50 border-white/5 rounded-3xl">
        <div className="grid grid-cols-1 gap-y-2">
          {[
            { label: 'Format', value: product.fileFormat || 'PDF/ZIP' },
            { label: 'Size', value: product.fileSize ? `${(product.fileSize / 1024 / 1024).toFixed(2)} MB` : 'N/A' },
            { label: 'Version', value: product.fileVersion || '1.0' },
            { label: 'Delivery', value: 'Instant Unlock' },
          ].map((spec) => (
            <div key={spec.label} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
              <span className="text-muted-foreground font-medium text-xs">{spec.label}</span>
              <span className="font-bold text-xs">{spec.value}</span>
            </div>
          ))}
        </div>
      </Card>
    </TabsContent>

    <TabsContent value="license">
      <Card className="p-6 bg-primary/5 border-primary/20 rounded-3xl">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">Creator Rights</h3>
        </div>
        <ul className="space-y-3">
          {[
            'Unlimited personal usage',
            'Perpetual access',
            'Free updates',
            'Commercial license'
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-muted-foreground text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
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
    <Card className="p-6 border-white/5 bg-card/30 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <ShoppingCart className="h-24 w-24" />
      </div>
      <div className="relative z-10">
        <div className="mb-6">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">One-time Investment</p>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold font-headline text-accent">
              ₹{(product.price / 100).toLocaleString('en-IN')}
            </span>
            {product.compareAtPrice > product.price && (
              <span className="text-base text-muted-foreground line-through opacity-40">₹{(product.compareAtPrice / 100).toLocaleString('en-IN')}</span>
            )}
          </div>
        </div>
        
        <div className="space-y-3 mb-8">
          {[
            { icon: ShieldCheck, text: 'Razorpay Verified', color: 'text-green-500' },
            { icon: Clock, text: 'Instant Delivery', color: 'text-primary' },
            { icon: Download, text: 'Perpetual Access', color: 'text-primary' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-tighter">
              <div className={cn("p-1 rounded-md bg-white/5 border border-white/5", item.color)}>
                <item.icon className="h-3 w-3" />
              </div>
              <span className="text-muted-foreground/80">{item.text}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <Button 
            size="lg" 
            className="w-full h-14 rounded-xl text-base font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            onClick={onBuyNow}
          >
            Buy Now
          </Button>
          <Button 
            size="lg" 
            variant="secondary" 
            className="w-full h-14 rounded-xl text-base font-bold border-white/5 hover:bg-white/10 transition-all"
            onClick={onAddToCart}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        </div>

        <div className="mt-6 pt-6 border-t border-white/5 flex flex-col items-center justify-center gap-3">
          <p className="text-[8px] text-muted-foreground uppercase tracking-[0.2em] font-black opacity-60">Secure Branded Ecosystem</p>
          <div className="flex gap-3">
            <ProductShare product={product} />
          </div>
        </div>
      </div>
    </Card>

    <div className="bg-muted/10 rounded-2xl p-5 border border-dashed border-muted-foreground/20 text-center">
      <p className="text-[10px] text-muted-foreground leading-relaxed italic">
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

        <section className="py-20 border-t border-white/5">
          <ReviewSystem productId={id} productName={product.name} />
        </section>

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
