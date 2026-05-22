'use client';

import { ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Loader2, ShieldAlert, Menu, Zap, Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const userProfileQuery = useMemoFirebase(() => {
    return user && db ? doc(db, 'users', user.uid) : null;
  }, [db, user]);

  const { data: profile, loading: profileLoading } = useDoc(userProfileQuery);

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
          <Button asChild variant="outline">
            <Link href="/">Return to Store</Link>
          </Button>
          {!user && (
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile & Tablet Header */}
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
              <span className="font-headline text-lg font-bold tracking-tight">PRONTLY</span>
            </Link>

            <div className="hidden lg:flex items-center gap-4 text-sm text-muted-foreground">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4" />
                <input 
                  type="text" 
                  placeholder="Global command search..." 
                  className="bg-muted/50 border-none rounded-full pl-9 pr-4 py-1.5 w-64 focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </Button>
            <div className="h-8 w-[1px] bg-border mx-2 hidden sm:block" />
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-sm font-bold leading-none">{profile?.displayName || 'Admin'}</span>
                <span className="text-[10px] text-primary font-medium uppercase tracking-wider">{profile?.role}</span>
              </div>
              <Avatar className="h-9 w-9 border border-primary/20">
                <AvatarImage src={profile?.photoURL} />
                <AvatarFallback>{profile?.displayName?.charAt(0) || 'A'}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background/50 p-4 md:p-8 lg:p-10">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
