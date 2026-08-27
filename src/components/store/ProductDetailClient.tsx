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
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const [mounted, setMounted] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>(hydratedProduct.images?.[0] || "");
  const [lightbox, setLightbox] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);

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
    toast({ title: "Added to cart" });
  };

  const handleBuyNow = () => {
    addItem({ id: product.id, name: product.name, price: product.price, imageUrl: product.images?.[0] || "", category: product.categorySlug || "Asset" });
    router.push("/checkout");
  };

  const isWishlisted = mounted ? isInWishlist(product.id) : false;
  const discount = product.compareAtPrice > product.price ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100) : 0;
  const savings = product.compareAtPrice > product.price ? product.compareAtPrice - product.price : 0;

  const nextImg = () => {
    const next = (imgIndex + 1) % product.images.length;
    setImgIndex(next);
    setSelectedImage(product.images[next]);
  };
  const prevImg = () => {
    const prev = (imgIndex - 1 + product.images.length) % product.images.length;
    setImgIndex(prev);
    setSelectedImage(product.images[prev]);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 pt-16 md:pt-20 pb-24 lg:pb-10 flex-1 max-w-6xl w-full">
        <ProductBreadcrumbs category={product.categorySlug} name={product.name} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Gallery */}
          <div className="lg:col-span-7 space-y-3">
            <div className="relative aspect-square lg:aspect-[4/3] w-full overflow-hidden rounded-xl border bg-card shadow-sm group">
              <Image
                src={selectedImage || "https://picsum.photos/seed/placeholder/1200/800"}
                alt={product.name}
                fill
                className="object-cover cursor-zoom-in"
                priority
                onClick={() => setLightbox(true)}
              />
              {/* Top badges */}
              <div className="absolute top-3 left-3 flex gap-1.5">
                <Badge variant="secondary" className="backdrop-blur bg-white/90 text-xs font-medium px-2 py-0.5 rounded-full capitalize">
                  {product.categorySlug}
                </Badge>
                {discount > 0 && (
                  <Badge className="bg-red-500 text-white border-none text-xs font-bold px-2 py-0.5 rounded-full">-{discount}%</Badge>
                )}
              </div>
              {/* Nav arrows */}
              {product.images?.length > 1 && (
                <>
                  <button onClick={prevImg} className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white/90 backdrop-blur shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={nextImg} className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white/90 backdrop-blur shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur text-white text-xs px-1.5 py-0.5 rounded-full">
                    {imgIndex + 1} / {product.images.length}
                  </div>
                </>
              )}
              <button onClick={() => setLightbox(true)} className="absolute bottom-2 left-2 h-7 w-7 rounded-full bg-white/90 backdrop-blur shadow flex items-center justify-center">
                <Eye className="h-3.5 w-3.5" />
              </button>
            </div>

            {product.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin snap-x">
                {product.images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(img)}
                    className={cn(
                      "relative h-16 w-16 rounded-lg border overflow-hidden shrink-0 snap-start transition-all",
                      selectedImage === img ? "border-foreground ring-1 ring-foreground/10" : "border-border opacity-70 hover:opacity-100"
                    )}
                  >
                    <Image src={img} alt={`thumb ${i + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-20 space-y-4">
              {/* Title */}
              <div>
                <h1 className="text-xl md:text-2xl font-bold leading-tight tracking-tight break-words">{product.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="font-semibold">{product.averageRating || "5.0"}</span>
                    <a href="#reviews" className="text-muted-foreground hover:text-foreground underline">
                      ({product.reviewCount || 0} reviews)
                    </a>
                  </span>
                  <span className="h-3 w-px bg-border" />
                  <span className="inline-flex items-center gap-1">
                    <Download className="h-3 w-3 text-muted-foreground" />
                    {product.salesCount || 0} sales
                  </span>
                  <span className="h-3 w-px bg-border hidden sm:inline" />
                  <span className="inline-flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-3 w-3" /> Instant delivery
                  </span>
                  {liveLoading && <Loader2 className="ml-auto h-3 w-3 animate-spin text-muted-foreground" />}
                </div>
              </div>

              {/* Price card */}
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-2xl font-bold tracking-tight">₹{(product.price / 100).toLocaleString("en-IN")}</span>
                  {product.compareAtPrice > product.price && (
                    <>
                      <span className="text-sm text-muted-foreground line-through">₹{(product.compareAtPrice / 100).toLocaleString("en-IN")}</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs font-bold">Save ₹{(savings / 100).toLocaleString("en-IN")}</Badge>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">One-time payment • Perpetual license • All future updates</p>

                <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 border-y">
                  <div>
                    <ShieldCheck className="h-4 w-4 mx-auto text-green-600" />
                    <p className="font-medium mt-1">Secure</p>
                    <p className="text-muted-foreground text-[11px]">SSL Checkout</p>
                  </div>
                  <div>
                    <Zap className="h-4 w-4 mx-auto text-amber-500" />
                    <p className="font-medium mt-1">Instant</p>
                    <p className="text-muted-foreground text-[11px]">Download now</p>
                  </div>
                  <div>
                    <Package className="h-4 w-4 mx-auto text-blue-500" />
                    <p className="font-medium mt-1">Updates</p>
                    <p className="text-muted-foreground text-[11px]">Lifetime free</p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{product.shortDescription}</p>

                <div className="space-y-2">
                  <Button className="w-full h-11 rounded-lg font-semibold" onClick={handleBuyNow}>
                    Buy Now — ₹{(product.price / 100).toLocaleString("en-IN")}
                  </Button>
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <Button variant="outline" className="h-10 rounded-lg font-medium" onClick={handleAddToCart}>
                      <ShoppingCart className="mr-1.5 h-4 w-4" /> Add to Cart
                    </Button>
                    <Button
                      variant="outline"
                      className={cn("h-10 w-10 rounded-lg p-0", isWishlisted && "text-red-500 border-red-200 bg-red-50")}
                      onClick={() => toggleItem(product.id)}
                    >
                      <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
                    </Button>
                  </div>
                  <p className="text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                    <Lock className="h-3 w-3" /> 30-day money-back • No questions asked
                  </p>
                </div>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Format", val: product.fileFormat || "ZIP", icon: Layers },
                  { label: "Version", val: product.fileVersion || "1.0", icon: Zap },
                  { label: "License", val: "Perpetual", icon: ShieldCheck },
                  { label: "Support", val: "Included", icon: MessageSquare },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border bg-muted/20 p-2.5 flex items-center gap-2">
                    <item.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground leading-none">{item.label}</p>
                      <p className="text-xs font-semibold truncate">{item.val}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">Share:</span>
                <ProductShare product={product} />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs: Description / Details */}
        <div className="mt-10">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="h-8 p-1 rounded-lg">
              <TabsTrigger value="overview" className="text-xs rounded-md">Overview</TabsTrigger>
              <TabsTrigger value="details" className="text-xs rounded-md">Details</TabsTrigger>
              <TabsTrigger value="license" className="text-xs rounded-md">License</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <div className="prose-content max-w-none" dangerouslySetInnerHTML={{ __html: product.description || "<p>No description provided.</p>" }} />
            </TabsContent>
            <TabsContent value="details" className="mt-4">
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ["Category", product.categorySlug],
                      ["Format", product.fileFormat || "ZIP"],
                      ["Version", product.fileVersion || "1.0"],
                      ["File size", product.fileSize ? `${(product.fileSize / 1024 / 1024).toFixed(1)} MB` : "—"],
                      ["Sales", String(product.salesCount || 0)],
                      ["Rating", `${product.averageRating || "5.0"} (${product.reviewCount || 0} reviews)`],
                    ].map(([k, v]) => (
                      <tr key={k} className="border-b last:border-0">
                        <td className="px-4 py-2.5 bg-muted/30 text-xs font-medium text-muted-foreground w-32">{k}</td>
                        <td className="px-4 py-2.5 text-sm font-medium">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            <TabsContent value="license" className="mt-4">
              <div className="rounded-lg border bg-card p-5 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-600" /> Perpetual License
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
                  <li>Use for personal and commercial projects, unlimited</li>
                  <li>Lifetime updates included — no renewal</li>
                  <li>Instant download after payment, 30-day refund</li>
                  <li>Redistribution or resale not allowed</li>
                </ul>
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  Full terms: <Link href="/terms" className="underline hover:text-foreground">Terms of Service</Link>
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Reviews */}
        <section id="reviews" className="mt-10 scroll-mt-20">
          <ReviewSystem productId={product.id} productName={product.name} />
        </section>

        {/* Related */}
        {suggestedProducts.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">You may also like</h2>
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                <Link href={`/products?category=${product.categorySlug}`} className="flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
            <ProductGrid products={suggestedProducts} />
          </section>
        )}

        <div className="flex justify-center mt-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/products" className="flex items-center gap-1.5 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Catalog
            </Link>
          </Button>
        </div>
      </main>

      {/* Mobile sticky bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-3 flex items-center gap-3 z-40">
        <div className="h-10 w-10 rounded-lg overflow-hidden relative shrink-0 border">
          <Image src={product.images?.[0] || "https://picsum.photos/seed/placeholder/200/200"} alt="" fill className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate leading-tight">{product.name}</p>
          <p className="text-sm font-bold">₹{(product.price / 100).toLocaleString("en-IN")}</p>
        </div>
        <Button size="sm" className="shrink-0 rounded-lg px-4 font-semibold" onClick={handleBuyNow}>
          Buy
        </Button>
        <Button size="sm" variant="outline" className="shrink-0 h-9 w-9 p-0 rounded-lg" onClick={handleAddToCart}>
          <ShoppingCart className="h-4 w-4" />
        </Button>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white" onClick={() => setLightbox(false)}>
            <X className="h-4 w-4" />
          </button>
          <div className="relative w-full max-w-4xl aspect-[4/3]">
            <Image src={selectedImage} alt={product.name} fill className="object-contain" />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
