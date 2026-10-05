import { weekdayOf, type ISODate, type YearMonth } from "@repo/core";
import { DEFAULT_TIMEZONE } from "./config";

const numberFormat = new Intl.NumberFormat("ko-KR");
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;
const MINUS = "−";

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
export function formatPercent(ratio: number, fractionDigits = 1): string {
  return `${(ratio * 100).toFixed(fractionDigits)}%`;
}

/** 비율 차이 0.042 → +4.2%p */
export function formatPercentPointDelta(diff: number): string {
  const points = diff * 100;
  const sign = points > 0.05 ? "+" : points < -0.05 ? MINUS : "±";
  return `${sign}${Math.abs(points).toFixed(1)}%p`;
}

/** 2026-10-05 → 10/05 */
export function formatMonthDay(date: ISODate): string {
  return `${date.slice(5, 7)}/${date.slice(8, 10)}`;
}

/** 2026-10-05 → 월 */
export function formatWeekday(date: ISODate): string {
  return WEEKDAYS[weekdayOf(date)] ?? "";
}

/** 2026-10 → 2026년 10월 */
export function formatYearMonth(month: YearMonth): string {
  return `${month.slice(0, 4)}년 ${Number(month.slice(5, 7))}월`;
}

const clockFormat = new Intl.DateTimeFormat("ko-KR", {
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
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}
