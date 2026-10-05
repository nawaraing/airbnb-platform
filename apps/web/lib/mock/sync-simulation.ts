// '지금 동기화'의 샘플 동작. 실제 구현에서는 POST /api/sync로 잡을 등록하고,
// 진행 로그는 Supabase Realtime(activity_logs)으로 받는다 (docs/03-architecture.md §6).
import type { ActivityEntry, ActivityLevel } from "@/lib/dashboard/types";

export interface UnitSyncCount {
  nickname: string;
  reservationCount: number;
}

interface ScriptLine {
  /** 이전 줄로부터의 지연 */
  delayMs: number;
  level: ActivityLevel;
  message: string;
}

export function syncScript(units: UnitSyncCount[]): ScriptLine[] {
  const total = units.reduce((sum, u) => sum + u.reservationCount, 0);
  return [
    { delayMs: 0, level: "info", message: "동기화 시작" },
    { delayMs: 500, level: "success", message: "에어비앤비 세션 확인 — 정상" },
    ...units.flatMap((u): ScriptLine[] => [
      { delayMs: 600, level: "info", message: `${u.nickname} 예약 조회 중…` },
      { delayMs: 900, level: "info", message: `${u.nickname}: 예약 ${u.reservationCount}건 — 게스트·정산 정보 수집 중…` },
    ]),
    { delayMs: 700, level: "info", message: "캘린더 90일 갱신" },
    { delayMs: 500, level: "success", message: `동기화 완료 — 예약 ${total}건 저장` },
  ];
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });

export async function runMockSync(
  units: UnitSyncCount[],
  onEntry: (entry: ActivityEntry) => void,
  signal?: AbortSignal,
): Promise<void> {
  const runId = Date.now();
  for (const [i, line] of syncScript(units).entries()) {
    await sleep(line.delayMs, signal);
    onEntry({ id: `sync-${runId}-${i}`, at: new Date().toISOString(), level: line.level, message: line.message });
  }
}
