import { describe, expect, it } from "vitest";
import {
  computeDashboardKpis,
  nextCleaning,
  type KpiInput,
  type ReservationRecord,
} from "./kpi";

const res = (over: Partial<ReservationRecord> & Pick<ReservationRecord, "id">): ReservationRecord => ({
  unitId: "u1",
  status: "confirmed",
  checkIn: "2026-10-06",
  checkOut: "2026-10-08",
  hostPayout: 200_000,
  ...over,
});

const empty: KpiInput = { reservations: [], payoutLines: [], expenses: [], unitDays: [] };
const opts = { month: "2026-10", today: "2026-10-05" } as const;

describe("매출", () => {
  it("정산일 기준: 해당 월 정산 내역을 조정금까지 합산한다", () => {
    const input: KpiInput = {
      ...empty,
      payoutLines: [
        { reservationId: "r1", unitId: "u1", payoutDate: "2026-10-02", amount: 300_000, kind: "reservation" },
        { reservationId: "r1", unitId: "u1", payoutDate: "2026-10-20", amount: -15_000, kind: "resolution" },
        { reservationId: "r0", unitId: "u1", payoutDate: "2026-09-30", amount: 999_000, kind: "reservation" },
      ],
    };
    const { current } = computeDashboardKpis(input, { ...opts, basis: "payout" });
    expect(current.revenue).toBe(285_000);
    expect(current.bookings).toBe(1);
  });

  it("숙박일 기준: 월을 걸친 예약은 해당 월 박 수만큼 안분한다", () => {
    const input: KpiInput = {
      ...empty,
      // 9/29~10/3, 4박 중 10월은 10/1·10/2 2박
      reservations: [res({ id: "r1", checkIn: "2026-09-29", checkOut: "2026-10-03", hostPayout: 400_000 })],
    };
    const { current, previous } = computeDashboardKpis(input, { ...opts, basis: "stay" });
    expect(current.revenue).toBe(200_000);
    expect(previous.revenue).toBe(200_000);
    expect(current.bookings).toBe(1);
    expect(current.soldNights).toBe(2);
  });

  it("취소된 예약은 매출·예약 수·판매 박에서 빠진다", () => {
    const input: KpiInput = {
      ...empty,
      reservations: [res({ id: "r1" }), res({ id: "r2", status: "cancelled" })],
    };
    const { current } = computeDashboardKpis(input, { ...opts, basis: "stay" });
    expect(current.revenue).toBe(200_000);
    expect(current.bookings).toBe(1);
    expect(current.soldNights).toBe(2);
  });
});

describe("지출·순수익", () => {
  it("오늘 이후 지출은 예정분으로 따로 집계한다", () => {
    const input: KpiInput = {
      ...empty,
      payoutLines: [{ reservationId: "r1", unitId: "u1", payoutDate: "2026-10-02", amount: 500_000, kind: "reservation" }],
      expenses: [
        { unitId: "u1", date: "2026-10-05", amount: 27_000 },
        { unitId: "u1", date: "2026-10-11", amount: 27_000 },
        { unitId: "u1", date: "2026-11-01", amount: 99_000 },
      ],
    };
    const { current } = computeDashboardKpis(input, { ...opts, basis: "payout" });
    expect(current.expenses).toEqual({ total: 54_000, scheduled: 27_000 });
    expect(current.netProfit).toBe(446_000);
    expect(current.margin).toBeCloseTo(0.892);
  });

  it("매출이 없으면 순수익률은 null", () => {
    const input: KpiInput = { ...empty, expenses: [{ unitId: "u1", date: "2026-10-03", amount: 10_000 }] };
    const { current } = computeDashboardKpis(input, { ...opts, basis: "payout" });
    expect(current.netProfit).toBe(-10_000);
    expect(current.margin).toBeNull();
  });
});

describe("가동률·ADR", () => {
  it("차단일은 판매 가능 박에서 제외한다", () => {
    const input: KpiInput = {
      ...empty,
      unitDays: [
        { unitId: "u1", date: "2026-10-01", availability: "booked" },
        { unitId: "u1", date: "2026-10-02", availability: "available" },
        { unitId: "u1", date: "2026-10-03", availability: "blocked" },
        { unitId: "u1", date: "2026-10-04", availability: "booked" },
      ],
    };
    const { current } = computeDashboardKpis(input, { ...opts, basis: "payout" });
    expect(current.occupancy).toBeCloseTo(2 / 3);
  });

  it("ADR은 기준과 관계없이 숙박 매출 / 판매된 박", () => {
    const input: KpiInput = {
      ...empty,
      reservations: [res({ id: "r1", checkIn: "2026-10-06", checkOut: "2026-10-10", hostPayout: 500_000 })],
    };
    const payout = computeDashboardKpis(input, { ...opts, basis: "payout" }).current;
    expect(payout.revenue).toBe(0); // 정산 내역 없음
    expect(payout.adr).toBe(125_000);
  });

  it("데이터가 없으면 null", () => {
    const { current } = computeDashboardKpis(empty, { ...opts, basis: "payout" });
    expect(current.occupancy).toBeNull();
    expect(current.adr).toBeNull();
  });
});

describe("다음 청소", () => {
  it("오늘 포함 가장 이른 체크아웃일과 그날 건수를 센다", () => {
    const reservations = [
      res({ id: "past", checkIn: "2026-10-01", checkOut: "2026-10-04" }),
      res({ id: "a", unitId: "u1", checkIn: "2026-10-03", checkOut: "2026-10-05" }),
      res({ id: "b", unitId: "u2", checkIn: "2026-10-02", checkOut: "2026-10-05" }),
      res({ id: "c", checkIn: "2026-10-05", checkOut: "2026-10-07" }),
      res({ id: "x", status: "cancelled", checkIn: "2026-10-01", checkOut: "2026-10-05" }),
    ];
    expect(nextCleaning(reservations, "2026-10-05")).toEqual({ date: "2026-10-05", count: 2 });
  });

  it("예정된 청소가 없으면 null", () => {
    expect(nextCleaning([], "2026-10-05")).toBeNull();
  });
});

describe("숙소 필터", () => {
  it("지정한 숙소 데이터만 집계한다", () => {
    const input: KpiInput = {
      ...empty,
      payoutLines: [
        { reservationId: "r1", unitId: "u1", payoutDate: "2026-10-02", amount: 100_000, kind: "reservation" },
        { reservationId: "r2", unitId: "u2", payoutDate: "2026-10-02", amount: 300_000, kind: "reservation" },
      ],
    };
    const all = computeDashboardKpis(input, { ...opts, basis: "payout" }).current;
    const u2 = computeDashboardKpis(input, { ...opts, basis: "payout", unitId: "u2" }).current;
    expect(all.revenue).toBe(400_000);
    expect(u2.revenue).toBe(300_000);
    expect(u2.bookings).toBe(1);
  });
});
