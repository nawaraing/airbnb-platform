import { LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth/actions";
import { BrandMark } from "./brand-mark";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-md supports-backdrop-filter:bg-background/75">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 md:h-19 md:px-8 md:py-0">
        <div className="flex min-w-0 items-center gap-3">
          {/* 모바일은 사이드바가 없으니 여기서 브랜드를 보여준다 */}
          <BrandMark className="size-9 md:hidden" />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight md:text-[26px] md:leading-9">{title}</h1>
            {description && <div className="truncate text-[13px] text-muted-foreground md:text-sm">{description}</div>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {actions}
          {/* 데스크톱은 사이드바 하단에 로그아웃이 있다 */}
          <form action={logout} className="md:hidden">
            <Button type="submit" variant="ghost" size="icon-lg" aria-label="로그아웃" className="-mr-2 text-muted-foreground">
              <LogOut className="size-5" aria-hidden />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
