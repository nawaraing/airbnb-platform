import type { RevenueBasis } from "@repo/core";

export interface DashboardQuery {
  basis: RevenueBasis;
  /** null = 전체 숙소 */
  unitId: string | null;
}

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export function parseDashboardQuery(params: SearchParams): DashboardQuery {
  return {
    basis: first(params.basis) === "stay" ? "stay" : "payout",
    unitId: first(params.unit) || null,
  };
}

/** 기본값(정산일 기준, 전체 숙소)은 URL에서 뺀다 */
export function dashboardSearch(query: DashboardQuery): string {
  const params = new URLSearchParams();
  if (query.unitId) params.set("unit", query.unitId);
  if (query.basis !== "payout") params.set("basis", query.basis);
  const search = params.toString();
  return search ? `?${search}` : "";
}
