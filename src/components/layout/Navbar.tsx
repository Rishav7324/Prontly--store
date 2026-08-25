'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Heart, ShieldCheck, LayoutDashboard, Settings, LogOut, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
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
    if (searchQuery.trim()) router.push(`/products?q=${encodeURIComponent(searchQuery)}`);
  };

  const cartItemCount = mounted ? getItemCount() : 0;

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 px-3 sm:px-4 flex justify-center overflow-x-hidden max-w-[100vw]">
        <nav className={cn(
          'w-full max-w-5xl h-12 flex items-center justify-between px-3 md:px-4 transition-all duration-200 rounded-xl border',
          isScrolled ? 'bg-white/90 backdrop-blur-md border-border/60 shadow-sm' : 'bg-white/60 backdrop-blur-sm border-transparent'
        )}>
          {/* Logo + Links */}
          <div className="flex items-center gap-4 md:gap-6 min-w-0 flex-1 lg:flex-none">
            <Link href="/" className="flex items-center gap-2 shrink-0 group">
              <div className="relative h-6 w-6 rounded-md overflow-hidden transition-transform group-hover:scale-105">
                <Image src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png" alt="Prontly" fill className="object-cover" />
              </div>
              <span className="font-semibold text-sm tracking-tight hidden sm:inline">Prontly</span>
            </Link>
            <nav className="hidden md:flex items-center gap-4">
              {[
                ['Products', '/products'],
                ['Categories', '/products?view=categories'],
                ['Blog', '/blog'],
              ].map(([label, href]) => (
                <Link key={href} href={href} className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">{label}</Link>
              ))}
            </nav>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-[220px] mx-2 min-w-0">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/60" />
              <Input placeholder="Search…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 bg-muted/70 border-none rounded-lg pl-7 text-xs focus-visible:ring-1 focus-visible:ring-accent/30" />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            <Button variant="ghost" size="icon" className="hidden sm:flex rounded-lg h-8 w-8 text-muted-foreground hover:text-foreground" asChild>
              <Link href="/wishlist"><Heart className={cn("h-4 w-4", itemIds.length > 0 && "fill-accent text-accent")} /></Link>
            </Button>

            <Button variant="ghost" size="icon" className="relative rounded-lg h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setIsCartOpen(true)}>
              <ShoppingCart className="h-4 w-4" />
              {cartItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-0.5 rounded-full bg-accent text-[9px] font-bold text-white flex items-center justify-center">{cartItemCount}</span>
              )}
            </Button>

            <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-7 w-7 rounded-full p-0 overflow-hidden ring-1 ring-border hover:ring-accent/40 transition-all">
                    <Avatar className="h-full w-full rounded-full">
                      <AvatarImage src={user.photoURL || ''} />
                      <AvatarFallback className="bg-muted text-accent font-bold text-[10px]">{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 mt-1.5 p-1 rounded-lg border shadow-lg" align="end">
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-semibold truncate">{user.displayName || 'Creator'}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <DropdownMenuItem asChild className="rounded-md cursor-pointer text-xs">
                      <Link href="/admin"><ShieldCheck className="h-3.5 w-3.5 mr-2 text-accent" /> Admin</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild className="rounded-md cursor-pointer text-xs">
                    <Link href="/dashboard"><LayoutDashboard className="h-3.5 w-3.5 mr-2 text-accent" /> Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-md cursor-pointer text-xs">
                    <Link href="/dashboard/settings"><Settings className="h-3.5 w-3.5 mr-2 text-accent" /> Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="rounded-md text-destructive cursor-pointer text-xs" onClick={handleSignOut}>
                    <LogOut className="h-3.5 w-3.5 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link href="/login" className="hidden sm:block">
                  <Button variant="ghost" className="text-xs font-medium h-7 px-3">Log in</Button>
                </Link>
                <Link href="/products">
                  <Button className="h-7 px-3.5 text-xs font-semibold rounded-lg">Explore</Button>
                </Link>
              </div>
            )}

            {/* Mobile menu */}
            <div className="md:hidden ml-0.5">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><Menu className="h-4 w-4" /></Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[75vw] max-w-[280px] bg-white p-0 overflow-x-hidden">
                  <SheetHeader className="p-5 border-b">
                    <SheetTitle className="text-base font-semibold flex items-center gap-2">
                      <div className="relative h-5 w-5 rounded overflow-hidden"><Image src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png" alt="" fill /></div>
                      Prontly
                    </SheetTitle>
                  </SheetHeader>
                  <div className="p-5 space-y-1">
                    {[['Home','/'],['Products','/products'],['Categories','/products?view=categories'],['Blog','/blog'],['Wishlist','/wishlist']].map(([l,h]) => (
                      <Link key={h} href={h} className="block py-2 text-sm font-medium hover:text-accent transition-colors">{l}</Link>
                    ))}
                    {!user && (
                      <div className="pt-3 mt-3 border-t space-y-2">
                        <Button className="w-full h-9 rounded-lg text-xs font-semibold" asChild><Link href="/login">Log in</Link></Button>
                        <Button variant="outline" className="w-full h-9 rounded-lg text-xs font-semibold" asChild><Link href="/signup">Sign up</Link></Button>
                      </div>
                    )}
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
