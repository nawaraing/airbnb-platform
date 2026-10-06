import type { ReactNode } from "react";
import { formatNumber, formatPercentPointDelta, formatSignedKRW } from "@/lib/format";
import { cn } from "@/lib/utils";

/** 지표 묶음. 칸 사이를 1px 선으로 나눈 장부형 격자 */
export function KpiSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <h3 id={id} className="mb-2.5 text-[13px] font-semibold tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 xl:grid-cols-4">{children}</div>
    </section>
  );
}

export function KpiCard({
  label,
  children,
  footer,
  className,
}: {
  label: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <article className={cn("@container flex min-w-0 flex-col bg-card p-5 sm:p-6", className)}>
      <h4 className="text-sm font-medium text-muted-foreground">{label}</h4>
      <div className="mt-2.5">{children}</div>
      {footer && <div className="mt-auto space-y-0.5 pt-4 text-[13px] leading-5 text-muted-foreground">{footer}</div>}
    </article>
  );
}

// 칸이 좁으면(1280px 4열 등) 8자리 금액이 넘치지 않도록 칸 너비 기준으로 글자 크기를 줄인다
const VALUE_SIZE = {
  lg: "text-[28px] leading-9 @min-[13rem]:text-[34px] @min-[13rem]:leading-10",
  md: "text-2xl leading-8 @min-[13rem]:text-[26px]",
} as const;

/** 큰 금액: 작은 ₩ + 숫자 */
export function Amount({ value, size = "lg" }: { value: number; size?: keyof typeof VALUE_SIZE }) {
  return (
    <p className={cn("flex items-baseline font-semibold tracking-tight tabular-nums", VALUE_SIZE[size])}>
      {value < 0 && <span>−</span>}
      <span className="mr-0.5 text-[0.55em] font-medium text-muted-foreground">₩</span>
      {formatNumber(Math.abs(value))}
    </p>
  );
}

/** 큰 숫자 + 단위 */
export function Figure({ children, unit, size = "lg" }: { children: ReactNode; unit?: string; size?: keyof typeof VALUE_SIZE }) {
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-1 font-semibold tracking-tight tabular-nums", VALUE_SIZE[size])}>
      {children}
      {unit && <span className="text-base font-medium text-muted-foreground">{unit}</span>}
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
          "font-semibold whitespace-nowrap tabular-nums",
          flat ? "text-muted-foreground" : diff > 0 ? "text-success" : "text-danger",
        )}
      >
        {!flat && <span aria-hidden>{diff > 0 ? "↑ " : "↓ "}</span>}
        {text}
      </span>
    </span>
  );
}
