'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ShoppingCart, 
  Heart, 
  ShieldCheck, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Search, 
  Menu, 
  Package,
  Layers,
  BookOpen,
  Sparkles,
} from 'lucide-react';
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
  const pathname = usePathname();
  const { getItemCount } = useCart();
  const { itemIds } = useWishlist();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll, { passive: true });

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
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
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  const cartItemCount = mounted ? getItemCount() : 0;
  const wishlistItemCount = mounted ? itemIds.length : 0;

  const navLinks = [
    { label: 'Products', href: '/products', icon: Package },
    { label: 'Categories', href: '/products?view=categories', icon: Layers },
    { label: 'Sell Prompts', href: '/sell', icon: Sparkles },
    { label: 'Blog', href: '/blog', icon: BookOpen },
  ];

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 px-3 sm:px-6 py-2.5 flex justify-center overflow-x-hidden max-w-[100vw]">
        <nav 
          aria-label="Main Navigation"
          className={cn(
            'w-full max-w-6xl h-13 min-h-[52px] flex items-center justify-between px-3.5 sm:px-5 transition-all duration-300 rounded-2xl border',
            isScrolled 
              ? 'bg-white/90 backdrop-blur-xl border-border/80 shadow-md ring-1 ring-black/[0.03]' 
              : 'bg-white/75 backdrop-blur-md border-border/50 shadow-sm'
          )}
        >
          {/* Brand Logo */}
          <div className="flex items-center gap-5 sm:gap-7 min-w-0">
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg p-0.5">
              <div className="relative h-7 w-7 sm:h-8 sm:w-8 rounded-xl overflow-hidden shadow-sm border border-border/40 transition-transform duration-300 group-hover:scale-105">
                <Image 
                  src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png" 
                  alt="Prontly Logo" 
                  fill 
                  sizes="32px"
                  className="object-cover" 
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm sm:text-base tracking-tight leading-none text-foreground group-hover:text-accent transition-colors">
                  Prontly
                </span>
                <span className="text-[9px] font-semibold text-muted-foreground tracking-wider uppercase leading-none mt-0.5">
                  Store
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href) && !item.href.includes('?'));
                return (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    className={cn(
                      'text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5',
                      isActive 
                        ? 'bg-muted text-foreground font-semibold shadow-xs' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5 opacity-70" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Desktop Search Bar */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-[260px] mx-3 min-w-0">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-accent transition-colors" />
              <Input 
                ref={searchInputRef}
                placeholder="Search assets, templates…" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8.5 bg-muted/60 hover:bg-muted/80 border-border/40 hover:border-border rounded-xl pl-8 pr-11 text-xs focus-visible:ring-1 focus-visible:ring-accent transition-all placeholder:text-muted-foreground/70" 
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-4.5 select-none items-center gap-0.5 rounded border border-border/80 bg-white px-1.5 font-mono text-[9px] font-medium text-muted-foreground shadow-2xs">
                <span className="text-[10px]">⌘</span>K
              </kbd>
            </div>
          </form>

          {/* User & Action Items */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Wishlist button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative rounded-xl h-8.5 w-8.5 text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors" 
              asChild
              aria-label="View wishlist"
            >
              <Link href="/wishlist">
                <Heart className={cn("h-4 w-4 transition-transform active:scale-90", wishlistItemCount > 0 && "fill-rose-500 text-rose-500")} />
                {wishlistItemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center shadow-xs">
                    {wishlistItemCount}
                  </span>
                )}
              </Link>
            </Button>

            {/* Cart Drawer Trigger Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative rounded-xl h-8.5 w-8.5 text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors" 
              onClick={() => setIsCartOpen(true)}
              aria-label={`Open shopping cart with ${cartItemCount} items`}
            >
              <ShoppingCart className="h-4 w-4 transition-transform active:scale-90" />
              {cartItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-accent text-[9px] font-bold text-white flex items-center justify-center shadow-xs animate-in zoom-in">
                  {cartItemCount}
                </span>
              )}
            </Button>

            <div className="h-4.5 w-px bg-border/60 mx-1 hidden sm:block" />

            {/* User Account / Auth state */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 overflow-hidden ring-1 ring-border/80 hover:ring-accent transition-all focus-visible:ring-2 focus-visible:ring-accent">
                    <Avatar className="h-full w-full rounded-full">
                      <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                      <AvatarFallback className="bg-accent/10 text-accent font-bold text-xs">
                        {user.displayName?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-52 mt-2 p-1.5 rounded-xl border border-border/80 bg-white/95 backdrop-blur-md shadow-xl" align="end">
                  <div className="px-2.5 py-2">
                    <p className="text-xs font-bold text-foreground truncate">{user.displayName || 'Creator'}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer text-xs py-2 focus:bg-accent/10 focus:text-accent">
                      <Link href="/admin"><ShieldCheck className="h-4 w-4 mr-2 text-accent" /> Admin Portal</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer text-xs py-2 focus:bg-accent/10 focus:text-accent">
                    <Link href="/dashboard"><LayoutDashboard className="h-4 w-4 mr-2 text-muted-foreground" /> Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer text-xs py-2 focus:bg-accent/10 focus:text-accent">
                    <Link href="/dashboard/downloads"><Package className="h-4 w-4 mr-2 text-muted-foreground" /> My Downloads</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer text-xs py-2 focus:bg-accent/10 focus:text-accent">
                    <Link href="/dashboard/settings"><Settings className="h-4 w-4 mr-2 text-muted-foreground" /> Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="rounded-lg text-destructive cursor-pointer text-xs py-2 focus:bg-destructive/10 focus:text-destructive" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link href="/login" className="hidden sm:inline-block">
                  <Button variant="ghost" className="text-xs font-medium h-8 px-3 rounded-lg hover:bg-muted/70">
                    Log in
                  </Button>
                </Link>
                <Link href="/products">
                  <Button className="h-8 px-3.5 text-xs font-semibold rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 shadow-xs">
                    Explore
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Sheet Menu */}
            <div className="md:hidden ml-0.5">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8.5 w-8.5 rounded-xl hover:bg-muted/70" aria-label="Toggle mobile menu">
                    <Menu className="h-4.5 w-4.5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] max-w-[320px] bg-white p-0 flex flex-col justify-between">
                  <div>
                    <SheetHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
                      <SheetTitle className="text-sm font-bold flex items-center gap-2.5">
                        <div className="relative h-6 w-6 rounded-lg overflow-hidden border">
                          <Image src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png" alt="Prontly" fill className="object-cover" />
                        </div>
                        Prontly Store
                      </SheetTitle>
                    </SheetHeader>

                    {/* Mobile Search Form */}
                    <div className="p-4 pb-2">
                      <form onSubmit={handleSearch} className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input 
                          placeholder="Search digital assets…" 
                          value={searchQuery} 
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full h-9 bg-muted/60 rounded-xl pl-8.5 text-xs focus-visible:ring-1 focus-visible:ring-accent" 
                        />
                      </form>
                    </div>

                    {/* Mobile Navigation List */}
                    <div className="px-3 py-2 space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-1">Navigation</p>
                      {[
                        { label: 'Home', href: '/', icon: Sparkles },
                        { label: 'All Products', href: '/products', icon: Package },
                        { label: 'Categories', href: '/products?view=categories', icon: Layers },
                        { label: 'Blog & Guides', href: '/blog', icon: BookOpen },
                        { label: 'Wishlist', href: '/wishlist', icon: Heart, count: wishlistItemCount },
                      ].map((item) => (
                        <Link 
                          key={item.href} 
                          href={item.href} 
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors',
                            pathname === item.href ? 'bg-muted font-semibold text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                          )}
                        >
                          <span className="flex items-center gap-2.5">
                            <item.icon className="h-4 w-4 opacity-70" />
                            {item.label}
                          </span>
                          {item.count !== undefined && item.count > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent font-bold text-[10px]">
                              {item.count}
                            </span>
                          )}
                        </Link>
                      ))}

                      {user && (
                        <>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 pt-3 pb-1">My Account</p>
                          <Link 
                            href="/dashboard" 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                          >
                            <LayoutDashboard className="h-4 w-4 opacity-70" />
                            Dashboard
                          </Link>
                          <Link 
                            href="/dashboard/downloads" 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                          >
                            <Package className="h-4 w-4 opacity-70" />
                            Downloads
                          </Link>
                          {isAdmin && (
                            <Link 
                              href="/admin" 
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-accent hover:bg-accent/10"
                            >
                              <ShieldCheck className="h-4 w-4" />
                              Admin Portal
                            </Link>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Mobile Footer Area */}
                  <div className="p-4 border-t bg-muted/20 space-y-2.5">
                    {user ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="h-8 w-8 rounded-full border">
                            <AvatarImage src={user.photoURL || ''} />
                            <AvatarFallback className="text-xs font-bold bg-accent/10 text-accent">
                              {user.displayName?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate leading-tight">{user.displayName || 'User'}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive rounded-lg"
                          onClick={handleSignOut}
                          aria-label="Sign out"
                        >
                          <LogOut className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button className="w-full h-9 rounded-xl text-xs font-semibold bg-zinc-900 text-white" asChild onClick={() => setIsMobileMenuOpen(false)}>
                          <Link href="/login">Log in to account</Link>
                        </Button>
                        <Button variant="outline" className="w-full h-9 rounded-xl text-xs font-semibold" asChild onClick={() => setIsMobileMenuOpen(false)}>
                          <Link href="/signup">Create account</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </nav>
      </header>

      {/* Cart Drawer */}
      <CartDrawer open={isCartOpen} onOpenChange={setIsCartOpen} />
    </>
  );
}
