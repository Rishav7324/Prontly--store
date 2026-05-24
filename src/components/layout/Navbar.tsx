'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Search, User, Menu, Zap, LogOut, LayoutDashboard, Settings, ShieldCheck, ArrowRight, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
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
import { doc } from 'firebase/firestore';

export function Navbar() {
  const { user, role } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { getItemCount } = useCart();
  const { itemIds } = useWishlist();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'main') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  useEffect(() => {
    setMounted(true);
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
    }
  };

  const cartItemCount = mounted ? getItemCount() : 0;
  const wishlistCount = mounted ? itemIds.length : 0;

  return (
    <>
      {settings?.announcementBar?.isActive && (
        <div 
          className="w-full py-2 text-center text-xs font-bold uppercase tracking-widest relative z-[60]"
          style={{ 
            backgroundColor: settings.announcementBar.backgroundColor || '#5b52d6',
            color: settings.announcementBar.textColor || '#ffffff'
          }}
        >
          {settings.announcementBar.link ? (
            <Link href={settings.announcementBar.link} className="flex items-center justify-center gap-2 hover:opacity-80 transition-opacity">
              {settings.announcementBar.text}
              <ArrowRight className="h-3 w-3" />
            </Link>
          ) : (
            settings.announcementBar.text
          )}
        </div>
      )}

      <header className="sticky top-4 z-50 w-full px-4 md:px-6">
        <nav className="mx-auto max-w-7xl rounded-2xl border border-white/10 bg-background/60 shadow-2xl backdrop-blur-xl transition-all duration-300">
          <div className="flex h-16 items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-white/5 transition-transform group-hover:scale-105">
                  <Image 
                    src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png" 
                    alt="Prontly Logo" 
                    fill 
                    className="object-cover"
                  />
                </div>
                <span className="font-headline text-xl font-bold tracking-tight text-foreground hidden sm:block">
                  PRONTLY <span className="text-primary">STORE</span>
                </span>
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <Link href="/products" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Browse</Link>
                <Link href="/products?category=prompts" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">AI Prompts</Link>
                <Link href="/products?category=templates" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Templates</Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <form onSubmit={handleSearch} className="relative hidden lg:block w-48 xl:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search assets..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary h-9 text-xs"
                />
              </form>
              
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-red-500/10 hover:text-red-500" asChild>
                  <Link href="/wishlist">
                    <Heart className="h-5 w-5" />
                    {wishlistCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>
                </Button>

                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary" onClick={() => setIsCartOpen(true)}>
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white ring-2 ring-background">
                      {cartItemCount}
                    </span>
                  )}
                </Button>
              </div>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 overflow-hidden ring-offset-background transition-all hover:ring-2 hover:ring-primary">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                        <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 mt-2" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none truncate">{user.displayName || 'Creator'}</p>
                        <p className="text-[10px] leading-none text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer text-primary font-bold">
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          <span>Admin Panel</span>
                        </Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Library & History</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Profile Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive cursor-pointer" onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="hidden sm:block">
                    <Button variant="ghost" size="sm" className="rounded-full px-4">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button size="sm" className="rounded-full px-5 shadow-lg shadow-primary/20">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>
      <CartDrawer open={isCartOpen} onOpenChange={setIsCartOpen} />
    </>
  );
}
