'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';

interface FirebaseContextType {
  app: FirebaseApp | null;
  auth: Auth | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
  app: null,
  auth: null,
});

export function FirebaseProvider({
  children,
  app,
  auth,
}: {
  children: ReactNode;
  app: FirebaseApp;
  auth: Auth;
}) {
  return (
    <FirebaseContext.Provider value={{ app, auth }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => useContext(FirebaseContext);
export const useFirebaseApp = () => useContext(FirebaseContext).app;
export const useAuth = () => useContext(FirebaseContext).auth;
// Kept for backwards compatibility — returns null (data now lives in Neon via /api)
export const useFirestore = () => null;
