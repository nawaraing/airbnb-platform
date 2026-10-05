import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { formatNumber, formatPercentPointDelta, formatSignedKRW } from "@/lib/format";
import { cn } from "@/lib/utils";

const TONES = {
  indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  sky: "bg-sky-50 text-sky-600 ring-sky-100",
  violet: "bg-violet-50 text-violet-600 ring-violet-100",
  teal: "bg-teal-50 text-teal-600 ring-teal-100",
  rose: "bg-rose-50 text-rose-600 ring-rose-100",
  orange: "bg-orange-50 text-orange-600 ring-orange-100",
} as const;

export type Tone = keyof typeof TONES;

export function IconTile({ icon: Icon, tone }: { icon: LucideIcon; tone: Tone }) {
  return (
    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset", TONES[tone])}>
      <Icon className="size-[18px]" aria-hidden />
    </span>
  );
}

export function KpiCard({
  icon,
  tone,
  label,
  children,
  footer,
  className,
}: {
  icon: LucideIcon;
  tone: Tone;
  label: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <article className={cn("flex flex-col rounded-2xl border bg-card p-5 shadow-xs sm:p-6", className)}>
      <header className="flex items-center gap-2.5">
        <IconTile icon={icon} tone={tone} />
        <h3 className="text-[15px] font-medium text-muted-foreground">{label}</h3>
      </header>
      <div className="mt-4">{children}</div>
      {footer && <div className="mt-auto space-y-0.5 pt-2 text-sm text-muted-foreground">{footer}</div>}
    </article>
  );
}

const VALUE_SIZE = { lg: "text-[32px] leading-10", md: "text-2xl leading-8" } as const;

/** 큰 금액: 작은 ₩ + 굵은 숫자 */
export function Amount({ value, size = "lg" }: { value: number; size?: keyof typeof VALUE_SIZE }) {
  return (
    <p className={cn("flex items-baseline font-bold tracking-tight tabular-nums", VALUE_SIZE[size])}>
      {value < 0 && <span>−</span>}
      <span className="mr-0.5 text-[0.62em] font-semibold text-muted-foreground">₩</span>
      {formatNumber(Math.abs(value))}
    </p>
  );
}

/** 큰 숫자 + 단위 */
export function Figure({ children, unit, size = "lg" }: { children: ReactNode; unit?: string; size?: keyof typeof VALUE_SIZE }) {
  return (
    <p className={cn("flex items-baseline gap-1 font-bold tracking-tight tabular-nums", VALUE_SIZE[size])}>
      {children}
      {unit && <span className="text-base font-semibold text-muted-foreground">{unit}</span>}
    </p>
  );
}

/** 전월 대비 증감. 값이 오르면 초록, 내리면 빨강 */
export function Delta({ diff, kind }: { diff: number | null; kind: "percentPoint" | "krw" }) {
  if (diff === null) return <span>전월 데이터 없음</span>;
  const flat = kind === "percentPoint" ? Math.abs(diff) < 0.0005 : diff === 0;
  const text = kind === "percentPoint" ? formatPercentPointDelta(diff) : formatSignedKRW(diff);
  return (
    <span>
      전월 대비{" "}
      <span
        className={cn(
          "font-semibold tabular-nums",
          flat ? "text-muted-foreground" : diff > 0 ? "text-emerald-600" : "text-rose-600",
        )}
      >
        {flat ? "" : diff > 0 ? "▲ " : "▼ "}
        {text}
      </span>
    </span>
  );
}
