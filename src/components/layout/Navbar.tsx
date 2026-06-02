
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Heart, ShieldCheck, LayoutDashboard, Settings, LogOut, Search, User as UserIcon, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { CartDrawer } from '../store/CartDrawer';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export function Navbar() {
  const { user, role } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { getItemCount } = useCart();
  const { itemIds } = useWishlist();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAdmin = role === 'admin' || role === 'super-admin';

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const cartItemCount = mounted ? getItemCount() : 0;

  return (
    <>
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 px-4 transition-all duration-300 flex justify-center pointer-events-none",
          isScrolled ? "pt-2" : "pt-4"
        )}
      >
        <nav 
          className={cn(
            "w-full max-w-[1400px] h-14 flex items-center justify-between px-6 transition-all duration-300 rounded-2xl pointer-events-auto border bg-white/80 backdrop-blur-xl border-white/40 shadow-xl",
            !isScrolled && "bg-white/40 shadow-none border-transparent"
          )}
        >
          <div className="flex items-center gap-10 lg:w-1/4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative h-8 w-8 overflow-hidden rounded-[10px] bg-white/5 transition-transform group-hover:scale-105">
                <Image 
                  src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png" 
                  alt="Prontly Logo" 
                  fill 
                  className="object-cover"
                />
              </div>
              <span className="font-headline text-xl font-bold tracking-tighter text-midnight-ink">Prontly</span>
            </Link>
            
            <div className="hidden xl:flex items-center gap-8">
              <Link href="/products" className="text-[10px] font-black text-slate-blue hover:text-primary transition-colors uppercase tracking-[0.2em]">Products</Link>
              <Link href="/products?view=categories" className="text-[10px] font-black text-slate-blue hover:text-primary transition-colors uppercase tracking-[0.2em]">Categories</Link>
              <Link href="/blog" className="text-[10px] font-black text-slate-blue hover:text-primary transition-colors uppercase tracking-[0.2em]">Blog</Link>
              <Link href="/testimonials" className="text-[10px] font-black text-slate-blue hover:text-primary transition-colors uppercase tracking-[0.2em]">Pricing</Link>
            </div>
          </div>

          {/* SEARCH TERMINAL */}
          <div className="hidden md:flex flex-1 max-w-md px-4">
             <form onSubmit={handleSearch} className="w-full relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ghost-gray opacity-40 group-focus-within:text-primary group-focus-within:opacity-100 transition-all" />
                <Input 
                  placeholder="Search elite assets..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 bg-black/5 border-none rounded-xl pl-10 text-[12px] font-medium placeholder:text-ghost-gray/60 focus-visible:ring-2 focus-visible:ring-primary/10 transition-all"
                />
             </form>
          </div>

          <div className="flex items-center justify-end gap-3 lg:w-1/4">
            <div className="flex items-center gap-1 border-r border-stone-gray/10 pr-3 mr-2">
              <Button variant="ghost" size="icon" className="hidden sm:flex text-slate-blue hover:text-primary rounded-full h-9 w-9" asChild>
                <Link href="/wishlist">
                  <Heart className={cn("h-4.5 w-4.5", itemIds.length > 0 && "fill-primary text-primary")} />
                </Link>
              </Button>

              <Button variant="ghost" size="icon" className="relative text-slate-blue hover:text-primary rounded-full h-9 w-9" onClick={() => setIsCartOpen(true)}>
                <ShoppingCart className="h-4.5 w-4.5" />
                {cartItemCount > 0 && (
                  <span className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-primary border border-white text-[8px] font-black text-white flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </div>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 border border-stone-gray/10 hover:border-primary transition-all active:scale-95 shadow-sm">
                    <Avatar className="h-full w-full">
                      <AvatarImage src={user.photoURL || ''} />
                      <AvatarFallback className="bg-primary/5 text-primary font-bold text-[11px]">{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60 mt-3 p-2 rounded-2xl border border-stone-gray/20 shadow-2xl bg-white/95 backdrop-blur-xl" align="end">
                  <div className="p-3 space-y-0.5">
                    <p className="text-sm font-bold text-midnight-ink truncate">{user.displayName || 'Creator'}</p>
                    <p className="text-[10px] text-slate-blue truncate font-medium uppercase tracking-wider">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-stone-gray/5" />
                  <div className="space-y-1 p-1">
                    {isAdmin && (
                      <DropdownMenuItem asChild className="rounded-xl cursor-pointer h-10 text-[10px] font-bold uppercase tracking-widest">
                        <Link href="/admin"><ShieldCheck className="h-4 w-4 mr-2.5 text-primary" /> Admin Terminal</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer h-10 text-[10px] font-bold uppercase tracking-widest">
                      <Link href="/dashboard"><LayoutDashboard className="h-4 w-4 mr-2.5 text-primary" /> My Vault</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer h-10 text-[10px] font-bold uppercase tracking-widest">
                      <Link href="/dashboard/settings"><Settings className="h-4 w-4 mr-2.5 text-primary" /> Settings</Link>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator className="bg-stone-gray/5" />
                  <div className="p-1">
                    <DropdownMenuItem className="rounded-xl text-destructive cursor-pointer h-10 text-[10px] font-bold uppercase tracking-widest focus:bg-destructive/5" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2.5" /> End Session
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="hidden sm:block">
                  <Button variant="ghost" className="text-slate-blue hover:text-midnight-ink font-black text-[10px] px-4 h-9 uppercase tracking-widest">Log in</Button>
                </Link>
                <Link href="/products">
                  <Button className="h-9 px-5 rounded-xl bg-primary text-white font-black text-[10px] shadow-lg shadow-primary/20 uppercase tracking-widest hover:scale-[1.02] transition-transform">
                    Explore
                  </Button>
                </Link>
              </div>
            )}
            
            <div className="xl:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 bg-white border-none p-0">
                   <SheetHeader className="p-8 border-b border-stone-gray/5">
                      <SheetTitle className="font-headline text-2xl font-bold flex items-center gap-3">
                         <div className="relative h-8 w-8 rounded-lg overflow-hidden bg-muted">
                            <Image src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png" alt="Logo" fill />
                         </div>
                         Prontly Store
                      </SheetTitle>
                   </SheetHeader>
                   <div className="p-8 space-y-6">
                      <nav className="flex flex-col gap-4">
                         <Link href="/" className="text-lg font-bold text-midnight-ink">Home</Link>
                         <Link href="/products" className="text-lg font-bold text-midnight-ink">All Products</Link>
                         <Link href="/products?view=categories" className="text-lg font-bold text-midnight-ink">Categories</Link>
                         <Link href="/blog" className="text-lg font-bold text-midnight-ink">Blog & Guides</Link>
                         <Link href="/testimonials" className="text-lg font-bold text-midnight-ink">Success Stories</Link>
                      </nav>
                      <Separator className="bg-stone-gray/5" />
                      <div className="pt-4">
                         <Button className="w-full h-14 rounded-2xl bg-primary text-white font-bold text-lg" asChild>
                            <Link href="/products">Explore Catalog</Link>
                         </Button>
                      </div>
                   </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </nav>
      </header>
      <CartDrawer open={isCartOpen} onOpenChange={setIsCartOpen} />
    </>
  );
}

function Separator({ className }: { className?: string }) {
  return <div className={cn("h-px w-full", className)} />;
}
