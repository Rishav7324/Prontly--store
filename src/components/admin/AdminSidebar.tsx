'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Layers,
  FileText,
  Ticket,
  BarChart3,
  Search,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ExternalLink,
  History,
  Mail,
  MessageSquare,
  SendHorizontal,
  Sparkles,
  Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

const menuItems = [
  { group: 'Overview', items: [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Audit Logs', href: '/admin/logs', icon: History },
  ]},
  { group: 'Catalog & Sales', items: [
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Customers', href: '/admin/users', icon: Users },
    { name: 'Categories', href: '/admin/categories', icon: Layers },
    { name: 'Reviews', href: '/admin/reviews', icon: MessageSquare },
  ]},
  { group: 'Growth & Content', items: [
    { name: 'Email Templates', href: '/admin/emails', icon: Mail },
    { name: 'Newsletters', href: '/admin/newsletter', icon: SendHorizontal },
    { name: 'Coupons', href: '/admin/coupons', icon: Ticket },
    { name: 'Blog Articles', href: '/admin/blog', icon: FileText },
  ]},
  { group: 'Infrastructure', items: [
    { name: 'Cloud Storage', href: '/admin/storage', icon: Database },
    { name: 'SEO Engine', href: '/admin/seo', icon: Search },
    { name: 'Store Settings', href: '/admin/settings', icon: Settings },
  ]}
];

interface AdminSidebarProps {
  onMobileSelect?: () => void;
}

export function AdminSidebar({ onMobileSelect }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const auth = useAuth();

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
    }
  };

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col border-r border-border/70 bg-white dark:bg-zinc-950 overflow-hidden transition-all duration-300 ease-in-out min-w-0 shadow-xs select-none",
        isCollapsed ? "w-[68px]" : "w-60"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/70 px-4 overflow-hidden">
        <Link 
          href="/admin" 
          className={cn("flex min-w-0 items-center gap-3 overflow-hidden", isCollapsed && "justify-center w-full")}
          onClick={() => onMobileSelect?.()}
        >
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-muted shadow-xs border border-border/70">
            <Image
              src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png"
              alt="Prontly Logo"
              fill
              className="object-cover"
            />
          </div>
          {!isCollapsed && (
            <div className="flex min-w-0 flex-col overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-bold font-headline text-foreground leading-none">Prontly</span>
                <span className="inline-flex items-center rounded-md bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold text-accent uppercase leading-none">
                  ADMIN
                </span>
              </div>
              <span className="mt-1 text-[10px] font-medium text-muted-foreground leading-none">Control Console</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 min-w-0 space-y-5 no-scrollbar">
        {menuItems.map((group) => (
          <div key={group.group} className="min-w-0">
            {!isCollapsed && (
              <h3 className="mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 truncate font-headline">
                {group.group}
              </h3>
            )}
            <div className="space-y-1 min-w-0">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => onMobileSelect?.()}
                    title={item.name}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-2.5 py-2 text-xs font-semibold transition-all duration-150 overflow-hidden min-w-0 border",
                      isActive
                        ? "bg-zinc-950 text-white border-zinc-950 shadow-xs dark:bg-white dark:text-zinc-950 dark:border-white"
                        : "border-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                      isCollapsed && "justify-center px-0"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-white dark:text-zinc-950" : "text-muted-foreground")} />
                    {!isCollapsed && <span className="truncate text-xs">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Storefront External Shortcut */}
        <div className="border-t border-border/60 pt-3 min-w-0">
          <Link
            href="/"
            target="_blank"
            title="Open Live Storefront"
            className={cn(
              "flex items-center gap-3 rounded-xl px-2.5 py-2 text-xs font-semibold text-muted-foreground transition-all hover:bg-muted/70 hover:text-accent border border-transparent overflow-hidden min-w-0",
              isCollapsed && "justify-center px-0"
            )}
          >
            <ExternalLink className="h-4 w-4 shrink-0 text-accent" />
            {!isCollapsed && <span className="truncate text-xs">Live Storefront</span>}
          </Link>
        </div>
      </nav>

      {/* Footer / Sign out */}
      <div className="border-t border-border/70 p-3 shrink-0 overflow-hidden space-y-2 bg-muted/20">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-9.5 w-full justify-start gap-3 rounded-xl px-2.5 text-xs font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive active:scale-[0.98] transition-all overflow-hidden",
            isCollapsed && "justify-center px-0"
          )}
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span className="truncate text-xs">Sign Out</span>}
        </Button>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-18 hidden h-6 w-6 items-center justify-center rounded-full border border-border/80 bg-white text-muted-foreground shadow-md transition-all hover:border-accent hover:text-accent lg:flex overflow-hidden active:scale-90"
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>
    </aside>
  );
}
