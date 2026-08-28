"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ReviewSystem } from "@/components/store/ReviewSystem";
import { ProductGrid } from "@/components/store/ProductGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  MessageSquare,
  ChevronLeft,
  ChevronRightIcon,
  CheckCircle2,
  Package,
  Download,
  Lock,
  Eye,
  X,
} from "lucide-react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { BundleUpsell } from "@/components/store/BundleUpsell";
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
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copied" });
  };

  const handleShare = (platform: string) => {
    let url = "";
    const text = `${product.name} on Prontly`;
    switch (platform) {
      case "x":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "whatsapp":
        url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + shareUrl)}`;
        break;
    }
    if (url) window.open(url, "_blank");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 rounded-lg px-2 gap-1 text-xs font-medium">
          <Share2 className="h-3 w-3" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm rounded-xl p-4">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-sm font-semibold">Share this product</DialogTitle>
          <DialogDescription className="text-xs">Send it to your network</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 p-1 bg-muted rounded-lg border">
          <Input readOnly defaultValue={shareUrl} className="h-7 bg-transparent border-none focus-visible:ring-0 font-mono text-xs px-2" />
          <Button size="sm" className="h-7 rounded-md gap-1 text-xs" onClick={handleCopy}>
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="h-8 rounded-lg gap-1.5 text-xs" onClick={() => handleShare("x")}>
            <Twitter className="h-3.5 w-3.5" /> X
          </Button>
          <Button variant="outline" size="sm" className="h-8 rounded-lg gap-1.5 text-xs" onClick={() => handleShare("whatsapp")}>
            <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ProductBreadcrumbs = ({ category, name }: { category: string; name: string }) => (
  <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-3 overflow-hidden">
    <Link href="/products" className="hover:text-foreground transition-colors shrink-0">Catalog</Link>
    <ChevronRight className="h-3 w-3 shrink-0 opacity-40" />
    <Link href={`/products?category=${category}`} className="hover:text-foreground transition-colors shrink-0 capitalize">{category}</Link>
    <ChevronRight className="h-3 w-3 shrink-0 opacity-40" />
    <span className="text-foreground truncate max-w-[160px]">{name}</span>
  </nav>
);

export function ProductDetailClient({ product: hydratedProduct }: { product: any }) {
  const router = useRouter();
  const { addItem, items } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const [mounted, setMounted] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>(hydratedProduct.images?.[0] || "");
  const [lightbox, setLightbox] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

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
        setLiveProduct({
          ...hydratedProduct,
          ...row,
          averageRating: typeof row.averageRating === "number" ? Math.round(row.averageRating) / 10 : hydratedProduct.averageRating,
        });
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

  useEffect(() => {
    const idx = product.images?.indexOf(selectedImage);
    if (idx >= 0) setImgIndex(idx);
  }, [selectedImage, product.images]);

  const { data: rawSuggested } = useQuery({
    queryKey: ["products", "suggested", product?.categorySlug],
    queryFn: async () => {
      const res = await fetch("/api/products");
      const json = await res.json();
      return json?.success ? json.data : [];
    },
    enabled: !!product?.categorySlug,
  });

  const suggestedProducts =
    (rawSuggested || []).filter((p: any) => p.categorySlug === product.categorySlug && p.id !== product.id).slice(0, 4) || [];

  const handleAddToCart = () => {
    addItem({ id: product.id, name: product.name, price: product.price, imageUrl: product.images?.[0] || "", category: product.categorySlug || "Asset" });
    setJustAdded(true);
    toast({ title: "Added to cart", description: product.name });
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleBuyNow = () => {
    addItem({ id: product.id, name: product.name, price: product.price, imageUrl: product.images?.[0] || "", category: product.categorySlug || "Asset" });
    router.push("/checkout");
  };

  const isWishlisted = mounted ? isInWishlist(product.id) : false;
  const isItemInCart = mounted && items.some((item) => item.id === product.id);
  const discount = product.compareAtPrice > product.price ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100) : 0;
  const savings = product.compareAtPrice > product.price ? product.compareAtPrice - product.price : 0;

  const nextImg = () => {
    if (!product.images?.length) return;
    const next = (imgIndex + 1) % product.images.length;
    setImgIndex(next);
    setSelectedImage(product.images[next]);
  };
  const prevImg = () => {
    if (!product.images?.length) return;
    const prev = (imgIndex - 1 + product.images.length) % product.images.length;
    setImgIndex(prev);
    setSelectedImage(product.images[prev]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background selection:bg-accent/20 selection:text-accent">
      <Navbar />
      <main className="container-page pt-20 sm:pt-24 pb-28 lg:pb-16 flex-1 w-full max-w-7xl">
        <ProductBreadcrumbs category={product.categorySlug} name={product.name} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* ── LEFT: PRODUCT GALLERY ──────────────────────── */}
          <div className="lg:col-span-7 space-y-4 min-w-0">
            {/* Main Featured Image Box */}
            <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full overflow-hidden rounded-3xl border border-border/80 bg-white shadow-md group">
              <Image
                src={selectedImage || "https://picsum.photos/seed/placeholder/1200/800"}
                alt={product.name}
                fill
                className="object-cover cursor-zoom-in transition-transform duration-500 group-hover:scale-102"
                priority
                onClick={() => setLightbox(true)}
              />
              
              {/* Badges Overlay */}
              <div className="absolute top-3.5 left-3.5 flex flex-wrap items-center gap-2 z-10">
                <Badge variant="secondary" className="backdrop-blur-md bg-white/95 text-foreground font-bold text-xs px-3 py-1 rounded-full shadow-xs capitalize">
                  {product.categorySlug}
                </Badge>
                {discount > 0 && (
                  <Badge className="bg-emerald-600 text-white border-none text-xs font-bold px-2.5 py-1 rounded-full shadow-xs">
                    Save {discount}%
                  </Badge>
                )}
              </div>

              {/* Prev/Next Navigation Controls */}
              {product.images?.length > 1 && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); prevImg(); }} 
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-foreground hover:bg-white transition-all opacity-80 hover:opacity-100 active:scale-90"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); nextImg(); }} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-foreground hover:bg-white transition-all opacity-80 hover:opacity-100 active:scale-90"
                    aria-label="Next image"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-xs">
                    {imgIndex + 1} / {product.images.length}
                  </div>
                </>
              )}

              {/* Zoom trigger icon */}
              <button 
                onClick={() => setLightbox(true)} 
                className="absolute bottom-3 left-3 h-8 w-8 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-foreground hover:bg-white transition-all active:scale-90"
                aria-label="Expand image"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>

            {/* Thumbnail Carousel */}
            {product.images?.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar snap-x">
                {product.images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(img)}
                    className={cn(
                      "relative h-18 w-24 rounded-2xl border overflow-hidden shrink-0 snap-start transition-all duration-200",
                      selectedImage === img 
                        ? "border-accent ring-2 ring-accent/30 shadow-xs" 
                        : "border-border/70 opacity-70 hover:opacity-100 hover:border-foreground"
                    )}
                  >
                    <Image src={img} alt={`Thumbnail ${i + 1}`} fill className="object-cover" sizes="96px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: PURCHASING & DETAILS ────────────────── */}
          <div className="lg:col-span-5 min-w-0">
            <div className="lg:sticky lg:top-24 space-y-5">
              
              {/* Product Header */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight text-foreground font-headline break-words">
                  {product.name}
                </h1>
                
                <div className="flex flex-wrap items-center gap-y-2 gap-x-3 mt-3 text-xs">
                  <div className="flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-amber-900">{product.averageRating ? product.averageRating.toFixed(1) : "5.0"}</span>
                    <a href="#reviews" className="text-muted-foreground hover:text-foreground underline underline-offset-2">
                      ({product.reviewCount || 0} reviews)
                    </a>
                  </div>

                  <span className="h-3 w-px bg-border/80" />

                  <span className="inline-flex items-center gap-1 font-medium text-muted-foreground">
                    <Download className="h-3.5 w-3.5" />
                    {product.salesCount || 0} downloads
                  </span>

                  <span className="h-3 w-px bg-border/80 hidden sm:inline" />

                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Instant Delivery
                  </span>

                  {liveLoading && <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                </div>
              </div>

              {/* Price & Checkout Card */}
              <div className="rounded-3xl border border-border/80 bg-white p-5 sm:p-6 space-y-4 shadow-sm">
                
                {/* Price Display */}
                <div className="flex items-baseline gap-2.5 flex-wrap">
                  <span className="text-3xl font-extrabold tracking-tight text-foreground font-headline">
                    ₹{(product.price / 100).toLocaleString("en-IN")}
                  </span>
                  {product.compareAtPrice > product.price && (
                    <>
                      <span className="text-sm sm:text-base text-muted-foreground line-through tabular-nums">
                        ₹{(product.compareAtPrice / 100).toLocaleString("en-IN")}
                      </span>
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-md">
                        Save ₹{(savings / 100).toLocaleString("en-IN")}
                      </Badge>
                    </>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  One-time purchase • Perpetual commercial license • Free lifetime updates
                </p>

                {/* Guarantee Micro Grid */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs py-3 border-y border-border/60">
                  <div className="p-1">
                    <ShieldCheck className="h-4.5 w-4.5 mx-auto text-emerald-600" />
                    <p className="font-bold text-foreground mt-1">100% Safe</p>
                    <p className="text-muted-foreground text-[10px]">Razorpay PCI</p>
                  </div>
                  <div className="p-1">
                    <Zap className="h-4.5 w-4.5 mx-auto text-amber-500" />
                    <p className="font-bold text-foreground mt-1">Instant</p>
                    <p className="text-muted-foreground text-[10px]">Cloud R2 Link</p>
                  </div>
                  <div className="p-1">
                    <Package className="h-4.5 w-4.5 mx-auto text-blue-500" />
                    <p className="font-bold text-foreground mt-1">Updates</p>
                    <p className="text-muted-foreground text-[10px]">Lifetime Free</p>
                  </div>
                </div>

                {product.shortDescription && (
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {product.shortDescription}
                  </p>
                )}

                {/* Primary CTA Buttons */}
                <div className="space-y-2.5 pt-1">
                  <Button 
                    size="lg"
                    className="w-full h-12 rounded-2xl font-bold text-sm bg-zinc-950 text-white hover:bg-zinc-800 shadow-md active:scale-[0.98] transition-all" 
                    onClick={handleBuyNow}
                  >
                    Buy Now — ₹{(product.price / 100).toLocaleString("en-IN")}
                  </Button>
                  
                  <div className="grid grid-cols-[1fr_auto] gap-2.5">
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="h-11 rounded-2xl font-semibold text-xs sm:text-sm border-border/80 hover:bg-muted active:scale-[0.98] transition-all" 
                      onClick={handleAddToCart}
                    >
                      {justAdded ? (
                        <>
                          <Check className="mr-2 h-4 w-4 text-emerald-600" /> Added to Cart
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-4 w-4" /> {isItemInCart ? 'Add Another' : 'Add to Cart'}
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      className={cn(
                        "h-11 w-11 rounded-2xl p-0 border-border/80 active:scale-90 transition-all",
                        isWishlisted && "text-rose-500 border-rose-200 bg-rose-50/70"
                      )}
                      onClick={() => toggleItem(product.id)}
                      aria-label="Toggle wishlist"
                    >
                      <Heart className={cn("h-4.5 w-4.5", isWishlisted && "fill-current")} />
                    </Button>
                  </div>

                  <p className="text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5 pt-1">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" /> 30-day money-back guarantee • No questions asked
                  </p>
                </div>
              </div>

              {/* ── BUNDLE & SAVE FREQUENTLY BOUGHT TOGETHER ── */}
              <BundleUpsell currentProduct={product} />

              {/* Technical Metadata Spec Cards */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: "File Format", val: product.fileFormat || "ZIP Archive", icon: Layers },
                  { label: "Current Version", val: `v${product.fileVersion || "1.0"}`, icon: Zap },
                  { label: "Commercial License", val: "Perpetual", icon: ShieldCheck },
                  { label: "Tech Support", val: "Included Free", icon: MessageSquare },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-border/70 bg-white p-3 flex items-center gap-2.5 shadow-2xs">
                    <div className="h-8 w-8 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                      <item.icon className="h-4 w-4 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground leading-none">{item.label}</p>
                      <p className="text-xs font-bold text-foreground truncate mt-0.5">{item.val}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Share section */}
              <div className="flex items-center justify-between px-2 pt-1">
                <span className="text-xs font-semibold text-muted-foreground">Share this asset:</span>
                <ProductShare product={product} />
              </div>

            </div>
          </div>

        </div>

        {/* ── TABS: OVERVIEW / SPECS / LICENSE ────────────── */}
        <div className="mt-14 pt-8 border-t border-border/60">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="h-10 p-1 rounded-2xl bg-muted/60 max-w-md">
              <TabsTrigger value="overview" className="text-xs font-bold rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-xs">
                Overview & Description
              </TabsTrigger>
              <TabsTrigger value="details" className="text-xs font-bold rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-xs">
                Specifications
              </TabsTrigger>
              <TabsTrigger value="license" className="text-xs font-bold rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-xs">
                Commercial License
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="rounded-3xl border border-border/80 bg-white p-6 sm:p-8 shadow-xs">
                <div className="prose-content max-w-none" dangerouslySetInnerHTML={{ __html: product.description || "<p>No description provided for this asset.</p>" }} />
              </div>
            </TabsContent>

            <TabsContent value="details" className="mt-6">
              <div className="rounded-3xl border border-border/80 bg-white overflow-hidden shadow-xs">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ["Category", product.categorySlug],
                      ["Primary Format", product.fileFormat || "ZIP Archive"],
                      ["Release Version", product.fileVersion || "1.0"],
                      ["File Size", product.fileSize ? `${(product.fileSize / 1024 / 1024).toFixed(1)} MB` : "Instant Electronic Fulfillment"],
                      ["Total Downloads", String(product.salesCount || 0)],
                      ["Community Rating", `${product.averageRating || "5.0"} / 5.0 (${product.reviewCount || 0} reviews)`],
                      ["Fulfillment", "Instant Cloudflare R2 Download Link"],
                    ].map(([k, v]) => (
                      <tr key={k} className="border-b border-border/60 last:border-0">
                        <td className="px-5 py-3.5 bg-muted/20 text-xs font-bold uppercase tracking-wider text-muted-foreground w-40">{k}</td>
                        <td className="px-5 py-3.5 text-xs sm:text-sm font-semibold text-foreground">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="license" className="mt-6">
              <div className="rounded-3xl border border-border/80 bg-white p-6 sm:p-8 space-y-4 shadow-xs">
                <h3 className="text-base font-bold flex items-center gap-2 text-foreground">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" /> Perpetual Commercial Rights
                </h3>
                <ul className="text-xs sm:text-sm text-muted-foreground space-y-2 list-disc pl-5 leading-relaxed">
                  <li>Use in unlimited personal, commercial, and client production projects.</li>
                  <li>Lifetime updates included at zero additional cost — no renewal fees ever.</li>
                  <li>Instant electronic fulfillment after payment with 30-day money-back guarantee.</li>
                  <li>Direct redistribution, repackaging, or reselling of the raw source files is strictly prohibited.</li>
                </ul>
                <p className="text-xs text-muted-foreground pt-3 border-t border-border/50">
                  For complete licensing questions, visit our <Link href="/terms" className="text-accent underline font-semibold">Terms of Service</Link>.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── CUSTOMER REVIEWS ───────────────────────────── */}
        <section id="reviews" className="mt-14 scroll-mt-24">
          <ReviewSystem productId={product.id} productName={product.name} />
        </section>

        {/* ── RELATED PRODUCTS ───────────────────────────── */}
        {suggestedProducts.length > 0 && (
          <section className="mt-14 pt-10 border-t border-border/60">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-headline">
                  You May Also Like
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Complementary digital assets from the {product.categorySlug} category
                </p>
              </div>
              <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold h-8.5">
                <Link href={`/products?category=${product.categorySlug}`} className="flex items-center gap-1.5">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            <ProductGrid products={suggestedProducts} />
          </section>
        )}

        {/* Back navigation */}
        <div className="flex justify-center mt-12">
          <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs font-semibold">
            <Link href="/products" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Catalog
            </Link>
          </Button>
        </div>
      </main>

      {/* ── MOBILE STICKY BOTTOM CHECKOUT BAR ─────────────── */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-xl border-t border-border/80 shadow-2xl p-3 pb-[calc(env(safe-area-inset-bottom,0.5rem)+0.75rem)] flex items-center gap-3 z-40">
        <div className="h-11 w-11 rounded-xl overflow-hidden relative shrink-0 border border-border/70">
          <Image src={product.images?.[0] || "https://picsum.photos/seed/placeholder/200/200"} alt="" fill className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-foreground truncate leading-tight">{product.name}</p>
          <p className="text-sm font-extrabold text-foreground tracking-tight">₹{(product.price / 100).toLocaleString("en-IN")}</p>
        </div>
        <Button size="sm" className="shrink-0 rounded-xl px-5 font-bold text-xs h-10 bg-zinc-950 text-white shadow-xs" onClick={handleBuyNow}>
          Buy Now
        </Button>
        <Button size="icon" variant="outline" className="shrink-0 h-10 w-10 rounded-xl border-border/80" onClick={handleAddToCart} aria-label="Add to cart">
          <ShoppingCart className="h-4 w-4" />
        </Button>
      </div>

      {/* Lightbox Modal */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <button 
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/25 transition-colors" 
            onClick={() => setLightbox(false)}
            aria-label="Close lightbox"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="relative w-full max-w-5xl aspect-[16/10]">
            <Image src={selectedImage} alt={product.name} fill className="object-contain" />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
