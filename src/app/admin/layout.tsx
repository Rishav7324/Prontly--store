'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Loader2, ShieldAlert, Menu, Zap, Bell, Search, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  
  const userProfileQuery = useMemoFirebase(() => {
    return user && db ? doc(db, 'users', user.uid) : null;
  }, [db, user]);

  const { data: profile, loading: profileLoading } = useDoc(userProfileQuery);

  // Command palette shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandOpen((open) => !open);
      }
    }
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (authLoading || profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-primary">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super-admin';

  if (!user || !isAdmin) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <div className="mb-6 rounded-full bg-destructive/10 p-4">
          <ShieldAlert className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="mb-2 text-3xl font-bold font-headline">Access Denied</h1>
        <p className="mb-8 max-w-md text-muted-foreground">
          You do not have the required permissions to access the admin dashboard. 
        </p>
        <div className="flex gap-4">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/">Return to Store</Link>
          </Button>
          {!user && (
            <Button asChild className="rounded-full">
              <Link href="/login">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  const navigate = (href: string) => {
    setIsCommandOpen(false);
    router.push(href);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b bg-card/50 px-4 backdrop-blur-xl lg:px-8">
          <div className="flex items-center gap-4">
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 bg-card border-r border-white/5">
                <AdminSidebar onMobileSelect={() => setIsMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            
            <Link href="/" className="flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/20">
                <Zap className="h-5 w-5 text-white" fill="currentColor" />
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-4">
              <Button 
                variant="outline" 
                className="relative h-9 w-64 justify-start bg-muted/30 border-none px-4 rounded-full text-xs text-muted-foreground hover:bg-muted/50 transition-all"
                onClick={() => setIsCommandOpen(true)}
              >
                <Search className="mr-2 h-4 w-4" />
                <span>Search Admin...</span>
                <kbd className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div className="absolute top-2 right-2 h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
            </Button>
            <div className="h-8 w-[1px] bg-white/5 mx-2 hidden sm:block" />
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-sm font-bold leading-none">{profile?.displayName || 'Admin'}</span>
                <span className="text-[10px] text-primary font-bold uppercase tracking-wider">{profile?.role}</span>
              </div>
              <Avatar className="h-9 w-9 border-2 border-primary/20">
                <AvatarImage src={profile?.photoURL} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">{profile?.displayName?.charAt(0) || 'A'}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background/50 p-4 md:p-8 lg:p-10">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Advanced Command Palette */}
      <CommandDialog open={isCommandOpen} onOpenChange={setIsCommandOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Management">
            <CommandItem onSelect={() => navigate('/admin/products')}>
              <Zap className="mr-2 h-4 w-4" /> Products
            </CommandItem>
            <CommandItem onSelect={() => navigate('/admin/orders')}>
              <Zap className="mr-2 h-4 w-4" /> Orders
            </CommandItem>
            <CommandItem onSelect={() => navigate('/admin/users')}>
              <Zap className="mr-2 h-4 w-4" /> Customers
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Marketing">
            <CommandItem onSelect={() => navigate('/admin/emails')}>
              <Zap className="mr-2 h-4 w-4" /> Email Templates
            </CommandItem>
            <CommandItem onSelect={() => navigate('/admin/newsletter')}>
              <Zap className="mr-2 h-4 w-4" /> Newsletter Broadcast
            </CommandItem>
            <CommandItem onSelect={() => navigate('/admin/blog')}>
              <Zap className="mr-2 h-4 w-4" /> Blog Articles
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="System">
            <CommandItem onSelect={() => navigate('/admin/settings')}>
              <Zap className="mr-2 h-4 w-4" /> Store Settings
            </CommandItem>
            <CommandItem onSelect={() => navigate('/admin/storage')}>
              <Zap className="mr-2 h-4 w-4" /> Cloud Storage
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
