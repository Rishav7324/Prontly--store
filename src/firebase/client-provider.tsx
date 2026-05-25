
'use client';

import { ReactNode, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const { app, db, auth } = useMemo(() => {
    return initializeFirebase();
  }, []);

  // Create a stable QueryClient instance on the client side
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <FirebaseProvider app={app} db={db} auth={auth}>
        {children}
      </FirebaseProvider>
    </QueryClientProvider>
  );
}
