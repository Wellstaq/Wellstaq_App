import { Skeleton } from "@wellstaq/ui/skeleton";

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex flex-col">
      <div className="hidden gap-4 border-b border-line px-4 py-3 md:grid" style={{ gridTemplateColumns: `2fr repeat(${columns - 1}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => <Skeleton key={index} className="h-3 w-20" />)}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="grid grid-cols-1 gap-3 border-b border-line px-4 py-4 last:border-b-0 md:gap-4">
          <div className="flex items-center gap-3 md:hidden">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-2/5" /><Skeleton className="h-3 w-3/5" /></div>
          </div>
          <div className="hidden items-center gap-4 md:grid" style={{ gridTemplateColumns: `2fr repeat(${columns - 1}, 1fr)` }}>
            <div className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-3.5 w-32" /></div>
            {Array.from({ length: columns - 1 }).map((_, column) => <Skeleton key={column} className="h-3.5 w-16" />)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function EventGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading events" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex h-[236px] flex-col gap-2 rounded-lg border border-[#F0F0F0] bg-grey-5 p-2">
          <Skeleton className="h-[85px] w-full rounded-lg" />
          <div className="space-y-2 px-1 pt-1"><Skeleton className="h-3.5 w-3/4" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-3 w-1/3" /></div>
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-5">
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-xl" />
        <div className="space-y-2"><Skeleton className="h-5 w-48" /><Skeleton className="h-3.5 w-32" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-[84px] rounded-[12px]" />)}
      </div>
      <Skeleton className="h-[320px] rounded-[12px]" />
    </div>
  );
}
