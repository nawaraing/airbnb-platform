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
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-19 items-center gap-3 px-5">
        <BrandMark />
        <span translate="no" className="truncate text-[15px] font-semibold tracking-tight">
          {APP_NAME}
        </span>
      </div>

      <nav aria-label="주 메뉴" className="flex-1 px-3 py-3">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            if (!item.ready) {
              return (
                <li key={item.href}>
                  <span
                    aria-disabled="true"
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] text-sidebar-muted-foreground"
                  >
                    <Icon className="size-4.5" aria-hidden />
                    {item.label}
                    <span className="ml-auto rounded-sm border border-sidebar-border px-1.5 py-px text-[11px] font-medium">
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
                    "relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground before:absolute before:inset-y-2 before:left-0 before:w-0.75 before:rounded-r-full before:bg-sidebar-primary"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  )}
                >
                  <Icon className={cn("size-4.5", active && "text-sidebar-primary")} aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <span
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground"
          >
            {username.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p translate="no" className="truncate text-sm font-semibold">
              {username}
            </p>
            <p className="text-xs text-sidebar-muted-foreground">관리자</p>
          </div>
          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              aria-label="로그아웃"
              title="로그아웃"
              className="text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            >
              <LogOut aria-hidden />
            </Button>
          </form>
        </div>
      </div>
    </aside>
  );
}
