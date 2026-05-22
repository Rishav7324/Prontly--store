
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
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

const menuItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Categories', href: '/admin/categories', icon: Layers },
  { name: 'Blog', href: '/admin/blog', icon: FileText },
  { name: 'Coupons', href: '/admin/coupons', icon: Ticket },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'SEO Tools', href: '/admin/seo', icon: Search },
  { name: 'Storage', href: '/admin/storage', icon: Database },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
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
        "sticky top-0 h-screen border-r bg-card/30 backdrop-blur-sm transition-all duration-300 flex flex-col",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between px-6 border-b">
        <Link href="/admin" className={cn("flex items-center gap-2", isCollapsed && "justify-center w-full")}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-5 w-5 text-white" fill="currentColor" />
          </div>
          {!isCollapsed && (
            <span className="font-headline text-lg font-bold tracking-tight">
              PRONTLY <span className="text-primary">ADMIN</span>
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === item.href 
                ? "bg-primary text-primary-foreground shadow-md" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              isCollapsed && "justify-center px-0"
            )}
            title={item.name}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t">
        <Button 
          variant="ghost" 
          className={cn("w-full gap-3 justify-start text-destructive hover:bg-destructive/10 hover:text-destructive", isCollapsed && "justify-center")}
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span>Sign Out</span>}
        </Button>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mt-4 flex w-full items-center justify-center p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
