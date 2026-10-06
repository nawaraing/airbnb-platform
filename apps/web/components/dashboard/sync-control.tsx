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

/** 헤더 오른쪽: 동기화 상태 + 지금 동기화 버튼 */
export function SyncControl() {
  const { syncing, startSync } = useDashboardLive();
  const label = useSyncLabel();

  return (
    <>
      <span role="status" className="hidden items-center gap-2 text-sm text-muted-foreground tabular-nums sm:inline-flex">
        <span
          aria-hidden
          className={cn("size-2 rounded-full", syncing ? "bg-brass motion-safe:animate-pulse" : "bg-success")}
        />
        {label}
      </span>
      <Button
        onClick={startSync}
        disabled={syncing}
        className="h-9 rounded-md px-3.5 text-sm font-semibold disabled:opacity-70"
      >
        <RefreshCw className={cn("size-4", syncing && "motion-safe:animate-spin")} aria-hidden />
        {syncing ? "동기화 중…" : "지금 동기화"}
      </Button>
    </>
  );
}

/** 좁은 화면에서 제목 아래에 보이는 동기화 상태 */
export function SyncCaption({ className }: { className?: string }) {
  const label = useSyncLabel();
  return <span className={className}>{label}</span>;
}
