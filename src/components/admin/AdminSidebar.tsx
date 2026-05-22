
'use client';

import Link from 'next/link';
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
  Zap,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ExternalLink,
  History,
  Mail,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
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
    { name: 'Newsletter', href: '/admin/newsletter', icon: Mail },
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
        "h-full border-r bg-card/30 backdrop-blur-sm transition-all duration-500 ease-in-out flex flex-col relative",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Logo Section */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-white/5">
        <Link href="/admin" className={cn("flex items-center gap-3", isCollapsed && "justify-center w-full")}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
            <Zap className="h-5 w-5 text-white" fill="currentColor" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-headline text-lg font-bold tracking-tight leading-none">PRONTLY</span>
              <span className="text-[10px] text-primary font-bold tracking-[0.2em] mt-1">ADMIN CONTROL</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-6 p-4 overflow-y-auto custom-scrollbar scrollbar-hide">
        {menuItems.map((group) => (
          <div key={group.group} className="space-y-1">
            {!isCollapsed && (
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">
                {group.group}
              </h3>
            )}
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onMobileSelect?.()}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative",
                  pathname === item.href 
                    ? "bg-primary text-white shadow-xl shadow-primary/20" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                  isCollapsed && "justify-center px-0"
                )}
                title={item.name}
              >
                <item.icon className={cn(
                  "h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110",
                  pathname === item.href ? "text-white" : "text-primary/70"
                )} />
                {!isCollapsed && <span>{item.name}</span>}
                {pathname === item.href && !isCollapsed && (
                  <div className="absolute right-3 h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                )}
              </Link>
            ))}
          </div>
        ))}

        <div className="pt-6 border-t border-white/5">
          <Link 
            href="/" 
            target="_blank"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all",
              isCollapsed && "justify-center px-0"
            )}
          >
            <ExternalLink className="h-5 w-5 text-accent" />
            {!isCollapsed && <span>View Storefront</span>}
          </Link>
        </div>
      </nav>

      {/* Footer / Toggle Section */}
      <div className="p-4 border-t border-white/5 bg-black/10 backdrop-blur-md">
        <Button 
          variant="ghost" 
          className={cn(
            "w-full gap-3 justify-start rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all", 
            isCollapsed && "justify-center px-0"
          )}
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </Button>
        
        {/* Collapse Toggle - Only visible on Desktop */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-20 h-6 w-6 items-center justify-center rounded-full bg-primary text-white border-2 border-background shadow-lg transition-transform hover:scale-110 active:scale-95"
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </div>
    </aside>
  );
}
