import { PauseCircle } from "lucide-react";

/** 킬 스위치가 켜져 있을 때 (docs/02-features.md §1 공통 레이아웃) */
export function AutomationPausedBanner() {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-lg border border-l-4 border-warning/30 border-l-warning bg-warning-soft px-5 py-4"
    >
      <PauseCircle className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
      <div>
        <p className="font-semibold">자동화 일시정지 중</p>
        <p className="text-sm text-warning">요금 변경과 메시지 발송이 모두 멈춰 있습니다. 설정에서 다시 켤 수 있어요.</p>
      </div>
    </div>
  );
}
