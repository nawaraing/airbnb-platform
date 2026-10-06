import type { ReactNode } from "react";
import { MobileTabBar } from "@/components/app-shell/mobile-tab-bar";
import { Sidebar } from "@/components/app-shell/sidebar";
import { SkipLink } from "@/components/app-shell/skip-link";
import { requireViewer } from "@/lib/auth/dal";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const viewer = await requireViewer();

  return (
    <div className="min-h-dvh">
      <SkipLink />
      <Sidebar username={viewer.username} />
      <div className="pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 md:pl-60">{children}</div>
      <MobileTabBar />
    </div>
  );
}
