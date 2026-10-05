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
      <div className="flex items-center gap-2.5">
        <h2 className="text-lg font-semibold">이번 달</h2>
        <span className="text-[15px] text-muted-foreground">{monthLabel}</span>
        {source === "mock" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                tabIndex={0}
                className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200 ring-inset"
              >
                데모 데이터
              </span>
            </TooltipTrigger>
            <TooltipContent>에어비앤비 연동 전까지 샘플 데이터로 표시합니다</TooltipContent>
          </Tooltip>
        )}
        {navigating && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="불러오는 중" />}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={query.unitId ?? ALL_UNITS}
          onValueChange={(value) => navigate({ ...query, unitId: value === ALL_UNITS ? null : value })}
        >
          <SelectTrigger aria-label="숙소" className="h-9 min-w-32 rounded-xl bg-card">
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
          variant="outline"
          spacing={0}
          aria-label="매출 기준"
          value={query.basis}
          onValueChange={(value) => value && navigate({ ...query, basis: value as RevenueBasis })}
          className="rounded-xl bg-card"
        >
          <ToggleGroupItem value="payout" className="h-9 px-3 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground">
            정산일 기준
          </ToggleGroupItem>
          <ToggleGroupItem value="stay" className="h-9 px-3 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground">
            숙박일 기준
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
