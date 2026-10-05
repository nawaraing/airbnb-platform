"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="주 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.filter((item) => item.mobile).map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const content = (
            <>
              <Icon className="size-5" aria-hidden />
              <span>{item.shortLabel}</span>
            </>
          );
          const base = "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium";

          return (
            <li key={item.href}>
              {item.ready ? (
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(base, active ? "text-primary" : "text-muted-foreground")}
                >
                  {content}
                </Link>
              ) : (
                <span aria-disabled="true" title="준비 중" className={cn(base, "text-muted-foreground/40")}>
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
