"use client";

import { useDownloadAction } from '@/hooks/useDownloadAction';
import { Button } from '@/components/ui/button';
import { Loader2, Download, AlertCircle, Ban } from 'lucide-react';

interface DownloadButtonProps {
  productId: string;
  orderId: string;
  downloadCount: number;
  downloadLimit: number;
  isActive: boolean;
}

export function DownloadButton({
  productId, orderId, downloadCount, downloadLimit, isActive
}: DownloadButtonProps) {
  const { isLoading, error, remainingDownloads, triggerDownload } = useDownloadAction(productId, orderId);

  const remaining = remainingDownloads ?? (downloadLimit - downloadCount);
  const isLimitReached = remaining <= 0;

  if (!isActive) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
        <Ban className="h-4 w-4 text-red-500" />
        <span className="text-red-500 text-xs font-bold uppercase tracking-widest">Access Revoked</span>
      </div>
    );
  }

  if (isLimitReached) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span className="text-amber-500 text-xs font-bold uppercase">Limit Reached ({downloadLimit}/{downloadLimit})</span>
        </div>
        <p className="text-[10px] text-muted-foreground text-center">Contact support for a license reset.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={triggerDownload}
        disabled={isLoading}
        className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20 gap-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {isLoading ? "Generating Link..." : "Download Source"}
      </Button>

      <div className="flex justify-between items-center px-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {remaining} / {downloadLimit} Left
        </p>
        {error && <span className="text-[10px] text-destructive font-bold">⚠️ Error</span>}
      </div>
    </div>
  );
}