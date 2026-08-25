'use client';

import { useQuery } from '@tanstack/react-query';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * SQL replacement for useCollection — uses TanStack Query + /api/products etc.
 * Polls every 10s to mimic Firestore real-time for admin dashboards.
 */
export function useSqlCollection<T = any>(endpoint: string | null) {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: [endpoint],
    queryFn: () => fetcher(endpoint!),
    enabled: !!endpoint,
    refetchInterval: 10000,
    staleTime: 5000,
  });

  return {
    data: (data?.data as T[]) || null,
    loading: isLoading,
    error: error || (data?.success === false ? new Error((data as any).error) : null),
    refetch,
    source: (data as any)?.source || 'neon',
  };
}

export function useSqlDoc<T = any>(endpoint: string | null) {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: [endpoint],
    queryFn: () => fetcher(endpoint!),
    enabled: !!endpoint,
    refetchInterval: 10000,
  });
  return {
    data: (data as any)?.data as T | null,
    loading: isLoading,
    error,
    refetch,
  };
}
