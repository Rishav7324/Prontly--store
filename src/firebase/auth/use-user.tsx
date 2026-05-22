
'use client';

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth, useFirestore } from '../provider';

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
  const db = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) return;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [auth]);

  useEffect(() => {
    if (!db || !user) return;

    setLoading(true);
    const unsubscribeProfile = onSnapshot(
      doc(db, 'users', user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching user profile:', error);
        setLoading(false);
      }
    );

    return () => unsubscribeProfile();
  }, [db, user]);

  return { 
    user, 
    profile,
    role: profile?.role || 'customer',
    loading 
  };
}
