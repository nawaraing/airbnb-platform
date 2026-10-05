// 대시보드 KPI 집계 (docs/02-features.md §3, docs/08-data-model.md §12)
import { diffDays, monthRange, previousMonth, type ISODate, type YearMonth } from "./dates";

/** 정산일 기준(현금 흐름) / 숙박일 기준(박 단위 안분) */
export type RevenueBasis = "payout" | "stay";

export type ReservationStatus = "inquiry" | "pending" | "confirmed" | "cancelled";

export type PayoutKind =
  | "reservation"
  | "adjustment"
  | "cancellation_fee"
  | "resolution"
  | "commission"
  | "payment_fee"
  | "other";

export interface ReservationRecord {
  id: string;
  unitId: string;
  status: ReservationStatus;
  checkIn: ISODate;
  checkOut: ISODate;
  /** 예정 순 정산액 */
  hostPayout: number | null;
}

export interface PayoutLineRecord {
  reservationId: string | null;
  unitId: string | null;
  payoutDate: ISODate;
  /** 음수 가능 (조정·환불·수수료) */
  amount: number;
  kind: PayoutKind;
}

export interface ExpenseRecord {
  unitId: string | null;
  date: ISODate;
  amount: number;
}

export interface UnitDayRecord {
  unitId: string;
  date: ISODate;
  availability: "available" | "booked" | "blocked";
}

export interface KpiInput {
  reservations: ReservationRecord[];
  payoutLines: PayoutLineRecord[];
  expenses: ExpenseRecord[];
  unitDays: UnitDayRecord[];
}

export interface KpiOptions {
  month: YearMonth;
  basis: RevenueBasis;
  today: ISODate;
  /** 없으면 전체 숙소 */
  unitId?: string | null;
}

export interface MonthKpis {
  bookings: number;
  revenue: number;
  expenses: {
    total: number;
    /** 오늘 이후 날짜의 지출 (예정 청소비 등) */
    scheduled: number;
  };
  netProfit: number;
  /** 순수익 / 매출. 매출이 0 이하면 null */
  margin: number | null;
  /** 판매된 박 / 판매 가능 박 (차단 제외). 판매 가능 박이 없으면 null */
  occupancy: number | null;
  soldNights: number;
  /** 숙박 매출 / 판매된 박. 판매된 박이 없으면 null */
  adr: number | null;
}

export interface NextCleaning {
  date: ISODate;
  count: number;
}

export interface DashboardKpis {
  current: MonthKpis;
  previous: MonthKpis;
  nextCleaning: NextCleaning | null;
}

interface Range {
  start: ISODate;
  next: ISODate;
}

const inRange = (date: ISODate, { start, next }: Range) => date >= start && date < next;

const isConfirmed = (r: ReservationRecord) => r.status === "confirmed";

function nightsOf(r: ReservationRecord): number {
  return diffDays(r.checkOut, r.checkIn);
}

/** 예약의 박 중 범위 안에 들어가는 박 수 */
export function overlapNights(r: ReservationRecord, { start, next }: Range): number {
  const from = r.checkIn > start ? r.checkIn : start;
  const to = r.checkOut < next ? r.checkOut : next;
  return Math.max(0, diffDays(to, from));
}

function payoutRevenue(lines: PayoutLineRecord[], range: Range): number {
  return lines.reduce((sum, l) => (inRange(l.payoutDate, range) ? sum + l.amount : sum), 0);
}

/** 정산액을 박 수로 균등 안분해 범위에 속한 몫만 합산 */
function stayRevenue(reservations: ReservationRecord[], range: Range): number {
  const total = reservations.reduce((sum, r) => {
    const nights = nightsOf(r);
    if (!isConfirmed(r) || r.hostPayout === null || nights <= 0) return sum;
    return sum + (r.hostPayout * overlapNights(r, range)) / nights;
  }, 0);
  return Math.round(total);
}

function bookingCount(input: KpiInput, basis: RevenueBasis, range: Range): number {
  if (basis === "payout") {
    const ids = new Set<string>();
    for (const l of input.payoutLines) {
      if (l.kind === "reservation" && l.reservationId !== null && inRange(l.payoutDate, range)) {
        ids.add(l.reservationId);
      }
    }
    return ids.size;
  }
  return input.reservations.filter((r) => isConfirmed(r) && overlapNights(r, range) > 0).length;
}

function monthKpis(input: KpiInput, month: YearMonth, basis: RevenueBasis, today: ISODate): MonthKpis {
  const range = monthRange(month);

  const revenue =
    basis === "payout" ? payoutRevenue(input.payoutLines, range) : stayRevenue(input.reservations, range);

  let expenseTotal = 0;
  let expenseScheduled = 0;
  for (const e of input.expenses) {
    if (!inRange(e.date, range)) continue;
    expenseTotal += e.amount;
    if (e.date > today) expenseScheduled += e.amount;
  }

  let booked = 0;
  let sellable = 0;
  for (const d of input.unitDays) {
    if (!inRange(d.date, range) || d.availability === "blocked") continue;
    sellable += 1;
    if (d.availability === "booked") booked += 1;
  }

  const soldNights = input.reservations
    .filter(isConfirmed)
    .reduce((sum, r) => sum + overlapNights(r, range), 0);

  const netProfit = revenue - expenseTotal;

  return {
    bookings: bookingCount(input, basis, range),
    revenue,
    expenses: { total: expenseTotal, scheduled: expenseScheduled },
    netProfit,
    margin: revenue > 0 ? netProfit / revenue : null,
    occupancy: sellable > 0 ? booked / sellable : null,
    soldNights,
    // ADR은 기준 토글과 관계없이 숙박 매출로 계산한다
    adr: soldNights > 0 ? Math.round(stayRevenue(input.reservations, range) / soldNights) : null,
  };
}

/**
 * 오늘 이후(오늘 포함) 가장 가까운 청소일과 그날 청소 건수.
 * 청소일 = 확정 예약의 체크아웃일 (docs/07-cleaning-ops.md §1.1). 수동 청소 작업은 포함하지 않는다.
 */
export function nextCleaning(reservations: ReservationRecord[], today: ISODate): NextCleaning | null {
  let date: ISODate | null = null;
  let count = 0;
  for (const r of reservations) {
    if (!isConfirmed(r) || r.checkOut < today) continue;
    if (date === null || r.checkOut < date) {
      date = r.checkOut;
      count = 1;
    } else if (r.checkOut === date) {
      count += 1;
    }
  }
  return date === null ? null : { date, count };
}

function filterByUnit(input: KpiInput, unitId: string): KpiInput {
  return {
    reservations: input.reservations.filter((r) => r.unitId === unitId),
    payoutLines: input.payoutLines.filter((l) => l.unitId === unitId),
    expenses: input.expenses.filter((e) => e.unitId === unitId),
    unitDays: input.unitDays.filter((d) => d.unitId === unitId),
  };
}

export function computeDashboardKpis(input: KpiInput, options: KpiOptions): DashboardKpis {
  const scoped = options.unitId ? filterByUnit(input, options.unitId) : input;
  return {
    current: monthKpis(scoped, options.month, options.basis, options.today),
    previous: monthKpis(scoped, previousMonth(options.month), options.basis, options.today),
    nextCleaning: nextCleaning(scoped.reservations, options.today),
  };
}
