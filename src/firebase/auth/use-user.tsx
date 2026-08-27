'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '../provider';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'customer' | 'editor' | 'admin' | 'super-admin';
  isActive: boolean;
  orderCount: number;
  totalSpent: number;
  [key: string]: any;
}

export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return () => unsub();
  }, [auth]);

  // Profile fetched from Neon via API (replaces Firestore onSnapshot) — must send Firebase ID token
  const { data: profileData, isLoading: profileLoading } = useSWR(
    user ? ['/api/user/me', user.uid] : null,
    async ([url]) => {
      const token = auth?.currentUser ? await auth.currentUser.getIdToken() : '';
      const res = await fetch(url as string, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return res.json();
    },
    { revalidateOnFocus: false }
  );

  const profile: UserProfile | null = profileData?.data || null;

  return {
    user,
    profile,
    loading: authLoading,
    role: profile?.role,
    mutateProfile: () => undefined,
  };
}
