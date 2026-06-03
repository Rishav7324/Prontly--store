'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Heart, ShieldCheck, LayoutDashboard, Settings, LogOut, Search, User as UserIcon, Menu } from 'lucide-react';
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
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
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
          "fixed top-0 left-0 right-0 z-50 px-4 transition-all duration-300 flex justify-center",
          isScrolled ? "pt-1" : "pt-2"
        )}
      >
        <nav 
          className={cn(
            "w-full max-w-7xl h-14 flex items-center justify-between px-6 transition-all duration-300 rounded-2xl border",
            isScrolled ? "glass-panel" : "bg-white/40 border-transparent"
          )}
        >
          <div className="flex items-center gap-10 lg:w-1/4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative h-7 w-7 overflow-hidden rounded-lg bg-primary shadow-sm transition-transform group-hover:scale-105">
                <Image 
                  src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png" 
                  alt="Logo" 
                  fill 
                  className="object-cover"
                />
              </div>
              <span className="font-bold text-lg tracking-tight text-foreground"></span>
            </Link>
            
            <div className="hidden xl:flex items-center gap-6">
              <Link href="/products" className="text-[13px] font-medium text-muted-foreground hover:text-primary transition-colors">Products</Link>
              <Link href="/products?view=categories" className="text-[13px] font-medium text-muted-foreground hover:text-primary transition-colors">Categories</Link>
              <Link href="/blog" className="text-[13px] font-medium text-muted-foreground hover:text-primary transition-colors">Blog</Link>
            </div>
          </div>

          <div className="hidden md:flex flex-1 max-w-sm px-4">
             <form onSubmit={handleSearch} className="w-full relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground opacity-50" />
                <Input 
                  placeholder="Search assets..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8.5 bg-black/5 border-none rounded-lg pl-9 text-[12px] focus-visible:ring-1 focus-visible:ring-accent/20"
                />
             </form>
          </div>

          <div className="flex items-center justify-end gap-2 lg:w-1/4">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="hidden sm:flex rounded-full h-9 w-9 text-muted-foreground hover:text-primary" asChild>
                <Link href="/wishlist">
                  <Heart className={cn("h-4.5 w-4.5", itemIds.length > 0 && "fill-accent text-accent")} />
                </Link>
              </Button>

              <Button variant="ghost" size="icon" className="relative rounded-full h-9 w-9 text-muted-foreground hover:text-primary" onClick={() => setIsCartOpen(true)}>
                <ShoppingCart className="h-4.5 w-4.5" />
                {cartItemCount > 0 && (
                  <span className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-accent text-[8px] font-bold text-white flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </div>

            <div className="h-4 w-px bg-border mx-2 hidden sm:block" />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 border border-border hover:border-primary/20 transition-all">
                    <Avatar className="h-full w-full">
                      <AvatarImage src={user.photoURL || ''} />
                      <AvatarFallback className="bg-muted text-primary font-bold text-[10px]">{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mt-2 p-1.5 rounded-xl border border-border shadow-2xl bg-white" align="end">
                  <div className="p-2 space-y-0.5">
                    <p className="text-xs font-bold truncate">{user.displayName || 'Creator'}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="space-y-0.5">
                    {isAdmin && (
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer h-9 text-xs font-medium">
                        <Link href="/admin"><ShieldCheck className="h-3.5 w-3.5 mr-2 text-accent" /> Admin Terminal</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer h-9 text-xs font-medium">
                      <Link href="/dashboard"><LayoutDashboard className="h-3.5 w-3.5 mr-2 text-accent" /> My Vault</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer h-9 text-xs font-medium">
                      <Link href="/dashboard/settings"><Settings className="h-3.5 w-3.5 mr-2 text-accent" /> Settings</Link>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="rounded-lg text-destructive cursor-pointer h-9 text-xs font-medium focus:bg-destructive/5" onClick={handleSignOut}>
                    <LogOut className="h-3.5 w-3.5 mr-2" /> End Session
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="hidden sm:block">
                  <Button variant="ghost" className="text-xs font-semibold h-9 px-4">Log in</Button>
                </Link>
                <Link href="/products">
                  <Button className="h-9 px-5 text-xs font-bold rounded-lg shadow-sm">
                    Explore
                  </Button>
                </Link>
              </div>
            )}
            
            <div className="xl:hidden ml-1">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 bg-white border-none p-0">
                   <SheetHeader className="p-8 border-b border-border">
                      <SheetTitle className="text-xl font-bold flex items-center gap-3">
                         <div className="relative h-7 w-7 rounded-lg overflow-hidden bg-primary">
                            <Image src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png" alt="Logo" fill />
                         </div>
                         Prontly Store
                      </SheetTitle>
                   </SheetHeader>
                   <div className="p-8 space-y-6">
                      <nav className="flex flex-col gap-4">
                         <Link href="/" className="text-base font-semibold">Home</Link>
                         <Link href="/products" className="text-base font-semibold">All Products</Link>
                         <Link href="/products?view=categories" className="text-base font-semibold">Categories</Link>
                         <Link href="/blog" className="text-base font-semibold">Blog & Guides</Link>
                      </nav>
                      <div className="h-px w-full bg-border" />
                      <div className="pt-4">
                         <Button className="w-full h-12 rounded-xl text-sm font-bold" asChild>
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
