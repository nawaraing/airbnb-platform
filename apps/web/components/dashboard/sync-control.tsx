"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDashboardLive } from "./dashboard-live";

function useSyncLabel() {
  const { sync, syncing, nowMs } = useDashboardLive();
  if (syncing) return "동기화 중…";
  return `${formatRelative(sync.lastSyncedAt, nowMs)} 동기화 · 예약 ${formatNumber(sync.reservationCount)}건`;
}

/** 헤더 오른쪽: 동기화 상태 배지 + 지금 동기화 버튼 */
export function SyncControl() {
  const { syncing, startSync } = useDashboardLive();
  const label = useSyncLabel();

  return (
    <>
      <span
        role="status"
        className={cn(
          "hidden items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold ring-1 ring-inset sm:inline-flex",
          syncing ? "bg-accent text-accent-foreground ring-primary/15" : "bg-emerald-50 text-emerald-700 ring-emerald-100",
        )}
      >
        <span className={cn("size-2 rounded-full", syncing ? "animate-pulse bg-primary" : "bg-emerald-500")} />
        {label}
      </span>
      <Button
        size="lg"
        onClick={startSync}
        disabled={syncing}
        className="h-10 rounded-xl px-4 text-[15px] font-semibold shadow-sm shadow-primary/25"
      >
        <RefreshCw className={cn("size-[18px]", syncing && "animate-spin")} aria-hidden />
        {syncing ? "동기화 중" : "지금 동기화"}
      </Button>
    </>
  );
}

/** 모바일에서 제목 아래에 보이는 동기화 상태 */
export function SyncCaption({ className }: { className?: string }) {
  const label = useSyncLabel();
  return <span className={className}>{label}</span>;
}
