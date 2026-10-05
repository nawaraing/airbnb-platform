/** 시간대 없는 달력 날짜 `YYYY-MM-DD` (숙박일·정산일·청소일) */
export type ISODate = string;
/** `YYYY-MM` */
export type YearMonth = string;

const DAY_MS = 86_400_000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const YEAR_MONTH = /^(\d{4})-(\d{2})$/;

function toUtcMs(date: ISODate): number {
  const m = ISO_DATE.exec(date);
  if (!m) throw new Error(`잘못된 날짜 형식: ${date}`);
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function fromUtcMs(ms: number): ISODate {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(date: ISODate, days: number): ISODate {
  return fromUtcMs(toUtcMs(date) + days * DAY_MS);
}

/** `a − b` 일수 */
export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((toUtcMs(a) - toUtcMs(b)) / DAY_MS);
}

/** 0=일 … 6=토 */
export function weekdayOf(date: ISODate): number {
  return new Date(toUtcMs(date)).getUTCDay();
}

export function yearMonthOf(date: ISODate): YearMonth {
  return date.slice(0, 7);
}

/** 월의 첫날(포함)과 다음 달 첫날(제외) */
export function monthRange(month: YearMonth): { start: ISODate; next: ISODate } {
  const m = YEAR_MONTH.exec(month);
  if (!m) throw new Error(`잘못된 연월 형식: ${month}`);
  const year = Number(m[1]);
  const monthIndex = Number(m[2]) - 1;
  return {
    start: fromUtcMs(Date.UTC(year, monthIndex, 1)),
    next: fromUtcMs(Date.UTC(year, monthIndex + 1, 1)),
  };
}

export function previousMonth(month: YearMonth): YearMonth {
  const { start } = monthRange(month);
  return yearMonthOf(addDays(start, -1));
}

/** 주어진 시간대에서 `now`가 속한 날짜 */
export function todayIn(timeZone: string, now: Date = new Date()): ISODate {
  // en-CA 로캘은 YYYY-MM-DD 형식으로 출력한다
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
