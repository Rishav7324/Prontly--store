'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/firebase';
import { useQueryClient } from '@tanstack/react-query';
import type { GenerateDownloadUrlResponse } from '@/types/download';
import { toast } from '@/hooks/use-toast';
import { analytics } from '@/lib/analytics';

interface DownloadState {
  isLoading: boolean;
  error: string | null;
  remainingDownloads: number | null;
}

export function useDownloadAction(productId: string, orderId: string) {
  const auth = useAuth();
  const user = auth?.currentUser;
  const queryClient = useQueryClient();
  const [state, setState] = useState<DownloadState>({
    isLoading: false, error: null, remainingDownloads: null
  });

  const triggerDownload = useCallback(async () => {
    if (!user) return;
    setState(s => ({ ...s, isLoading: true, error: null }));
    
    // Log GA4 Event
    analytics.downloadStart(productId, orderId);

    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/downloads/generate-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, productId }),
      });

      const data: GenerateDownloadUrlResponse = await res.json();

      if (!data.success || !data.signedUrl) {
        const messages: Record<string, string> = {
          DOWNLOAD_LIMIT_REACHED: "License limit reached. Please contact support.",
          RATE_LIMIT_EXCEEDED: "Too many attempts. Retry in 1 hour.",
          FILE_NOT_FOUND: "Source artifact not found in vault.",
          DOWNLOAD_REVOKED: "License access has been restricted.",
        };
        throw new Error(messages[data.code ?? ""] ?? data.error ?? "Download failure");
      }

      // Trigger Browser Download
      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.download = data.fileName ?? "source-artifact";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setState({
        isLoading: false,
        error: null,
        remainingDownloads: data.remainingDownloads ?? null,
      });
      
      queryClient.invalidateQueries({ queryKey: ['user-downloads'] });
      toast({ title: "Authorization Validated", description: `Starting download: ${data.fileName}` });

    } catch (err: any) {
      const message = err.message || "Download failed";
      setState({ isLoading: false, error: message, remainingDownloads: null });
      toast({ variant: "destructive", title: "Vault Error", description: message });
    }
  }, [user, productId, orderId, queryClient]);

  return { ...state, triggerDownload };
}
