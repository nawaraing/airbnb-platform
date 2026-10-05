import "server-only";
import { computeDashboardKpis, todayIn, yearMonthOf } from "@repo/core";
import { DEFAULT_TIMEZONE } from "@/lib/config";
import { buildMockDataset, MOCK_UNITS } from "@/lib/mock/dataset";
import { lastminuteStateAt, minutesOfDay, seedActivity } from "@/lib/mock/operations";
import type { DashboardQuery } from "./query";
import type { DashboardData, LastminuteSummary } from "./types";

/**
 * 대시보드 데이터. 백엔드 연동 전이라 샘플 데이터로 구성한다.
 * 연동 후에는 같은 반환 형태를 유지한 채 Supabase 조회(docs/08-data-model.md §12)로 바꾼다.
 */
export async function getDashboard(query: DashboardQuery, now: Date = new Date()): Promise<DashboardData> {
  const today = todayIn(DEFAULT_TIMEZONE, now);
  const month = yearMonthOf(today);
  const dataset = buildMockDataset(today);

  const unitId = MOCK_UNITS.some((u) => u.id === query.unitId) ? query.unitId : null;
  const scopedUnits = unitId ? MOCK_UNITS.filter((u) => u.id === unitId) : MOCK_UNITS;

  const kpis = computeDashboardKpis(dataset, { month, basis: query.basis, today, unitId });

  const nowMinutes = minutesOfDay(now);
  const lastminute: LastminuteSummary[] = scopedUnits.flatMap((unit) => {
    if (!unit.lastminute) return [];
    const tonight = dataset.unitDays.find((d) => d.unitId === unit.id && d.date === today);
    return [
      {
        unitId: unit.id,
        unitNickname: unit.nickname,
        state: lastminuteStateAt(unit.lastminute, tonight?.availability === "available", nowMinutes),
      },
    ];
  });

  const sum = (pick: (t: (typeof MOCK_UNITS)[number]["today"]) => number) =>
    scopedUnits.reduce((total, u) => total + pick(u.today), 0);

  // 동기화는 워크스페이스 단위이므로 숙소 필터와 관계없이 전체 기준
  const perUnit = MOCK_UNITS.map((u) => ({
    nickname: u.nickname,
    reservationCount: dataset.reservations.filter((r) => r.unitId === u.id).length,
  }));
  const activity = seedActivity(now, perUnit);

  return {
    source: "mock",
    renderedAt: now.toISOString(),
    today,
    month,
    basis: query.basis,
    unitId,
    units: MOCK_UNITS.map((u) => ({ id: u.id, nickname: u.nickname })),
    kpis,
    replies: {
      unanswered: sum((t) => t.unanswered),
      awaitingApproval: sum((t) => t.awaitingApproval),
    },
    automation: {
      paused: false,
      lastminute,
      priceChangesToday: sum((t) => t.priceChanges),
      messagesSentToday: sum((t) => t.messagesSent),
    },
    sync: {
      lastSyncedAt: activity.lastSyncedAt,
      reservationCount: dataset.reservations.length,
      perUnit,
    },
    integrations: {
      account: { name: "데모 호스트", plan: "베타" },
      airbnb: { status: "active" },
      alimtalk: { configured: false },
    },
    activity: activity.entries,
  };
}
