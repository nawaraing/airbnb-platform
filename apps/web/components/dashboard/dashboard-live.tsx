"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { dashboardSearch, type DashboardQuery } from "@/lib/dashboard/query";
import type { ActivityEntry, DashboardSync } from "@/lib/dashboard/types";
import { runMockSync } from "@/lib/mock/sync-simulation";
import { useNow } from "@/lib/use-now";

const MAX_ACTIVITY = 200;

interface DashboardLive {
  activity: ActivityEntry[];
  sync: DashboardSync;
  syncing: boolean;
  startSync: () => void;
  /** 숙소·기준 전환 중 */
  navigating: boolean;
  navigate: (query: DashboardQuery) => void;
  nowMs: number;
}

const DashboardLiveContext = createContext<DashboardLive | null>(null);

export function useDashboardLive(): DashboardLive {
  const value = useContext(DashboardLiveContext);
  if (!value) throw new Error("useDashboardLive는 DashboardLiveProvider 안에서만 쓸 수 있습니다");
  return value;
}

export function DashboardLiveProvider({
  renderedAt,
  initialSync,
  initialActivity,
  children,
}: {
  renderedAt: string;
  initialSync: DashboardSync;
  initialActivity: ActivityEntry[];
  children: ReactNode;
}) {
  const router = useRouter();
  const tickNow = useNow(renderedAt);
  const [activity, setActivity] = useState(initialActivity);
  const [sync, setSync] = useState(initialSync);
  const [syncing, setSyncing] = useState(false);
  const [navigating, startNavigation] = useTransition();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const append = useCallback((entry: ActivityEntry) => {
    setActivity((prev) => [...prev, entry].slice(-MAX_ACTIVITY));
  }, []);

  const startSync = useCallback(() => {
    if (abortRef.current) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setSyncing(true);

    runMockSync(sync.perUnit, append, controller.signal)
      .then(() => {
        setSync((prev) => ({ ...prev, lastSyncedAt: new Date().toISOString() }));
        router.refresh();
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        append({
          id: `sync-error-${Date.now()}`,
          at: new Date().toISOString(),
          level: "error",
          message: "동기화 실패 — 잠시 후 다시 시도해 주세요",
        });
      })
      .finally(() => {
        abortRef.current = null;
        setSyncing(false);
      });
  }, [append, router, sync.perUnit]);

  const navigate = useCallback(
    (query: DashboardQuery) => {
      startNavigation(() => router.replace(`/dashboard${dashboardSearch(query)}`, { scroll: false }));
    },
    [router],
  );

  // 방금 끝난 동기화가 '방금'으로 보이도록 30초 단위 시계보다 늦으면 마지막 동기화 시각을 쓴다
  const nowMs = Math.max(tickNow, Date.parse(sync.lastSyncedAt));

  const value = useMemo<DashboardLive>(
    () => ({ activity, sync, syncing, startSync, navigating, navigate, nowMs }),
    [activity, sync, syncing, startSync, navigating, navigate, nowMs],
  );

  return <DashboardLiveContext.Provider value={value}>{children}</DashboardLiveContext.Provider>;
}

/** 숙소·기준을 바꾸는 동안 이전 지표를 흐리게 보여준다 */
export function PendingRegion({ children }: { children: ReactNode }) {
  const { navigating } = useDashboardLive();
  return (
    <div aria-busy={navigating} className="space-y-4 transition-opacity data-[busy=true]:opacity-50" data-busy={navigating}>
      {children}
    </div>
  );
}
