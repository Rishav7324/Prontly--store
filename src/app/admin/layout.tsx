'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, useAuth } from '@/firebase';
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
  const { user, profile, loading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-accent" />
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super-admin';

  if (!user || !isAdmin) {
    return (
      <div className="flex h-screen flex-col items-center justify-center overflow-x-hidden bg-background p-4 text-center min-w-0">
        <div className="mb-3 rounded-xl bg-destructive/10 p-2.5 border border-destructive/20">
          <ShieldAlert className="h-5 w-5 text-destructive" />
        </div>
        <h1 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Access Denied</h1>
        <p className="mb-4 max-w-xs text-xs text-muted-foreground">
          You do not have the required permissions to access the admin dashboard.
        </p>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="h-8 rounded-lg px-3 text-xs font-medium border-border/60">
            <Link href="/">Return to Store</Link>
          </Button>
          {!user && (
            <Button asChild className="h-8 rounded-lg px-3 text-xs font-medium">
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
    <div className="flex min-h-screen overflow-x-hidden bg-muted/20 text-foreground min-w-0">
      <div className="hidden lg:block shrink-0">
        <AdminSidebar />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-card/90 px-3 md:px-4 backdrop-blur-xl min-w-0 overflow-hidden">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg lg:hidden border border-transparent hover:border-border/60">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-52 p-0 border-r bg-card overflow-hidden">
                <AdminSidebar onMobileSelect={() => setIsMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex items-center lg:hidden shrink-0">
              <div className="relative h-7 w-7 overflow-hidden rounded-lg bg-muted shadow-sm border border-border/60">
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
              className="relative hidden h-8 w-56 xl:w-72 items-center justify-start gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 text-xs text-muted-foreground transition-colors hover:bg-muted/60 lg:flex shadow-sm overflow-hidden"
              onClick={() => setIsCommandOpen(true)}
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate text-xs">Search admin…</span>
              <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 select-none items-center gap-1 rounded-md border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium sm:flex">
                ⌘K
              </kbd>
            </Button>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-lg">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 gap-2 rounded-full pl-1 pr-2 overflow-hidden">
                  <Avatar className="h-6 w-6 border border-border/60 shadow-sm">
                    <AvatarImage src={profile?.photoURL} />
                    <AvatarFallback className="bg-accent/10 text-[11px] font-semibold text-accent">
                      {profile?.displayName?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden flex-col items-start leading-tight sm:flex min-w-0">
                    <span className="max-w-28 truncate text-xs font-medium">{profile?.displayName || 'Admin'}</span>
                    <span className="text-[11px] capitalize text-muted-foreground leading-none">{profile?.role}</span>
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-sm border-border/60 overflow-hidden">
                <DropdownMenuLabel className="text-xs">
                  <span className="block truncate font-medium">{profile?.displayName || 'Admin'}</span>
                  <span className="block truncate text-[11px] font-normal text-muted-foreground">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="text-xs rounded-lg">
                  <Link href="/" target="_blank">
                    <ExternalLink className="mr-2 h-3.5 w-3.5" /> View Store
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-xs text-destructive focus:text-destructive rounded-lg">
                  <LogOut className="mr-2 h-3.5 w-3.5" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-4">
          <div className="mx-auto w-full max-w-7xl min-w-0">
            {children}
          </div>
        </main>
      </div>

      <CommandDialog open={isCommandOpen} onOpenChange={setIsCommandOpen}>
        <CommandInput placeholder="Type a command or search..." className="text-xs" />
        <CommandList>
          <CommandEmpty className="text-xs">No results found.</CommandEmpty>
          <CommandGroup heading="Management">
            <CommandItem onSelect={() => navigate('/admin/products')} className="text-xs">
              <Package className="mr-2 h-3.5 w-3.5" /> Products
            </CommandItem>
            <CommandItem onSelect={() => navigate('/admin/orders')} className="text-xs">
              <ShoppingBag className="mr-2 h-3.5 w-3.5" /> Orders
            </CommandItem>
            <CommandItem onSelect={() => navigate('/admin/users')} className="text-xs">
              <Users className="mr-2 h-3.5 w-3.5" /> Customers
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Marketing">
            <CommandItem onSelect={() => navigate('/admin/emails')} className="text-xs">
              <Mail className="mr-2 h-3.5 w-3.5" /> Email Templates
            </CommandItem>
            <CommandItem onSelect={() => navigate('/admin/newsletter')} className="text-xs">
              <SendHorizontal className="mr-2 h-3.5 w-3.5" /> Newsletter Broadcast
            </CommandItem>
            <CommandItem onSelect={() => navigate('/admin/blog')} className="text-xs">
              <FileText className="mr-2 h-3.5 w-3.5" /> Blog Articles
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="System">
            <CommandItem onSelect={() => navigate('/admin/settings')} className="text-xs">
              <Settings className="mr-2 h-3.5 w-3.5" /> Store Settings
            </CommandItem>
            <CommandItem onSelect={() => navigate('/admin/storage')} className="text-xs">
              <Database className="mr-2 h-3.5 w-3.5" /> Cloud Storage
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
