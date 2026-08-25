export default function ProductLoading() {
  return (
    <div className="container mx-auto px-4 pt-20 pb-10 max-w-6xl">
      <div className="h-3 w-40 bg-muted animate-pulse rounded mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="aspect-square rounded-lg bg-muted animate-pulse" />
        <div className="space-y-4">
          <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
          <div className="h-3 w-1/3 bg-muted animate-pulse rounded" />
          <div className="h-8 w-28 bg-muted animate-pulse rounded mt-6" />
          <div className="space-y-2 pt-4">
            <div className="h-3 w-full bg-muted animate-pulse rounded" />
            <div className="h-3 w-5/6 bg-muted animate-pulse rounded" />
            <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-11 w-full bg-muted animate-pulse rounded-lg mt-6" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-9 bg-muted animate-pulse rounded-lg" />
            <div className="h-9 bg-muted animate-pulse rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
