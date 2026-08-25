export default function Loading() {
  return (
    <div className="space-y-5 min-w-0 max-w-full">
      <div className="animate-pulse bg-muted rounded h-6 w-48" />
      <div className="rounded-xl border border-border/60 p-4 space-y-3">
        <div className="animate-pulse bg-muted rounded h-10 w-full rounded-lg" />
        <div className="flex gap-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-muted rounded size-7" />
          ))}
        </div>
        <div className="animate-pulse bg-muted rounded h-[280px] w-full" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-xl border border-border/60 p-4 space-y-3">
            <div className="animate-pulse bg-muted rounded h-3.5 w-24" />
            <div className="animate-pulse bg-muted rounded h-9 w-full rounded-lg" />
            <div className="animate-pulse bg-muted rounded h-9 w-full rounded-lg" />
            <div className="animate-pulse bg-muted rounded h-20 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
