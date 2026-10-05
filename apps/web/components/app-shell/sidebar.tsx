"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth/actions";
import { APP_NAME } from "@/lib/config";
import { cn } from "@/lib/utils";
import { BrandMark } from "./brand-mark";
import { NAV_ITEMS } from "./nav-items";

export function Sidebar({ username }: { username: string }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r bg-sidebar md:flex">
      <div className="flex h-19 items-center gap-2.5 px-6">
        <BrandMark />
        <span className="text-[15px] font-semibold tracking-tight">{APP_NAME}</span>
      </div>

      <nav aria-label="주 메뉴" className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            if (!item.ready) {
              return (
                <li key={item.href}>
                  <span
                    aria-disabled="true"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-muted-foreground/70"
                  >
                    <Icon className="size-[18px]" aria-hidden />
                    {item.label}
                    <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      준비 중
                    </span>
                  </span>
                </li>
              );
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="size-[18px]" aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t p-3">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2">
          <span
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground"
          >
            {username.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{username}</p>
            <p className="text-xs text-muted-foreground">관리자</p>
          </div>
          <form action={logout}>
            <Button type="submit" variant="ghost" size="icon-sm" aria-label="로그아웃" title="로그아웃">
              <LogOut aria-hidden />
            </Button>
          </form>
        </div>
      </div>
    </aside>
  );
}
