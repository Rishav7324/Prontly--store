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
  LogOut,
  Plus,
  Sparkles,
  ChevronRight,
  ShieldCheck
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
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-accent" />
          <p className="text-xs font-semibold text-muted-foreground">Authenticating Console Access…</p>
        </div>
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super-admin';

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center overflow-x-hidden bg-background p-4 text-center min-w-0">
        <div className="mb-4 rounded-2xl bg-destructive/10 p-4 border border-destructive/20 shadow-xs">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="mb-1 text-xl font-bold font-headline text-foreground">Access Restricted</h1>
        <p className="mb-6 max-w-sm text-xs sm:text-sm text-muted-foreground leading-relaxed">
          You do not have verified administrative permissions to access the store management console.
        </p>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="h-10 rounded-xl px-4 text-xs font-semibold border-border/80">
            <Link href="/">Return to Storefront</Link>
          </Button>
          {!user && (
            <Button asChild className="h-10 rounded-xl px-5 text-xs font-bold bg-zinc-950 text-white">
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
    <div className="flex min-h-screen overflow-x-hidden bg-zinc-50/60 dark:bg-zinc-950 text-foreground min-w-0 font-sans">
      
      {/* ── DESKTOP SIDEBAR ────────────────────────────── */}
      <div className="hidden lg:block shrink-0 sticky top-0 h-screen">
        <AdminSidebar />
      </div>

      {/* ── MAIN CONTENT WRAPPER ───────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border/70 bg-white/90 dark:bg-zinc-950/90 px-4 sm:px-6 backdrop-blur-xl min-w-0 overflow-hidden shadow-2xs">
          
          <div className="flex min-w-0 items-center gap-3">
            {/* Mobile Sidebar Trigger */}
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl lg:hidden border border-border/70 hover:bg-muted" aria-label="Open mobile admin menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 border-r bg-white dark:bg-zinc-950 overflow-hidden">
                <AdminSidebar onMobileSelect={() => setIsMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            {/* Mobile Brand Logo */}
            <Link href="/admin" className="flex items-center lg:hidden shrink-0">
              <div className="relative h-8 w-8 overflow-hidden rounded-xl bg-muted shadow-xs border border-border/70">
                <Image
                  src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png"
                  alt="Prontly Logo"
                  fill
                  className="object-cover"
                />
              </div>
            </Link>

            {/* Global Admin Search Bar (⌘K) */}
            <Button
              variant="outline"
              className="relative hidden h-10 w-64 xl:w-80 items-center justify-start gap-2.5 rounded-2xl border border-border/80 bg-muted/40 px-3.5 text-xs text-muted-foreground transition-all hover:bg-muted/70 hover:border-accent/40 lg:flex shadow-2xs overflow-hidden"
              onClick={() => setIsCommandOpen(true)}
            >
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-xs font-medium">Quick jump or search…</span>
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 select-none items-center gap-1 rounded-md border border-border/80 bg-white dark:bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] font-bold text-muted-foreground shadow-2xs sm:flex">
                ⌘K
              </kbd>
            </Button>
          </div>

          {/* Right Header Actions */}
          <div className="flex shrink-0 items-center gap-2">
            
            {/* Quick Add Product Button on Desktop */}
            <Button asChild size="sm" className="hidden sm:inline-flex h-9 rounded-xl px-3.5 text-xs font-bold bg-zinc-950 text-white hover:bg-zinc-800 shadow-xs active:scale-[0.98] transition-all">
              <Link href="/admin/products/new">
                <Plus className="mr-1.5 h-3.5 w-3.5" /> New Product
              </Link>
            </Button>

            {/* Storefront Link */}
            <Button asChild variant="outline" size="sm" className="hidden md:inline-flex h-9 rounded-xl px-3 text-xs font-semibold border-border/80 hover:bg-muted shadow-2xs">
              <Link href="/" target="_blank">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5 text-accent" /> Storefront
              </Link>
            </Button>

            {/* Notification Bell */}
            <Button variant="ghost" size="icon" className="relative h-9.5 w-9.5 rounded-xl border border-transparent hover:border-border/70 hover:bg-muted" aria-label="View notifications">
              <Bell className="h-4.5 w-4.5 text-muted-foreground" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-accent ring-2 ring-white dark:ring-zinc-950" />
            </Button>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 gap-2.5 rounded-2xl pl-1 pr-2.5 border border-transparent hover:border-border/70 hover:bg-muted overflow-hidden">
                  <Avatar className="h-7 w-7 border border-border/80 shadow-2xs">
                    <AvatarImage src={profile?.photoURL} />
                    <AvatarFallback className="bg-accent/15 text-xs font-bold text-accent">
                      {profile?.displayName?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden flex-col items-start leading-tight sm:flex min-w-0">
                    <span className="max-w-28 truncate text-xs font-bold text-foreground">{profile?.displayName || 'Admin'}</span>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 capitalize leading-none mt-0.5">
                      {profile?.role || 'Super Admin'}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5 shadow-lg border-border/80 overflow-hidden">
                <DropdownMenuLabel className="p-2.5">
                  <span className="block truncate text-xs font-bold text-foreground">{profile?.displayName || 'Admin User'}</span>
                  <span className="block truncate text-[11px] font-normal text-muted-foreground mt-0.5">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="text-xs font-medium rounded-xl p-2 cursor-pointer">
                  <Link href="/" target="_blank">
                    <ExternalLink className="mr-2 h-4 w-4 text-accent" /> Visit Storefront
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="text-xs font-medium rounded-xl p-2 cursor-pointer">
                  <Link href="/admin/settings">
                    <Settings className="mr-2 h-4 w-4 text-muted-foreground" /> Console Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-xs font-semibold text-destructive focus:bg-destructive/10 focus:text-destructive rounded-xl p-2 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out of Admin
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </header>

        {/* Dynamic Page Body */}
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-safe">
          <div className="mx-auto w-full max-w-7xl min-w-0 space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* ── COMMAND PALETTE (⌘K) ────────────────────────── */}
      <CommandDialog open={isCommandOpen} onOpenChange={setIsCommandOpen}>
        <CommandInput placeholder="Type a command or search console..." className="text-xs" />
        <CommandList className="max-h-80 p-1">
          <CommandEmpty className="text-xs py-6 text-center text-muted-foreground">No matching command or module found.</CommandEmpty>
          
          <CommandGroup heading="Catalog & Orders">
            <CommandItem onSelect={() => navigate('/admin/products')} className="text-xs font-medium rounded-xl cursor-pointer">
              <Package className="mr-2 h-4 w-4 text-accent" /> Manage Products
            </CommandItem>
            <CommandItem onSelect={() => navigate('/admin/products/new')} className="text-xs font-medium rounded-xl cursor-pointer">
              <Plus className="mr-2 h-4 w-4 text-emerald-600" /> Create New Product
            </CommandItem>
            <CommandItem onSelect={() => navigate('/admin/orders')} className="text-xs font-medium rounded-xl cursor-pointer">
              <ShoppingBag className="mr-2 h-4 w-4 text-blue-600" /> Transaction Ledger
            </CommandItem>
            <CommandItem onSelect={() => navigate('/admin/users')} className="text-xs font-medium rounded-xl cursor-pointer">
              <Users className="mr-2 h-4 w-4 text-violet-600" /> Customer Profiles
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Marketing & Communications">
            <CommandItem onSelect={() => navigate('/admin/emails')} className="text-xs font-medium rounded-xl cursor-pointer">
              <Mail className="mr-2 h-4 w-4 text-amber-600" /> Email Templates & Webhooks
            </CommandItem>
            <CommandItem onSelect={() => navigate('/admin/newsletter')} className="text-xs font-medium rounded-xl cursor-pointer">
              <SendHorizontal className="mr-2 h-4 w-4 text-cyan-600" /> Newsletter Broadcasts
            </CommandItem>
            <CommandItem onSelect={() => navigate('/admin/blog')} className="text-xs font-medium rounded-xl cursor-pointer">
              <FileText className="mr-2 h-4 w-4 text-emerald-600" /> Blog Articles & SEO
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="System & Configuration">
            <CommandItem onSelect={() => navigate('/admin/analytics')} className="text-xs font-medium rounded-xl cursor-pointer">
              <Sparkles className="mr-2 h-4 w-4 text-amber-500" /> Performance Analytics
            </CommandItem>
            <CommandItem onSelect={() => navigate('/admin/settings')} className="text-xs font-medium rounded-xl cursor-pointer">
              <Settings className="mr-2 h-4 w-4 text-zinc-500" /> Store Configuration
            </CommandItem>
            <CommandItem onSelect={() => navigate('/admin/storage')} className="text-xs font-medium rounded-xl cursor-pointer">
              <Database className="mr-2 h-4 w-4 text-blue-500" /> Cloudflare R2 Storage
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

    </div>
  );
}
