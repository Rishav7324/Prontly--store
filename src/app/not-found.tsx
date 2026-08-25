import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-sm p-6 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <SearchX className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="font-mono text-3xl font-bold tracking-tight">404</p>
        <div className="space-y-1">
          <h1 className="text-base font-semibold">Page not found</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The page you&rsquo;re looking for doesn&rsquo;t exist or was moved.
          </p>
        </div>
        <div className="flex gap-2 justify-center pt-1">
          <Button asChild className="h-9 rounded-lg text-xs font-medium px-4">
            <Link href="/products">Back to store</Link>
          </Button>
          <Button asChild variant="ghost" className="h-9 rounded-lg text-xs font-medium">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
