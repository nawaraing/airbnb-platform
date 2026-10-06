import { cn } from "@/lib/utils";

/** 수평선 위로 떠오르는 해. 놋쇠 바탕이라 어두운 사이드바와 밝은 바탕 어디서나 보인다 (app/icon.svg와 같은 모양) */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8 shrink-0", className)}>
      <rect width="32" height="32" rx="7" className="fill-brass" />
      <g strokeWidth="2.25" strokeLinecap="round" className="stroke-brass-foreground">
        <path d="M16 8v2.5M9 11l1.8 1.8M23 11l-1.8 1.8M7 23.5h18" />
      </g>
      <path d="M10.5 20.5a5.5 5.5 0 0 1 11 0z" className="fill-brass-foreground" />
    </svg>
  );
}
