
'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  
  const userProfileQuery = user && db ? doc(db, 'users', user.uid) : null;
  const { data: profile, loading: profileLoading } = useDoc(userProfileQuery);

  if (authLoading || profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          If you believe this is an error, please contact the system administrator.
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
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
