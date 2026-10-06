"use client";

import type { RevenueBasis } from "@repo/core";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { DashboardQuery } from "@/lib/dashboard/query";
import type { DataSource, UnitOption } from "@/lib/dashboard/types";
import { useDashboardLive } from "./dashboard-live";

const ALL_UNITS = "all";

const SEGMENT =
  "h-7 rounded-md px-3 text-muted-foreground hover:bg-transparent hover:text-foreground data-[state=on]:bg-card data-[state=on]:font-semibold data-[state=on]:text-foreground data-[state=on]:shadow-xs";

export function DashboardToolbar({
  query,
  units,
  monthLabel,
  source,
}: {
  query: DashboardQuery;
  units: UnitOption[];
  monthLabel: string;
  source: DataSource;
}) {
  const { navigate, navigating } = useDashboardLive();
  // Radix SelectValue는 선택 항목 텍스트를 하이드레이션 후에 채우므로, 첫 렌더부터 보이도록 직접 넘긴다
  const selectedLabel = units.find((u) => u.id === query.unitId)?.nickname ?? "전체 숙소";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 className="text-lg font-semibold tracking-tight">
          이번 달 <span className="ml-1 font-normal text-muted-foreground tabular-nums">{monthLabel}</span>
        </h2>
        {source === "mock" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="cursor-help rounded-sm border border-warning/30 bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning transition-colors hover:border-warning/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                데모 데이터
              </button>
            </TooltipTrigger>
            <TooltipContent>에어비앤비 연동 전까지 샘플 데이터로 표시합니다</TooltipContent>
          </Tooltip>
        )}
        <span role="status" className="inline-flex">
          {navigating && (
            <>
              <Loader2 className="size-4 text-muted-foreground motion-safe:animate-spin" aria-hidden />
              <span className="sr-only">불러오는 중…</span>
            </>
          )}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={query.unitId ?? ALL_UNITS}
          onValueChange={(value) => navigate({ ...query, unitId: value === ALL_UNITS ? null : value })}
        >
          <SelectTrigger aria-label="숙소" className="h-9 min-w-36 rounded-lg bg-card data-[size=default]:h-9">
            <SelectValue>{selectedLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_UNITS}>전체 숙소</SelectItem>
            {units.map((unit) => (
              <SelectItem key={unit.id} value={unit.id}>
                {unit.nickname}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ToggleGroup
          type="single"
          spacing={1}
          aria-label="매출 기준"
          value={query.basis}
          onValueChange={(value) => value && navigate({ ...query, basis: value as RevenueBasis })}
          className="rounded-lg bg-muted p-1 ring-1 ring-border ring-inset"
        >
          <ToggleGroupItem value="payout" className={SEGMENT}>
            정산일 기준
          </ToggleGroupItem>
          <ToggleGroupItem value="stay" className={SEGMENT}>
            숙박일 기준
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
