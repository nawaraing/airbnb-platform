"use client";

import { useEffect, useRef } from "react";
import type { ActivityLevel } from "@/lib/dashboard/types";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDashboardLive } from "./dashboard-live";

const LEVEL_STYLE: Record<ActivityLevel, { glyph: string; className: string }> = {
  info: { glyph: "", className: "text-log-foreground" },
  success: { glyph: "✓ ", className: "text-log-success" },
  warn: { glyph: "! ", className: "text-log-warn" },
  error: { glyph: "✕ ", className: "text-log-error" },
};

/** 터미널형 활동 로그 (docs/02-features.md §1) */
export function ActivityPanel({ className }: { className?: string }) {
  const { activity, syncing } = useDashboardLive();
  const scrollRef = useRef<HTMLDivElement>(null);

  // 새 로그가 오면 맨 아래로
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [activity.length]);

  return (
    <section
      aria-labelledby="activity-title"
      className={cn("flex flex-col overflow-hidden rounded-lg border border-log bg-log text-log-foreground", className)}
    >
      <div className="flex items-center justify-between gap-3 border-b border-log-border px-5 py-3.5">
        <h2 id="activity-title" className="text-[15px] font-semibold">
          최근 활동
        </h2>
        {syncing && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-log-success">
            <span className="size-1.5 rounded-full bg-log-success motion-safe:animate-pulse" aria-hidden />
            실시간
          </span>
        )}
      </div>

      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label="활동 로그"
        tabIndex={0}
        className="h-72 overflow-y-auto overscroll-contain px-5 py-4 font-mono text-[13px] leading-6 focus-visible:ring-2 focus-visible:ring-log-success/60 focus-visible:outline-none focus-visible:ring-inset lg:h-auto lg:min-h-80 lg:flex-1 lg:basis-0"
      >
        {activity.length === 0 ? (
          <p className="text-log-muted">아직 활동이 없습니다</p>
        ) : (
          <ol>
            {activity.map((entry) => {
              const style = LEVEL_STYLE[entry.level];
              return (
                <li key={entry.id} className="flex gap-4">
                  <time dateTime={entry.at} className="shrink-0 text-log-muted tabular-nums">
                    {formatClock(entry.at)}
                  </time>
                  <span className={cn("min-w-0 wrap-break-word", style.className)}>
                    {style.glyph}
                    {entry.message}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
