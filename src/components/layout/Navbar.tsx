'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Heart, ShieldCheck, LayoutDashboard, Settings, LogOut, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user, role } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { getItemCount } = useCart();
  const { itemIds } = useWishlist();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
            "w-full max-w-6xl h-14 flex items-center justify-between px-4 transition-all duration-300 rounded-xl pointer-events-auto border",
            isScrolled 
              ? "bg-white/80 backdrop-blur-xl border-white/40 shadow-xl" 
              : "bg-transparent border-transparent"
          )}
        >
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative h-7 w-7 overflow-hidden rounded-lg bg-white/5 transition-transform group-hover:scale-105">
                <Image 
                  src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png" 
                  alt="Prontly Logo" 
                  fill 
                  className="object-cover"
                />
              </div>
              <span className="font-headline text-lg font-bold tracking-tighter text-midnight-ink">Prontly</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              <Link href="/products" className="text-[10px] font-bold text-slate-blue hover:text-primary transition-colors uppercase tracking-[0.15em]">Marketplace</Link>
              <Link href="/blog" className="text-[10px] font-bold text-slate-blue hover:text-primary transition-colors uppercase tracking-[0.15em]">Resources</Link>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 border-r border-stone-gray/10 pr-2 mr-1">
              <Button variant="ghost" size="icon" className="text-slate-blue hover:text-primary rounded-full h-9 w-9" asChild>
                <Link href="/wishlist">
                  <Heart className={cn("h-4 w-4", itemIds.length > 0 && "fill-primary text-primary")} />
                </Link>
              </Button>

              <Button variant="ghost" size="icon" className="relative text-slate-blue hover:text-primary rounded-full h-9 w-9" onClick={() => setIsCartOpen(true)}>
                <ShoppingCart className="h-4 w-4" />
                {cartItemCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-3 w-3 rounded-full bg-primary border border-white text-[7px] font-black text-white flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </div>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 border border-stone-gray/10 hover:border-primary transition-all active:scale-95">
                    <Avatar className="h-full w-full">
                      <AvatarImage src={user.photoURL || ''} />
                      <AvatarFallback className="bg-primary/5 text-primary font-bold text-[10px]">{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mt-2 p-1.5 rounded-xl border border-stone-gray/20 shadow-2xl bg-white/95 backdrop-blur-xl" align="end">
                  <div className="p-2 space-y-0.5">
                    <p className="text-xs font-bold text-midnight-ink truncate">{user.displayName || 'Creator'}</p>
                    <p className="text-[9px] text-slate-blue truncate font-medium uppercase tracking-wider">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-stone-gray/5" />
                  <div className="space-y-1">
                    {isAdmin && (
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer h-9 text-[11px] font-bold">
                        <Link href="/admin"><ShieldCheck className="h-3.5 w-3.5 mr-2" /> Admin Center</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer h-9 text-[11px] font-bold">
                      <Link href="/dashboard"><LayoutDashboard className="h-3.5 w-3.5 mr-2" /> Library</Link>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator className="bg-stone-gray/5" />
                  <DropdownMenuItem className="rounded-lg text-destructive cursor-pointer h-9 text-[11px] font-bold" onClick={handleSignOut}>
                    <LogOut className="h-3.5 w-3.5 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" className="text-slate-blue hover:text-midnight-ink font-bold text-[10px] px-3 h-8 uppercase tracking-wider">Log in</Button>
                </Link>
                <Link href="/signup">
                  <Button className="h-8 px-4 rounded-lg bg-deep-violet text-white font-bold text-[10px] shadow-sm uppercase tracking-wider">
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </nav>
      </header>
      <CartDrawer open={isCartOpen} onOpenChange={setIsCartOpen} />
    </>
  );
}