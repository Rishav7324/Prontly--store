'use client';

import Link from 'next/link';
import Image from 'next/image';
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
        "h-full border-r bg-card/50 backdrop-blur-xl transition-all duration-300 ease-in-out flex flex-col relative",
        isCollapsed ? "w-16" : "w-56"
      )}
    >
      <div className="flex h-14 items-center justify-between px-4 border-b border-white/5">
        <Link href="/admin" className={cn("flex items-center gap-2", isCollapsed && "justify-center w-full")}>
          <div className="relative h-7 w-7 overflow-hidden rounded-lg bg-white/5 shadow-sm">
            <Image 
              src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png" 
              alt="Logo" 
              fill 
              className="object-cover"
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-headline text-sm font-bold tracking-tight leading-none">PRONTLY</span>
              <span className="text-[8px] text-primary font-black tracking-widest mt-0.5">ADMIN</span>
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 space-y-5 p-3 overflow-y-auto custom-scrollbar">
        {menuItems.map((group) => (
          <div key={group.group} className="space-y-1">
            {!isCollapsed && (
              <h3 className="px-2 text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1.5">
                {group.group}
              </h3>
            )}
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onMobileSelect?.()}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2 py-2 text-[11px] font-bold transition-all group relative",
                  pathname === item.href 
                    ? "bg-primary text-white shadow-lg" 
                    : "text-slate-blue hover:bg-white/5 hover:text-foreground",
                  isCollapsed && "justify-center px-0"
                )}
                title={item.name}
              >
                <item.icon className={cn(
                  "h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110",
                  pathname === item.href ? "text-white" : "text-primary/60"
                )} />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            ))}
          </div>
        ))}

        <div className="pt-4 border-t border-white/5">
          <Link 
            href="/" 
            target="_blank"
            className={cn(
              "flex items-center gap-3 rounded-lg px-2 py-2 text-[11px] font-bold text-slate-blue hover:bg-primary/5 hover:text-primary transition-all",
              isCollapsed && "justify-center px-0"
            )}
          >
            <ExternalLink className="h-4 w-4 text-accent" />
            {!isCollapsed && <span>Storefront</span>}
          </Link>
        </div>
      </nav>

      <div className="p-3 border-t border-white/5 bg-black/5">
        <Button 
          variant="ghost" 
          className={cn(
            "w-full gap-3 justify-start rounded-lg text-slate-blue hover:bg-destructive/5 hover:text-destructive h-9", 
            isCollapsed && "justify-center px-0"
          )}
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && <span className="text-[11px] font-bold">Sign Out</span>}
        </Button>
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-16 h-6 w-6 items-center justify-center rounded-full bg-primary text-white border-2 border-background shadow-lg hover:scale-110 active:scale-95 transition-all"
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </div>
    </aside>
  );
}