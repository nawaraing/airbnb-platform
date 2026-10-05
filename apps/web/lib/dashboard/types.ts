import type { DashboardKpis, ISODate, RevenueBasis, YearMonth } from "@repo/core";

/** mock: 백엔드 연동 전 샘플 데이터 / live: 실제 동기화 데이터 */
export type DataSource = "mock" | "live";

export interface UnitOption {
  id: string;
  nickname: string;
}

export type ActivityLevel = "info" | "success" | "warn" | "error";

export interface ActivityEntry {
  id: string;
  /** ISO 시각 */
  at: string;
  level: ActivityLevel;
  message: string;
}

/** docs/04-airbnb-integration.md §6.2 */
export type ConnectionStatus =
  | "not_connected"
  | "login_pending"
  | "active"
  | "expired"
  | "challenge"
  | "error";

/** 당일 인하의 오늘 상태 (docs/05-pricing-engine.md §5.2) */
export type LastminuteState =
  | { kind: "scheduled"; startTime: string; startPrice: number }
  | { kind: "running"; startPrice: number; currentPrice: number; floorPrice: number; nextTickTime: string }
  | { kind: "stopped_floor"; startPrice: number; floorPrice: number }
  | { kind: "stopped_booked"; soldPrice: number }
  | { kind: "ended"; startPrice: number; finalPrice: number }
  | { kind: "not_vacant" };

export interface LastminuteSummary {
  unitId: string;
  unitNickname: string;
  state: LastminuteState;
}

export interface DashboardSync {
  /** ISO 시각 */
  lastSyncedAt: string;
  reservationCount: number;
  perUnit: { nickname: string; reservationCount: number }[];
}

export interface DashboardData {
  source: DataSource;
  /** 서버 렌더 시각(ISO). 상대 시간 표시의 초기값으로 써서 하이드레이션 불일치를 막는다 */
  renderedAt: string;
  today: ISODate;
  month: YearMonth;
  basis: RevenueBasis;
  /** null = 전체 숙소 */
  unitId: string | null;
  units: UnitOption[];
  kpis: DashboardKpis;
  replies: {
    unanswered: number;
    awaitingApproval: number;
  };
  automation: {
    paused: boolean;
    lastminute: LastminuteSummary[];
    priceChangesToday: number;
    messagesSentToday: number;
  };
  sync: DashboardSync;
  integrations: {
    account: { name: string; plan: string };
    airbnb: { status: ConnectionStatus };
    alimtalk: { configured: boolean };
  };
  activity: ActivityEntry[];
}
