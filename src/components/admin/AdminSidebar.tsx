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
  SendHorizontal
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
  { group: 'Management', items: [
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Categories', href: '/admin/categories', icon: Layers },
    { name: 'Reviews', href: '/admin/reviews', icon: MessageSquare },
  ]},
  { group: 'Marketing', items: [
    { name: 'Templates', href: '/admin/emails', icon: Mail },
    { name: 'Newsletter', href: '/admin/newsletter', icon: SendHorizontal },
    { name: 'Coupons', href: '/admin/coupons', icon: Ticket },
    { name: 'Blog', href: '/admin/blog', icon: FileText },
  ]},
  { group: 'System', items: [
    { name: 'Storage', href: '/admin/storage', icon: Database },
    { name: 'SEO Tools', href: '/admin/seo', icon: Search },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
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
        "relative flex h-screen flex-col border-r border-border/60 bg-card overflow-hidden transition-all duration-200 ease-in-out min-w-0 shadow-sm",
        isCollapsed ? "w-14" : "w-52"
      )}
    >
      <div className="flex h-14 shrink-0 items-center border-b border-border/60 px-3 overflow-hidden">
        <Link href="/admin" className={cn("flex min-w-0 items-center gap-2 overflow-hidden", isCollapsed && "justify-center w-full")}>
          <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg bg-muted shadow-sm border border-border/60">
            <Image
              src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png"
              alt="Logo"
              fill
              className="object-cover"
            />
          </div>
          {!isCollapsed && (
            <div className="flex min-w-0 flex-col overflow-hidden">
              <span className="truncate text-xs font-semibold leading-none">Prontly</span>
              <span className="mt-0.5 text-[11px] font-medium text-accent leading-none">Admin</span>
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 min-w-0">
        <div className="space-y-4 min-w-0">
          {menuItems.map((group) => (
            <div key={group.group} className="min-w-0">
              {!isCollapsed && (
                <h3 className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground truncate">
                  {group.group}
                </h3>
              )}
              <div className="space-y-0.5 min-w-0">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => onMobileSelect?.()}
                      title={item.name}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors overflow-hidden min-w-0 border border-transparent",
                        isActive
                          ? "bg-accent/10 text-accent border-accent/10"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border/60",
                        isCollapsed && "justify-center px-1.5"
                      )}
                    >
                      <item.icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-accent" : "text-muted-foreground")} />
                      {!isCollapsed && <span className="truncate text-xs">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="border-t border-border/60 pt-2 min-w-0">
            <Link
              href="/"
              target="_blank"
              title="Storefront"
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-accent border border-transparent hover:border-border/60 overflow-hidden min-w-0",
                isCollapsed && "justify-center px-1.5"
              )}
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              {!isCollapsed && <span className="truncate text-xs">Storefront</span>}
            </Link>
          </div>
        </div>
      </nav>

      <div className="border-t border-border/60 p-2 shrink-0 overflow-hidden">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-full justify-start gap-2.5 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive overflow-hidden",
            isCollapsed && "justify-center px-0"
          )}
          onClick={handleSignOut}
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          {!isCollapsed && <span className="truncate text-xs">Sign Out</span>}
        </Button>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-2.5 top-[52px] hidden h-5 w-5 items-center justify-center rounded-md border border-border/60 bg-background text-muted-foreground shadow-sm transition-colors hover:border-accent/40 hover:text-accent lg:flex overflow-hidden"
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </div>
    </aside>
  );
}
