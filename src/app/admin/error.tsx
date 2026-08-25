'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-sm p-6 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <div className="space-y-1">
          <h1 className="text-base font-semibold">Admin panel error</h1>
          {error?.digest && (
            <p className="font-mono text-[10px] text-muted-foreground/60 pt-1">{error.digest}</p>
          )}
        </div>
        <div className="flex gap-2 justify-center pt-1">
          <Button onClick={reset} className="h-9 rounded-lg px-4 text-xs font-medium">Retry</Button>
          <Button asChild variant="ghost" className="h-9 rounded-lg text-xs font-medium">
            <Link href="/">Go to store</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
