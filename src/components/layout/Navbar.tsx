'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Heart, ShieldCheck, LayoutDashboard, Settings, LogOut, Zap, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user, role } = useUser();
  const auth = useAuth();
  const db = useFirestore();
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
          "fixed top-0 left-0 right-0 z-50 px-4 transition-all duration-500 flex justify-center pointer-events-none",
          isScrolled ? "pt-4" : "pt-8"
        )}
      >
        <nav 
          className={cn(
            "w-full max-w-7xl h-16 flex items-center justify-between px-6 transition-all duration-500 rounded-2xl pointer-events-auto border",
            isScrolled 
              ? "bg-white/80 backdrop-blur-2xl border-white/50 shadow-2xl platinum-shadow" 
              : "bg-transparent border-transparent"
          )}
        >
          <div className="flex items-center gap-12">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-white/5 shadow-lg transition-all group-hover:scale-110 active:scale-95">
                <Image 
                  src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png" 
                  alt="Prontly Logo" 
                  fill 
                  className="object-cover"
                />
              </div>
              <span className={cn(
                "font-headline text-2xl font-bold tracking-tighter transition-colors",
                isScrolled ? "text-midnight-ink" : "text-midnight-ink"
              )}>Prontly</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <Link href="/products" className="text-sm font-bold text-slate-blue hover:text-primary transition-colors uppercase tracking-widest">Marketplace</Link>
              <Link href="/blog" className="text-sm font-bold text-slate-blue hover:text-primary transition-colors uppercase tracking-widest">Resources</Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 border-r border-stone-gray/10 pr-3 mr-1">
              <Button variant="ghost" size="icon" className="text-slate-blue hover:text-primary rounded-full transition-all h-10 w-10 active:scale-90" asChild title="Wishlist">
                <Link href="/wishlist">
                  <Heart className={cn("h-4 w-4", itemIds.length > 0 && "fill-primary text-primary")} />
                </Link>
              </Button>

              <Button variant="ghost" size="icon" className="relative text-slate-blue hover:text-primary rounded-full transition-all h-10 w-10 active:scale-90" onClick={() => setIsCartOpen(true)} title="Cart">
                <ShoppingCart className="h-4 w-4" />
                {cartItemCount > 0 && (
                  <span className="absolute top-2 right-2 h-3.5 w-3.5 rounded-full bg-primary border-2 border-white text-[8px] font-black text-white flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </div>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 border border-stone-gray/10 hover:border-primary transition-all overflow-hidden active:scale-95">
                    <Avatar className="h-full w-full">
                      <AvatarImage src={user.photoURL || ''} />
                      <AvatarFallback className="bg-primary/5 text-primary font-bold text-xs uppercase">{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72 mt-3 p-2 rounded-2xl border border-stone-gray/20 shadow-2xl bg-white/95 backdrop-blur-2xl" align="end">
                  <DropdownMenuLabel className="font-normal p-4">
                    <div className="flex flex-col space-y-1">
                      <p className="text-base font-bold text-midnight-ink truncate">{user.displayName || 'Creator'}</p>
                      <p className="text-[11px] text-slate-blue truncate font-medium uppercase tracking-widest">{user.email}</p>
                      <div className="pt-3">
                         <Badge variant="outline" className="text-[9px] uppercase tracking-widest font-black py-0.5 px-3 border-primary/20 text-primary bg-primary/5">
                           {role} Level Identity
                         </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-stone-gray/5 mx-1" />
                  <div className="p-1 space-y-1">
                    {isAdmin && (
                      <DropdownMenuItem asChild className="rounded-xl focus:bg-primary/5 focus:text-primary cursor-pointer h-11">
                        <Link href="/admin" className="flex items-center gap-3 p-3 text-sm font-bold">
                          <ShieldCheck className="h-4 w-4" /> Admin Intelligence
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild className="rounded-xl focus:bg-primary/5 focus:text-primary cursor-pointer h-11">
                      <Link href="/dashboard" className="flex items-center gap-3 p-3 text-sm font-bold">
                        <LayoutDashboard className="h-4 w-4" /> Digital Vault
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-xl focus:bg-primary/5 focus:text-primary cursor-pointer h-11">
                      <Link href="/dashboard/settings" className="flex items-center gap-3 p-3 text-sm font-bold">
                        <Settings className="h-4 w-4" /> Account Protocol
                      </Link>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator className="bg-stone-gray/5 mx-1" />
                  <div className="p-1">
                    <DropdownMenuItem className="rounded-xl text-destructive focus:bg-destructive/5 focus:text-destructive cursor-pointer h-11 text-sm font-bold" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" /> Terminate Session
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="hidden sm:block">
                  <Button variant="ghost" className="text-slate-blue hover:text-midnight-ink font-bold text-sm px-6 h-10 uppercase tracking-widest">Log in</Button>
                </Link>
                <Link href="/signup">
                  <Button className="h-10 px-8 rounded-xl bg-deep-violet hover:bg-deep-violet/90 text-white font-bold text-sm shadow-lg stripe-shadow transition-all active:scale-95 uppercase tracking-widest">
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