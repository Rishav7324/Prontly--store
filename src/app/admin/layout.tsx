'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, useDoc, useAuth, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import {
  Loader2,
  ShieldAlert,
  Menu,
  Bell,
  Search,
  Package,
  ShoppingBag,
  Users,
  Mail,
  SendHorizontal,
  FileText,
  Settings,
  Database,
  ExternalLink,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  const userProfileQuery = useMemoFirebase(() => {
    return user && db ? doc(db, 'users', user.uid) : null;
  }, [db, user]);

  const { data: profile, loading: profileLoading } = useDoc(userProfileQuery);

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
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super-admin';

  if (!user || !isAdmin) {
    return (
      <div className="flex h-screen flex-col items-center justify-center overflow-x-hidden bg-background p-4 text-center min-w-0">
        <div className="mb-4 rounded-xl bg-destructive/10 p-3">
          <ShieldAlert className="h-6 w-6 text-destructive" />
        </div>
        <h1 className="mb-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Access Denied</h1>
        <p className="mb-5 max-w-xs text-xs text-muted-foreground">
          You do not have the required permissions to access the admin dashboard.
        </p>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="h-9 rounded-lg px-3 text-xs font-medium">
            <Link href="/">Return to Store</Link>
          </Button>
          {!user && (
            <Button asChild className="h-9 rounded-lg px-3 text-xs font-medium">
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

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
    }
  };

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-background text-foreground min-w-0">
      <div className="hidden lg:block shrink-0">
        <AdminSidebar />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center justify-between gap-2 border-b bg-card/80 px-3 md:px-4 backdrop-blur-xl min-w-0 overflow-x-hidden">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md lg:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 border-r bg-card p-0">
                <AdminSidebar onMobileSelect={() => setIsMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex items-center lg:hidden">
              <div className="relative h-7 w-7 overflow-hidden rounded-md bg-muted shadow-sm">
                <Image
                  src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png"
                  alt="Prontly Logo"
                  fill
                  className="object-cover"
                />
              </div>
            </Link>

            <Button
              variant="outline"
              className="relative hidden h-8 w-56 xl:w-72 items-center justify-start gap-2 rounded-lg border-none bg-muted/40 px-3 text-xs text-muted-foreground transition-colors hover:bg-muted/60 lg:flex"
              onClick={() => setIsCommandOpen(true)}
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search admin…</span>
              <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:flex">
                ⌘K
              </kbd>
            </Button>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-md">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 gap-2 rounded-full pl-1 pr-2">
                  <Avatar className="h-6 w-6 border border-border">
                    <AvatarImage src={profile?.photoURL} />
                    <AvatarFallback className="bg-accent/10 text-[10px] font-semibold text-accent">
                      {profile?.displayName?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden flex-col items-start leading-tight sm:flex">
                    <span className="max-w-32 truncate text-xs font-medium">{profile?.displayName || 'Admin'}</span>
                    <span className="text-[10px] capitalize text-muted-foreground leading-none">{profile?.role}</span>
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-lg">
                <DropdownMenuLabel className="text-xs">
                  <span className="block truncate font-medium">{profile?.displayName || 'Admin'}</span>
                  <span className="block truncate text-[10px] font-normal text-muted-foreground">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="text-xs">
                  <Link href="/" target="_blank">
                    <ExternalLink className="mr-2 h-3.5 w-3.5" /> View Store
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-xs text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-3.5 w-3.5" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-5">
          <div className="mx-auto w-full max-w-7xl min-w-0">
            {children}
          </div>
        </main>
      </div>

      <CommandDialog open={isCommandOpen} onOpenChange={setIsCommandOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Management">
            <CommandItem onSelect={() => navigate('/admin/products')}>
              <Package className="mr-2 h-4 w-4" /> Products
            </CommandItem>
            <CommandItem onSelect={() => navigate('/admin/orders')}>
              <ShoppingBag className="mr-2 h-4 w-4" /> Orders
            </CommandItem>
            <CommandItem onSelect={() => navigate('/admin/users')}>
              <Users className="mr-2 h-4 w-4" /> Customers
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Marketing">
            <CommandItem onSelect={() => navigate('/admin/emails')}>
              <Mail className="mr-2 h-4 w-4" /> Email Templates
            </CommandItem>
            <CommandItem onSelect={() => navigate('/admin/newsletter')}>
              <SendHorizontal className="mr-2 h-4 w-4" /> Newsletter Broadcast
            </CommandItem>
            <CommandItem onSelect={() => navigate('/admin/blog')}>
              <FileText className="mr-2 h-4 w-4" /> Blog Articles
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="System">
            <CommandItem onSelect={() => navigate('/admin/settings')}>
              <Settings className="mr-2 h-4 w-4" /> Store Settings
            </CommandItem>
            <CommandItem onSelect={() => navigate('/admin/storage')}>
              <Database className="mr-2 h-4 w-4" /> Cloud Storage
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
