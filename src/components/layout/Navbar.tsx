'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Heart, ShieldCheck, LayoutDashboard, Settings, LogOut, Zap } from 'lucide-react';
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

export function Navbar() {
  const { user, role } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { getItemCount } = useCart();
  const { itemIds } = useWishlist();
  const [isCartOpen, setIsCartOpen] = useState(false);
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

  const cartItemCount = mounted ? getItemCount() : 0;

  return (
    <>
      <header className="fixed top-6 left-0 right-0 z-50 px-4 flex justify-center pointer-events-none">
        <nav className="w-full max-w-5xl h-16 flex items-center justify-between px-6 bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] pointer-events-auto">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-white/5 shadow-lg transition-all group-hover:scale-110">
                <Image 
                  src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png" 
                  alt="Prontly Logo" 
                  fill 
                  className="object-cover"
                />
              </div>
              <span className="font-bold text-xl tracking-tight text-foreground font-script">Prontly Store</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/products" className="text-sm font-semibold text-slate-blue hover:text-deep-violet transition-colors">Marketplace</Link>
              <Link href="/blog" className="text-sm font-semibold text-slate-blue hover:text-deep-violet transition-colors">Resources</Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 border-r border-stone-gray/20 pr-3 mr-1">
              <Button variant="ghost" size="icon" className="text-slate-blue hover:text-deep-violet rounded-full transition-colors h-9 w-9" asChild title="Wishlist">
                <Link href="/wishlist">
                  <Heart className="h-[14px] w-[14px]" />
                </Link>
              </Button>

              <Button variant="ghost" size="icon" className="relative text-slate-blue hover:text-deep-violet rounded-full transition-colors h-9 w-9" onClick={() => setIsCartOpen(true)} title="Cart">
                <ShoppingCart className="h-[14px] w-[14px]" />
                {cartItemCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-deep-violet border-2 border-white" />
                )}
              </Button>
            </div>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 border border-stone-gray/20 hover:border-deep-violet transition-colors overflow-hidden">
                    <Avatar className="h-full w-full">
                      <AvatarImage src={user.photoURL || ''} />
                      <AvatarFallback className="bg-powder-blue text-deep-violet font-bold text-xs uppercase">{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 mt-3 p-2 rounded-2xl border border-stone-gray/20 shadow-2xl bg-white/95 backdrop-blur-xl" align="end">
                  <DropdownMenuLabel className="font-normal p-3">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-bold text-midnight-ink truncate">{user.displayName || 'Creator'}</p>
                      <p className="text-[11px] text-slate-blue truncate font-medium">{user.email}</p>
                      <div className="pt-2">
                         <Badge variant="outline" className="text-[9px] uppercase tracking-widest font-black py-0 px-2 border-deep-violet/20 text-deep-violet bg-deep-violet/5">
                           {role}
                         </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-stone-gray/10 mx-1" />
                  <div className="p-1">
                    {isAdmin && (
                      <DropdownMenuItem asChild className="rounded-xl focus:bg-deep-violet/5 focus:text-deep-violet cursor-pointer">
                        <Link href="/admin" className="flex items-center gap-3 p-2 text-sm font-bold">
                          <ShieldCheck className="h-4 w-4" /> Admin Terminal
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild className="rounded-xl focus:bg-deep-violet/5 focus:text-deep-violet cursor-pointer">
                      <Link href="/dashboard" className="flex items-center gap-3 p-2 text-sm font-bold">
                        <LayoutDashboard className="h-4 w-4" /> My Library
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-xl focus:bg-deep-violet/5 focus:text-deep-violet cursor-pointer">
                      <Link href="/dashboard/settings" className="flex items-center gap-3 p-2 text-sm font-bold">
                        <Settings className="h-4 w-4" /> Settings
                      </Link>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator className="bg-stone-gray/10 mx-1" />
                  <div className="p-1">
                    <DropdownMenuItem className="rounded-xl text-destructive focus:bg-destructive/5 focus:text-destructive cursor-pointer p-2 text-sm font-bold" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-1" /> Sign Out
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="hidden sm:block">
                  <Button variant="ghost" className="text-slate-blue hover:text-midnight-ink font-bold text-sm px-4 h-9">Log in</Button>
                </Link>
                <Link href="/signup">
                  <Button className="h-9 px-5 rounded-full bg-deep-violet hover:bg-deep-violet/90 text-white font-bold text-sm shadow-md shadow-deep-violet/20 transition-all active:scale-95">
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </nav>
      </header>
      <div className="h-28" /> {/* Fixed spacer for floating navbar */}
      <CartDrawer open={isCartOpen} onOpenChange={setIsCartOpen} />
    </>
  );
}
