"use client";

import { Clock } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ActivityLevel } from "@/lib/dashboard/types";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDashboardLive } from "./dashboard-live";
import { IconTile } from "./kpi-card";

const LEVEL_STYLE: Record<ActivityLevel, { glyph: string; className: string }> = {
  info: { glyph: "", className: "text-zinc-200" },
  success: { glyph: "✓ ", className: "text-emerald-400" },
  warn: { glyph: "! ", className: "text-amber-300" },
  error: { glyph: "✕ ", className: "text-rose-400" },
};

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
      className={cn("flex flex-col rounded-2xl border bg-card p-5 shadow-xs sm:p-6", className)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <IconTile icon={Clock} tone="indigo" />
          <h2 id="activity-title" className="text-lg font-semibold">
            최근 활동
          </h2>
        </div>
        {syncing && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" aria-hidden />
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
        className="mt-4 h-72 overflow-y-auto rounded-xl bg-zinc-950 px-4 py-3 lg:h-auto lg:min-h-72 lg:flex-1 lg:basis-0 text-[13px] leading-6 [font-family:var(--font-geist-mono),var(--font-pretendard),monospace] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {activity.length === 0 ? (
          <p className="text-zinc-500">아직 활동이 없습니다</p>
        ) : (
          <ol>
            {activity.map((entry) => {
              const style = LEVEL_STYLE[entry.level];
              return (
                <li key={entry.id} className="flex gap-3">
                  <time dateTime={entry.at} className="shrink-0 text-zinc-500 tabular-nums">
                    {formatClock(entry.at)}
                  </time>
                  <span className={style.className}>
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
