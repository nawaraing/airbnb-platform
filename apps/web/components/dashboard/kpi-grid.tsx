import { diffDays } from "@repo/core";
import {
  BedDouble,
  CalendarDays,
  Gauge,
  MessageSquareText,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import type { DashboardData, LastminuteState } from "@/lib/dashboard/types";
import { formatKRW, formatMonthDay, formatPercent, formatWeekday } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Amount, Delta, Figure, KpiCard } from "./kpi-card";

const diffOrNull = (a: number | null, b: number | null) => (a === null || b === null ? null : a - b);

function relativeDayLabel(days: number): string {
  if (days === 0) return "오늘";
  if (days === 1) return "내일";
  return `${days}일 후`;
}

function describeLastminute(state: LastminuteState): { status: string; detail: string; live: boolean } {
  switch (state.kind) {
    case "scheduled":
      return { status: `${state.startTime} 시작 예정`, detail: `시작가 ${formatKRW(state.startPrice)}`, live: false };
    case "running":
      return {
        status: "진행 중",
        detail: `${formatKRW(state.startPrice)} → ${formatKRW(state.currentPrice)} · 다음 인하 ${state.nextTickTime}`,
        live: true,
      };
    case "stopped_floor":
      return { status: "최저가 도달", detail: `${formatKRW(state.floorPrice)}에서 멈춤`, live: false };
    case "stopped_booked":
      return { status: "예약됨", detail: `${formatKRW(state.soldPrice)}에 판매`, live: false };
    case "ended":
      return { status: "오늘 종료", detail: `최종 ${formatKRW(state.finalPrice)}`, live: false };
    case "not_vacant":
      return { status: "오늘 예약 있음", detail: "인하하지 않습니다", live: false };
  }
}

export function KpiGrid({ data }: { data: DashboardData }) {
  const { current, previous, nextCleaning } = data.kpis;
  const isPayout = data.basis === "payout";
  const pendingReplies = data.replies.unanswered + data.replies.awaitingApproval;

  return (
    <>
      <section aria-label="이번 달 실적" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={CalendarDays}
          tone="indigo"
          label="이번 달 예약"
          footer={`${isPayout ? "정산일" : "숙박일"} 기준 · 지난달 ${previous.bookings}건`}
        >
          <Figure unit="건">{current.bookings}</Figure>
        </KpiCard>

        <KpiCard
          icon={Wallet}
          tone="amber"
          label="이번 달 매출"
          footer={isPayout ? "정산일 기준 · 실제 정산액" : "숙박일 기준 · 박 단위 안분"}
        >
          <Amount value={current.revenue} />
        </KpiCard>

        <KpiCard
          icon={TrendingUp}
          tone="emerald"
          label="이번 달 순수익"
          footer={
            <>
              <p>
                순수익률 {current.margin === null ? "—" : formatPercent(current.margin)} · 지출{" "}
                {formatKRW(current.expenses.total)}
              </p>
              {current.expenses.scheduled > 0 && <p>예정 지출 {formatKRW(current.expenses.scheduled)} 포함</p>}
            </>
          }
        >
          <Amount value={current.netProfit} />
        </KpiCard>

        <KpiCard
          icon={Sparkles}
          tone="sky"
          label="다음 청소"
          footer={nextCleaning ? `${nextCleaning.count}건 청소 필요` : "다음 체크아웃이 생기면 표시돼요"}
        >
          {nextCleaning ? (
            <Figure>
              {formatMonthDay(nextCleaning.date)}
              <span className="text-base font-semibold text-muted-foreground">
                ({formatWeekday(nextCleaning.date)})
              </span>
              <span className="ml-1 self-center rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-100 ring-inset">
                {relativeDayLabel(diffDays(nextCleaning.date, data.today))}
              </span>
            </Figure>
          ) : (
            <Figure>예정 없음</Figure>
          )}
        </KpiCard>
      </section>

      <section aria-label="운영 지표" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Gauge}
          tone="violet"
          label="가동률"
          footer={
            <p>
              <Delta diff={diffOrNull(current.occupancy, previous.occupancy)} kind="percentPoint" /> · 판매{" "}
              {current.soldNights}박
            </p>
          }
        >
          <Figure size="md">{current.occupancy === null ? "—" : formatPercent(current.occupancy)}</Figure>
        </KpiCard>

        <KpiCard
          icon={BedDouble}
          tone="teal"
          label="평균 객단가 (ADR)"
          footer={<Delta diff={diffOrNull(current.adr, previous.adr)} kind="krw" />}
        >
          {current.adr === null ? <Figure size="md">—</Figure> : <Amount value={current.adr} size="md" />}
        </KpiCard>

        <KpiCard
          icon={MessageSquareText}
          tone="rose"
          label="답변 대기"
          footer={
            pendingReplies === 0
              ? "모두 답변했어요"
              : `승인 대기 ${data.replies.awaitingApproval} · 미응답 ${data.replies.unanswered}`
          }
        >
          <Figure size="md" unit="건">
            {pendingReplies}
          </Figure>
        </KpiCard>

        <KpiCard
          icon={Zap}
          tone="orange"
          label="오늘의 자동화"
          footer={`요금 변경 ${data.automation.priceChangesToday}건 · 메시지 발송 ${data.automation.messagesSentToday}건`}
        >
          {data.automation.lastminute.length === 0 ? (
            <p className="text-[15px] font-semibold">당일 인하 꺼짐</p>
          ) : (
            <ul className="space-y-2">
              {data.automation.lastminute.map(({ unitId, unitNickname, state }) => {
                const { status, detail, live } = describeLastminute(state);
                return (
                  <li key={unitId}>
                    <p className="flex flex-wrap items-center gap-x-2 text-[15px] font-semibold">
                      {unitNickname} 당일 인하
                      <span className={cn("inline-flex items-center gap-1.5", live ? "text-primary" : "text-muted-foreground")}>
                        {live && <span className="size-1.5 animate-pulse rounded-full bg-primary" aria-hidden />}
                        {status}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground tabular-nums">{detail}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </KpiCard>
      </section>
    </>
  );
}
