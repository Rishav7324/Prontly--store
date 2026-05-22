
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Search, User, Menu, Zap, LogOut, LayoutDashboard, Settings, ShieldCheck } from 'lucide-react';
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
import { CartDrawer } from '../store/CartDrawer';

export function Navbar() {
  const { user, role } = useUser();
  const auth = useAuth();
  const { getItemCount } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const isAdmin = role === 'admin' || role === 'super-admin';

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
    }
  };

  return (
    <>
      <header className="sticky top-4 z-50 w-full px-4 md:px-6">
        <nav className="mx-auto max-w-7xl rounded-2xl border border-white/10 bg-background/60 shadow-2xl backdrop-blur-xl transition-all duration-300">
          <div className="flex h-16 items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
                  <Zap className="h-5 w-5 text-white" fill="currentColor" />
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
              <div className="relative hidden lg:block w-48 xl:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search assets..." 
                  className="pl-9 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary h-9 text-xs"
                />
              </div>
              
              <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary" onClick={() => setIsCartOpen(true)}>
                <ShoppingCart className="h-5 w-5" />
                {getItemCount() > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white ring-2 ring-background">
                    {getItemCount()}
                  </span>
                )}
              </Button>

              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 rounded-full">
                <Menu className="h-5 w-5" />
              </Button>

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
