import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const pulse = 'animate-pulse bg-muted rounded';

/* ── Generic full-page spinner ─────────────────────────── */
export function SpinnerLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
    </div>
  );
}

/* ── Stat cards row ────────────────────────────────────── */
export function StatCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border/60 p-4 space-y-2">
          <div className={cn(pulse, 'h-2.5 w-16')} />
          <div className={cn(pulse, 'h-6 w-24')} />
        </div>
      ))}
    </div>
  );
}

/* ── Table rows ────────────────────────────────────────── */
export function TableRows({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-border/60 overflow-hidden">
      <div className={cn(pulse, 'h-10 w-full')} />
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-4 py-3 border-t border-border/40">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className={cn(pulse, 'h-3 flex-1', c === 0 && 'max-w-[80px]')} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Product grid ──────────────────────────────────────── */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg overflow-hidden border border-border/50">
          <div className={cn('aspect-[4/5]', pulse)} />
          <div className="p-3 space-y-2">
            <div className={cn(pulse, 'h-2.5 w-1/3')} />
            <div className={cn(pulse, 'h-3 w-full')} />
            <div className={cn(pulse, 'h-3 w-2/3')} />
            <div className={cn(pulse, 'h-4 w-1/2 mt-3')} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Blog card grid ────────────────────────────────────── */
export function BlogGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border/60 overflow-hidden">
          <div className={cn('aspect-video', pulse)} />
          <div className="p-4 space-y-2">
            <div className={cn(pulse, 'h-2.5 w-20')} />
            <div className={cn(pulse, 'h-4 w-full')} />
            <div className={cn(pulse, 'h-3 w-full')} />
            <div className={cn(pulse, 'h-3 w-3/4')} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Centered auth card ────────────────────────────────── */
export function AuthCard() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-border/60 shadow-sm p-6 space-y-4">
        <div className="mx-auto flex flex-col items-center gap-2 pb-2">
          <div className={cn('h-9 w-9 rounded-lg', pulse)} />
          <div className={cn(pulse, 'h-4 w-28')} />
        </div>
        {[0, 1].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className={cn(pulse, 'h-2.5 w-14')} />
            <div className={cn(pulse, 'h-10 w-full rounded-lg')} />
          </div>
        ))}
        <div className={cn(pulse, 'h-10 w-full rounded-lg mt-2')} />
        <div className={cn(pulse, 'h-3 w-36 mx-auto')} />
      </div>
    </div>
  );
}

/* ── Two-column checkout/cart layout ──────────────────── */
export function TwoColCheckout() {
  return (
    <div className="container mx-auto px-4 pt-24 pb-12 max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 space-y-4">
        {[0, 1].map((i) => (
          <div key={i} className="flex gap-3 rounded-xl border border-border/60 p-4">
            <div className={cn('h-16 w-16 rounded-lg shrink-0', pulse)} />
            <div className="flex-1 space-y-2 py-1">
              <div className={cn(pulse, 'h-3.5 w-3/4')} />
              <div className={cn(pulse, 'h-2.5 w-1/4')} />
            </div>
            <div className={cn(pulse, 'h-4 w-16')} />
          </div>
        ))}
      </div>
      <div className="lg:col-span-5">
        <div className="rounded-xl border border-border/60 p-5 space-y-3 sticky top-24">
          <div className={cn(pulse, 'h-4 w-28 mb-4')} />
          <div className={cn(pulse, 'h-3 w-full')} />
          <div className={cn(pulse, 'h-3 w-2/3')} />
          <div className={cn(pulse, 'h-11 w-full rounded-lg mt-6')} />
        </div>
      </div>
    </div>
  );
}

/* ── Dashboard shell (sidebar + stats + table) ────────── */
export function DashboardShell({ tableRows = 5 }: { tableRows?: number }) {
  return (
    <div className="container mx-auto px-4 pt-24 pb-12 max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6">
      <aside className="lg:col-span-3">
        <div className={cn('rounded-xl h-64', pulse)} />
      </aside>
      <main className="lg:col-span-9 space-y-6 min-w-0">
        <StatCards count={2} />
        <TableRows rows={tableRows} cols={4} />
      </main>
    </div>
  );
}

/* ── Article page ─────────────────────────────────────── */
export function ArticleSkeleton() {
  return (
    <div className="container mx-auto px-4 pt-24 pb-12 max-w-3xl space-y-4">
      <div className={cn(pulse, 'h-2.5 w-24')} />
      <div className={cn(pulse, 'h-8 w-full')} />
      <div className={cn(pulse, 'h-8 w-3/4')} />
      <div className={cn('aspect-video rounded-xl mt-4', pulse)} />
      <div className="space-y-2 pt-4">
        {[100, 92, 96, 88, 0, 100, 78].map((w, i) =>
          w === 0 ? <div key={i} className="h-3" /> : <div key={i} className={cn(pulse, 'h-3')} style={{ width: `${w}%` }} />
        )}
      </div>
    </div>
  );
}

/* ── Detail page with image + info (product/order/user) ─ */
export function DetailSplit() {
  return (
    <div className="container mx-auto px-4 pt-24 pb-12 max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className={cn('aspect-[4/5] rounded-3xl', pulse)} />
      <div className="space-y-4">
        <div className={cn(pulse, 'h-6 w-3/4')} />
        <div className={cn(pulse, 'h-3 w-1/3')} />
        <div className={cn(pulse, 'h-8 w-28 mt-4')} />
        <div className="space-y-2 pt-4">
          {[90, 75, 82].map((w, i) => (
            <div key={i} className={cn(pulse, 'h-3')} style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className={cn('h-11 w-full rounded-lg mt-6', pulse)} />
        <div className="grid grid-cols-2 gap-2">
          <div className={cn('h-9 rounded-lg', pulse)} />
          <div className={cn('h-9 rounded-lg', pulse)} />
        </div>
      </div>
    </div>
  );
}
