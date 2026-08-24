import { Skeleton } from "@/components/ui/skeleton"
import type { ViewMode } from "@/types/api"

export function SubmissionsLoading({ view }: { view: ViewMode }) {
  if (view === "cards") {
    return (
      <div
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        aria-label="Loading submissions"
      >
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="space-y-4 rounded-xl border p-5">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
            <Skeleton className="h-20" />
          </div>
        ))}
      </div>
    )
  }
  return (
    <div
      className="space-y-1 rounded-xl border p-3"
      aria-label="Loading submissions"
    >
      {Array.from({ length: 8 }, (_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  )
}
