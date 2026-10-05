// 백엔드 연동 전 샘플 데이터. 오늘 날짜를 기준으로 만들어 언제 열어도 '이번 달' 지표가 채워진다.
import {
  addDays,
  monthRange,
  previousMonth,
  yearMonthOf,
  type ExpenseRecord,
  type ISODate,
  type KpiInput,
  type PayoutLineRecord,
  type ReservationRecord,
  type UnitDayRecord,
  type YearMonth,
} from "@repo/core";

export interface MockLastminuteConfig {
  startTime: string;
  endTime: string;
  intervalMin: number;
  step: number;
  floor: number;
  /** 오늘 밤 시작가 */
  tonightPrice: number;
}

export interface MockUnit {
  id: string;
  nickname: string;
  cleaningFee: number;
  managementFee: number;
  suppliesFee: number;
  lastminute: MockLastminuteConfig | null;
  /** 아직 구현되지 않은 기능(CS·요금 자동화)의 오늘 수치 */
  today: { unanswered: number; awaitingApproval: number; priceChanges: number; messagesSent: number };
}

export const MOCK_UNITS: MockUnit[] = [
  {
    id: "unit-dmc",
    nickname: "DMC역",
    cleaningFee: 27_000,
    managementFee: 120_000,
    suppliesFee: 43_000,
    lastminute: { startTime: "17:00", endTime: "23:50", intervalMin: 10, step: 1_000, floor: 92_000, tonightPrice: 120_000 },
    today: { unanswered: 1, awaitingApproval: 1, priceChanges: 3, messagesSent: 1 },
  },
  {
    id: "unit-hapjeong",
    nickname: "합정",
    cleaningFee: 30_000,
    managementFee: 95_000,
    suppliesFee: 31_000,
    lastminute: null,
    today: { unanswered: 0, awaitingApproval: 0, priceChanges: 0, messagesSent: 1 },
  },
];

/** [숙소, 체크인(오늘 기준 일수), 박, 인원, 1박 요금, 상태] */
type ReservationSpec = readonly [
  unitId: string,
  checkInOffset: number,
  nights: number,
  guests: number,
  nightlyRate: number,
  status?: "confirmed" | "cancelled",
];

// DMC역은 첨부 캘린더의 패턴(오늘 체크아웃 → 오늘 밤 공실 → 내일 입실 …)을 오늘 기준으로 옮겼다
const RESERVATION_SPECS: ReservationSpec[] = [
  ["unit-dmc", -38, 3, 2, 118_000],
  ["unit-dmc", -33, 4, 2, 121_000],
  ["unit-dmc", -26, 2, 1, 129_000],
  ["unit-dmc", -21, 5, 4, 132_000],
  ["unit-dmc", -14, 3, 2, 126_000],
  ["unit-dmc", -5, 5, 2, 124_000],
  ["unit-dmc", 1, 5, 1, 141_000],
  ["unit-dmc", 9, 4, 3, 140_000],
  ["unit-dmc", 17, 6, 6, 160_000],
  ["unit-dmc", 24, 5, 6, 165_000],
  ["unit-dmc", 30, 2, 2, 150_000, "cancelled"],
  ["unit-hapjeong", -35, 2, 2, 98_000],
  ["unit-hapjeong", -30, 3, 2, 102_000],
  ["unit-hapjeong", -24, 4, 3, 105_000],
  ["unit-hapjeong", -17, 2, 2, 99_000],
  ["unit-hapjeong", -12, 5, 2, 108_000],
  ["unit-hapjeong", -4, 3, 2, 110_000],
  ["unit-hapjeong", 2, 2, 2, 112_000],
  ["unit-hapjeong", 6, 4, 3, 118_000],
  ["unit-hapjeong", 15, 3, 2, 121_000],
];

/** 합정 호스트 사용으로 막은 날 (오늘 기준 일수) */
const BLOCKED_OFFSETS: Record<string, number[]> = { "unit-hapjeong": [11, 12, 13] };

/** 에어비앤비 호스트 서비스 수수료 */
const HOST_FEE_RATE = 0.03;

export interface MockReservation extends ReservationRecord {
  guestCount: number;
}

export interface MockDataset extends KpiInput {
  reservations: MockReservation[];
}

function nextMonth(month: YearMonth): YearMonth {
  return yearMonthOf(monthRange(month).next);
}

export function buildMockDataset(today: ISODate): MockDataset {
  const reservations: MockReservation[] = RESERVATION_SPECS.map(
    ([unitId, offset, nights, guests, rate, status = "confirmed"], i) => {
      const checkIn = addDays(today, offset);
      return {
        id: `res-${i + 1}`,
        unitId,
        status,
        checkIn,
        checkOut: addDays(checkIn, nights),
        hostPayout: Math.round(nights * rate * (1 - HOST_FEE_RATE)),
        guestCount: guests,
      };
    },
  );
  const confirmed = reservations.filter((r) => r.status === "confirmed");

  // 에어비앤비는 체크인 다음 날 정산한다
  const payoutLines: PayoutLineRecord[] = confirmed.map((r) => ({
    reservationId: r.id,
    unitId: r.unitId,
    payoutDate: addDays(r.checkIn, 1),
    amount: r.hostPayout ?? 0,
    kind: "reservation",
  }));
  payoutLines.push({
    reservationId: "res-14",
    unitId: "unit-hapjeong",
    payoutDate: addDays(today, -17),
    amount: -15_000,
    kind: "resolution",
  });

  const month = yearMonthOf(today);
  const months = [previousMonth(month), month, nextMonth(month)];
  const unitById = new Map(MOCK_UNITS.map((u) => [u.id, u]));

  const expenses: ExpenseRecord[] = confirmed.map((r) => ({
    unitId: r.unitId,
    date: r.checkOut,
    amount: unitById.get(r.unitId)?.cleaningFee ?? 0,
  }));
  for (const unit of MOCK_UNITS) {
    for (const m of months) {
      expenses.push({ unitId: unit.id, date: `${m}-03`, amount: unit.suppliesFee });
      expenses.push({ unitId: unit.id, date: `${m}-10`, amount: unit.managementFee });
    }
  }

  const unitDays: UnitDayRecord[] = [];
  const from = monthRange(months[0]!).start;
  const until = monthRange(months[2]!).next;
  for (const unit of MOCK_UNITS) {
    const blocked = new Set((BLOCKED_OFFSETS[unit.id] ?? []).map((o) => addDays(today, o)));
    const unitStays = confirmed.filter((r) => r.unitId === unit.id);
    for (let date = from; date < until; date = addDays(date, 1)) {
      const booked = unitStays.some((r) => r.checkIn <= date && date < r.checkOut);
      unitDays.push({
        unitId: unit.id,
        date,
        availability: booked ? "booked" : blocked.has(date) ? "blocked" : "available",
      });
    }
  }

  return { reservations, payoutLines, expenses, unitDays };
}
