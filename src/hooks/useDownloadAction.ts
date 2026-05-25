'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/firebase';
import { useQueryClient } from '@tanstack/react-query';
import type { GenerateDownloadUrlResponse } from '@/types/download';
import { toast } from '@/hooks/use-toast';

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
          DOWNLOAD_LIMIT_REACHED: "Download limit reach ho gayi. Support se contact karo.",
          RATE_LIMIT_EXCEEDED: "Bahut zyada requests. 1 ghante baad try karo.",
          FILE_NOT_FOUND: "File nahi mili. Support se contact karo.",
          DOWNLOAD_REVOKED: "Ye download revoke ho gayi hai. Support se contact karo.",
        };
        throw new Error(messages[data.code ?? ""] ?? data.error ?? "Download failed");
      }

      // Trigger Browser Download
      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.download = data.fileName ?? "download";
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
      toast({ title: "Starting Download", description: data.fileName });

    } catch (err: any) {
      const message = err.message || "Download failed";
      setState({ isLoading: false, error: message, remainingDownloads: null });
      toast({ variant: "destructive", title: "Download Error", description: message });
    }
  }, [user, productId, orderId, queryClient]);

  return { ...state, triggerDownload };
}