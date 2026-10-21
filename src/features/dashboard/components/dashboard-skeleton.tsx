import { Skeleton } from "@/components/ui/skeleton";

export const DashboardSkeleton = () => (
  <div className="space-y-6" aria-busy="true">
    <span className="sr-only" role="status">
      Loading the forge overview…
    </span>
    <div className="space-y-2" aria-hidden="true">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-6 w-64 max-w-full" />
    </div>
    <Skeleton className="h-40 w-full" />
    <div
      className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
      aria-hidden="true"
    >
      {[0, 1, 2, 3].map((index) => (
        <Skeleton key={index} className="h-28 w-full" />
      ))}
    </div>
    <div className="grid gap-6 lg:grid-cols-2" aria-hidden="true">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="space-y-4 border p-5">
          <Skeleton className="h-7 w-40" />
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-16 w-full" />
          ))}
        </div>
      ))}
    </div>
  </div>
);
