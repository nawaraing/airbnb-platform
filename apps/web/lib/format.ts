import type { ISODate, YearMonth } from "@repo/core";
import { DEFAULT_TIMEZONE } from "./config";

const LOCALE = "ko-KR";
const numberFormat = new Intl.NumberFormat(LOCALE);
const percentFormat = new Intl.NumberFormat(LOCALE, { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });
const pointFormat = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const MINUS = "−";

// ISODate·YearMonth는 시간대 없는 달력 날짜라 UTC 자정으로 만들고 UTC로 읽는다 (서버·브라우저 결과가 같다)
const calendarDate = (date: string) => new Date(`${date}T00:00:00Z`);
const monthDayFormat = new Intl.DateTimeFormat(LOCALE, { timeZone: "UTC", month: "long", day: "numeric" });
const weekdayFormat = new Intl.DateTimeFormat(LOCALE, { timeZone: "UTC", weekday: "short" });
const yearMonthFormat = new Intl.DateTimeFormat(LOCALE, { timeZone: "UTC", year: "numeric", month: "long" });
const relativeFormat = new Intl.RelativeTimeFormat(LOCALE, { numeric: "always" });

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/** ₩3,358,044 / −₩15,000 */
export function formatKRW(value: number): string {
  return `${value < 0 ? MINUS : ""}₩${numberFormat.format(Math.abs(value))}`;
}

/** +₩3,200 / −₩3,200 / ±₩0 */
export function formatSignedKRW(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? MINUS : "±";
  return `${sign}₩${numberFormat.format(Math.abs(value))}`;
}

/** 0.849 → 84.9% */
export function formatPercent(ratio: number): string {
  return percentFormat.format(ratio);
}

/** 비율 차이 0.042 → +4.2%p */
export function formatPercentPointDelta(diff: number): string {
  const points = diff * 100;
  const sign = points > 0.05 ? "+" : points < -0.05 ? MINUS : "±";
  return `${sign}${pointFormat.format(Math.abs(points))}%p`;
}

/** 2026-10-05 → 10월 5일 */
export function formatMonthDay(date: ISODate): string {
  return monthDayFormat.format(calendarDate(date));
}

/** 2026-10-05 → 월 */
export function formatWeekday(date: ISODate): string {
  return weekdayFormat.format(calendarDate(date));
}

/** 2026-10 → 2026년 10월 */
export function formatYearMonth(month: YearMonth): string {
  return yearMonthFormat.format(calendarDate(`${month}-01`));
}

const clockFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: DEFAULT_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/** ISO 시각 → 12:41:10 (서울 기준) */
export function formatClock(iso: string): string {
  return clockFormat.format(new Date(iso));
}

/** ISO 시각 → 3분 전 */
export function formatRelative(iso: string, nowMs: number): string {
  const seconds = Math.max(0, Math.floor((nowMs - Date.parse(iso)) / 1000));
  if (seconds < 60) return "방금";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return relativeFormat.format(-minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return relativeFormat.format(-hours, "hour");
  return relativeFormat.format(-Math.floor(hours / 24), "day");
}
