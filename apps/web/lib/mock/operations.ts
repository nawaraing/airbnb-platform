// 아직 구현되지 않은 운영 데이터(활동 로그, 당일 인하 진행 상태)의 샘플
import { DEFAULT_TIMEZONE } from "@/lib/config";
import type { ActivityEntry, LastminuteState } from "@/lib/dashboard/types";
import type { MockLastminuteConfig } from "./dataset";
import { syncScript, type UnitSyncCount } from "./sync-simulation";

const toMinutes = (hhmm: string) => {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const toHHMM = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

export function minutesOfDay(now: Date, timeZone = DEFAULT_TIMEZONE): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: "hour" | "minute") => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return get("hour") * 60 + get("minute");
}

/**
 * 당일 인하 규칙(docs/05-pricing-engine.md §5)을 현재 시각에 적용했을 때의 상태.
 * 시작 시각에 첫 인하, 이후 주기마다 인하, 최저 한계 도달 또는 종료 시각에 멈춘다.
 */
export function lastminuteStateAt(cfg: MockLastminuteConfig, vacantTonight: boolean, nowMinutes: number): LastminuteState {
  if (!vacantTonight) return { kind: "not_vacant" };

  const start = toMinutes(cfg.startTime);
  const end = toMinutes(cfg.endTime);
  if (nowMinutes < start) return { kind: "scheduled", startTime: cfg.startTime, startPrice: cfg.tonightPrice };

  const maxTicks = Math.floor((end - start) / cfg.intervalMin) + 1;
  const ticks = Math.min(Math.floor((Math.min(nowMinutes, end) - start) / cfg.intervalMin) + 1, maxTicks);
  const current = Math.max(cfg.floor, cfg.tonightPrice - ticks * cfg.step);

  if (current <= cfg.floor) return { kind: "stopped_floor", startPrice: cfg.tonightPrice, floorPrice: cfg.floor };
  if (ticks >= maxTicks) return { kind: "ended", startPrice: cfg.tonightPrice, finalPrice: current };
  return {
    kind: "running",
    startPrice: cfg.tonightPrice,
    currentPrice: current,
    floorPrice: cfg.floor,
    nextTickTime: toHHMM(start + ticks * cfg.intervalMin),
  };
}

/** 최근 활동 초기 로그. 마지막 동기화는 3분 전에 끝난 것으로 둔다. */
export function seedActivity(now: Date, units: UnitSyncCount[]): { entries: ActivityEntry[]; lastSyncedAt: string } {
  const at = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60_000).toISOString();

  const earlier: ActivityEntry[] = [
    { id: "seed-1", at: at(372), level: "warn", message: "알림톡 미설정 — 청소 일정은 카카오톡 공유로 보내주세요" },
    { id: "seed-2", at: at(185), level: "info", message: "AI 답변 초안 생성 — DMC역 체크인 문의 (승인 대기)" },
    { id: "seed-3", at: at(64), level: "success", message: "DMC역 요금 3건 변경 — 기간별 규칙 '주말 할증'" },
  ];

  // 마지막 동기화 로그는 실제 동기화 스크립트와 같은 문구를 쓴다
  const script = syncScript(units);
  const totalMs = script.reduce((sum, l) => sum + l.delayMs, 0);
  let offsetMs = 3 * 60_000 + totalMs;
  const syncRun = script.map((line, i): ActivityEntry => {
    offsetMs -= line.delayMs;
    return { id: `seed-sync-${i}`, at: at(offsetMs / 60_000), level: line.level, message: line.message };
  });

  return { entries: [...earlier, ...syncRun], lastSyncedAt: at(3) };
}
