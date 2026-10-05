import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground",
        className,
      )}
    >
      H
    </span>
  );
}
