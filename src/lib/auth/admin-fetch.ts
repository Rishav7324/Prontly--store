'use client';

import { getAuth, onAuthStateChanged } from 'firebase/auth';

/**
 * Gets current Firebase ID token, waiting for auth initialization if needed.
 */
export async function getAdminAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const auth = getAuth();
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), 4000);
      const unsub = onAuthStateChanged(auth, async (u) => {
        clearTimeout(timeout);
        unsub();
        if (u) {
          try {
            const token = await u.getIdToken();
            resolve(token);
          } catch {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  } catch (e) {
    console.warn('[adminFetch] Error acquiring token:', e);
    return null;
  }
}

/**
 * Perform authenticated fetch to admin API endpoints.
 */
export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAdminAuthToken();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * React Query / SWR fetcher for admin endpoints.
 */
export async function adminJsonFetcher<T = any>(url: string): Promise<T> {
  const res = await adminFetch(url);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`[adminFetch] Error fetching ${url}:`, json);
    return [] as any;
  }
  return json.success ? json.data : (json.data ?? json);
}
