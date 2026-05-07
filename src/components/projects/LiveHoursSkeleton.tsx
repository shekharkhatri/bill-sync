import { Skeleton } from '@/components/ui/skeleton'

export function LiveHoursSkeleton(): React.JSX.Element {
  return (
    <div>
      {/* Summary strip — 4 stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-9 w-32 rounded-md" />
        <Skeleton className="h-9 w-40 rounded-md" />
      </div>

      {/* Table rows */}
      <div className="space-y-2">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    </div>
  )
}
