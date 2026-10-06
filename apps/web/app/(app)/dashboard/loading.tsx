import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div aria-busy="true" aria-label="대시보드 불러오는 중…">
      <div className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 md:h-19 md:px-8 md:py-0">
          <div className="space-y-2">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-8 md:py-8">
        <div className="space-y-5">
          <Skeleton className="h-9 w-full max-w-md" />
          {[0, 1].map((row) => (
            <div key={row} className="space-y-2.5">
              <Skeleton className="h-4 w-16" />
              <div className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 xl:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="space-y-3 bg-card p-5 sm:p-6">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-9 w-32" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-5">
          <Skeleton className="h-96 rounded-lg lg:col-span-3" />
          <Skeleton className="h-96 rounded-lg lg:col-span-2" />
        </div>
      </div>
    </div>
  );
}
