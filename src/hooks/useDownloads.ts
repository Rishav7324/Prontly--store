'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/firebase';
import type { DownloadRecord } from '@/types/download';

export function useDownloads() {
  const auth = useAuth();
  const user = auth?.currentUser;

  return useQuery<DownloadRecord[]>({
    queryKey: ['user-downloads', user?.uid],
    enabled: !!user,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const token = await user!.getIdToken();
      const res = await fetch('/api/user/downloads', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch downloads');
      const json = await res.json();
      return json.data;
    }
  });
}