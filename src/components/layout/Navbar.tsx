'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Heart, ShieldCheck, LayoutDashboard, Settings, LogOut, User } from 'lucide-react';
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
      <header className="sticky top-0 z-50 w-full border-b border-chalk bg-background/80 backdrop-blur-md">
        <nav className="mx-auto max-w-[1200px] h-[72px] flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-12">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-powder">
                <Image 
                  src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png" 
                  alt="Prontly Logo" 
                  fill 
                  className="object-cover"
                />
              </div>
              <span className="font-medium text-lg tracking-tight text-obsidian uppercase">Prontly</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/products" className="text-sm font-medium text-gravel hover:text-obsidian transition-colors">Marketplace</Link>
              <Link href="/blog" className="text-sm font-medium text-gravel hover:text-obsidian transition-colors">Resources</Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 border-r border-chalk pr-4 mr-2">
              <Button variant="ghost" size="icon" className="text-gravel" asChild>
                <Link href="/wishlist">
                  <Heart className="h-4 w-4" />
                </Link>
              </Button>

              <Button variant="ghost" size="icon" className="relative text-gravel" onClick={() => setIsCartOpen(true)}>
                <ShoppingCart className="h-4 w-4" />
                {cartItemCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-obsidian" />
                )}
              </Button>
            </div>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9 border border-chalk">
                      <AvatarImage src={user.photoURL || ''} />
                      <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mt-2 rounded-2xl border-chalk" align="end">
                  <DropdownMenuLabel className="font-normal p-4">
                    <p className="text-sm font-semibold text-obsidian">{user.displayName || 'Creator'}</p>
                    <p className="text-[10px] text-gravel uppercase tracking-widest">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-chalk" />
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center gap-2 p-3">
                        <ShieldCheck className="h-4 w-4" /> Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2 p-3">
                      <LayoutDashboard className="h-4 w-4" /> My Library
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive p-3" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" className="text-gravel">Login</Button>
                </Link>
                <Link href="/signup">
                  <Button className="h-10 px-6">Join</Button>
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