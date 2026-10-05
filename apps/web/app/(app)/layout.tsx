import type { ReactNode } from "react";
import { MobileTabBar } from "@/components/app-shell/mobile-tab-bar";
import { Sidebar } from "@/components/app-shell/sidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <Sidebar />
      <div className="pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 md:pl-60">{children}</div>
      <MobileTabBar />
    </div>
  );
}
