"use client";

import { ListChecks } from "lucide-react";
import type { ConnectionStatus, DashboardData } from "@/lib/dashboard/types";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDashboardLive } from "./dashboard-live";
import { IconTile } from "./kpi-card";

type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

const PILL: Record<StatusTone, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  danger: "bg-rose-50 text-rose-700 ring-rose-200",
  info: "bg-accent text-accent-foreground ring-primary/15",
  neutral: "bg-muted text-muted-foreground ring-border",
};

const AIRBNB_STATUS: Record<ConnectionStatus, { label: string; tone: StatusTone }> = {
  active: { label: "정상", tone: "success" },
  expired: { label: "재로그인 필요", tone: "warning" },
  challenge: { label: "보안 확인 필요", tone: "warning" },
  error: { label: "오류", tone: "danger" },
  login_pending: { label: "로그인 중", tone: "info" },
  not_connected: { label: "미연결", tone: "neutral" },
};

function StatusRow({ title, description, status, tone }: { title: string; description: string; status: string; tone: StatusTone }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border bg-muted/40 px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-[15px] font-semibold">{title}</p>
        <p className="truncate text-sm text-muted-foreground">{description}</p>
      </div>
      <span className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset", PILL[tone])}>{status}</span>
    </li>
  );
}

export function IntegrationPanel({
  integrations,
  automationPaused,
  className,
}: {
  integrations: DashboardData["integrations"];
  automationPaused: boolean;
  className?: string;
}) {
  const { sync, nowMs } = useDashboardLive();
  const airbnb = AIRBNB_STATUS[integrations.airbnb.status];

  return (
    <section aria-labelledby="integration-title" className={cn("rounded-2xl border bg-card p-5 shadow-xs sm:p-6", className)}>
      <div className="flex items-center gap-2.5">
        <IconTile icon={ListChecks} tone="indigo" />
        <h2 id="integration-title" className="text-lg font-semibold">
          연동 상태
        </h2>
      </div>
      <ul className="mt-4 space-y-2.5">
        <StatusRow
          title="계정"
          description={`${integrations.account.name}님 · ${integrations.account.plan} 플랜`}
          status="인증됨"
          tone="success"
        />
        <StatusRow
          title="에어비앤비 연결"
          description={`세션 저장됨 · 마지막 확인 ${formatRelative(sync.lastSyncedAt, nowMs)}`}
          status={airbnb.label}
          tone={airbnb.tone}
        />
        <StatusRow
          title="카카오 알림톡"
          description={integrations.alimtalk.configured ? "청소·호스트 알림 발송 가능" : "청소 일정 자동 발송에 필요해요"}
          status={integrations.alimtalk.configured ? "사용 중" : "설정 필요"}
          tone={integrations.alimtalk.configured ? "success" : "warning"}
        />
        <StatusRow
          title="자동화"
          description={automationPaused ? "요금 변경·메시지 발송이 멈춰 있어요" : "요금 변경·메시지 발송이 켜져 있어요"}
          status={automationPaused ? "일시정지" : "실행 중"}
          tone={automationPaused ? "danger" : "success"}
        />
      </ul>
    </section>
  );
}
