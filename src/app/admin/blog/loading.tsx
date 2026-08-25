import { StatCards, TableRows } from '@/components/shared/skeletons';
export default function Loading() {
  return (
    <div className="space-y-5 min-w-0 max-w-full">
      <div className="flex items-center justify-between gap-3">
        <div className="animate-pulse bg-muted rounded h-6 w-40" />
        <div className="animate-pulse bg-muted rounded h-8 w-24 rounded-lg" />
      </div>
      <StatCards count={4} />
      <TableRows rows={7} cols={4} />
    </div>
  );
}
