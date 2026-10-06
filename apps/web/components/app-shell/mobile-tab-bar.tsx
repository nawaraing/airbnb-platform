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
          const base = "relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium";

          return (
            <li key={item.href}>
              {item.ready ? (
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    base,
                    "transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset",
                    active
                      ? "font-semibold text-primary before:absolute before:top-0 before:left-1/2 before:h-0.5 before:w-8 before:-translate-x-1/2 before:rounded-b-full before:bg-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {content}
                </Link>
              ) : (
                <span aria-disabled="true" title="준비 중" className={cn(base, "text-muted-foreground/45")}>
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
