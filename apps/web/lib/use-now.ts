"use client";

import { useSyncExternalStore } from "react";

const TICK_MS = 30_000;

// useSyncExternalStore는 값이 바뀌지 않았으면 같은 스냅샷을 돌려받아야 하므로 시각을 저장해 둔다
let current = Date.now();

function subscribe(onChange: () => void) {
  current = Date.now();
  const id = setInterval(() => {
    current = Date.now();
    onChange();
  }, TICK_MS);
  return () => clearInterval(id);
}

const getSnapshot = () => current;

/**
 * 30초마다 갱신되는 현재 시각(ms).
 * 하이드레이션 중에는 서버 렌더 시각을 써서 '3분 전' 같은 상대 시간이 서버 HTML과 어긋나지 않게 한다.
 */
export function useNow(serverNowIso: string): number {
  return useSyncExternalStore(subscribe, getSnapshot, () => Date.parse(serverNowIso));
}
