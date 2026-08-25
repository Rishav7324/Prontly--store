'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[APP_ERROR]:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-sm p-6 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <div className="space-y-1">
          <h1 className="text-base font-semibold">Something went wrong</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            An unexpected error occurred. Please try again.
          </p>
          {error?.digest && (
            <p className="font-mono text-[10px] text-muted-foreground/60 pt-1">ref: {error.digest}</p>
          )}
        </div>
        <div className="flex gap-2 justify-center pt-1">
          <Button onClick={reset} className="h-9 rounded-lg text-xs font-medium px-4">Try again</Button>
          <Button asChild variant="ghost" className="h-9 rounded-lg text-xs font-medium">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
