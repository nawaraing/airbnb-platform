import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div aria-busy="true" aria-label="대시보드 불러오는 중">
      <div className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:h-19 md:px-8 md:py-0">
          <div className="space-y-2">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-8">
        <Skeleton className="h-9 w-full max-w-md" />
        {[0, 1].map((row) => (
          <div key={row} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ))}
        <div className="grid gap-4 lg:grid-cols-5">
          <Skeleton className="h-96 rounded-2xl lg:col-span-3" />
          <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
        </div>
      </div>
    </div>
  );
}
