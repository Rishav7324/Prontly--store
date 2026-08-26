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

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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

  // Profile fetched from Neon via API (replaces Firestore onSnapshot)
  const { data: profileData, isLoading: profileLoading } = useSWR(
    user ? '/api/user/me' : null,
    fetcher,
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
