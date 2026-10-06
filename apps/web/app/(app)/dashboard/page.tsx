import type { Metadata } from "next";
import { PageHeader } from "@/components/app-shell/page-header";
import { MAIN_CONTENT_ID } from "@/components/app-shell/skip-link";
import { ActivityPanel } from "@/components/dashboard/activity-panel";
import { AutomationPausedBanner } from "@/components/dashboard/automation-paused-banner";
import { DashboardLiveProvider, PendingRegion } from "@/components/dashboard/dashboard-live";
import { DashboardToolbar } from "@/components/dashboard/dashboard-toolbar";
import { IntegrationPanel } from "@/components/dashboard/integration-panel";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { SyncCaption, SyncControl } from "@/components/dashboard/sync-control";
import { getDashboard } from "@/lib/dashboard/get-dashboard";
import { parseDashboardQuery } from "@/lib/dashboard/query";
import { formatYearMonth } from "@/lib/format";

export const metadata: Metadata = { title: "대시보드" };

export default async function DashboardPage(props: PageProps<"/dashboard">) {
  const query = parseDashboardQuery(await props.searchParams);
  const data = await getDashboard(query);

  return (
    <DashboardLiveProvider renderedAt={data.renderedAt} initialSync={data.sync} initialActivity={data.activity}>
      <PageHeader
        title="대시보드"
        description={
          <>
            <span className="hidden sm:inline">숙소 운영 현황을 한눈에</span>
            <SyncCaption className="sm:hidden" />
          </>
        }
        actions={<SyncControl />}
      />

      <main id={MAIN_CONTENT_ID} className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-8 md:py-8">
        {data.automation.paused && <AutomationPausedBanner />}

        <div className="space-y-5">
          <DashboardToolbar
            query={{ basis: data.basis, unitId: data.unitId }}
            units={data.units}
            monthLabel={formatYearMonth(data.month)}
            source={data.source}
          />

          <PendingRegion>
            <KpiGrid data={data} />
          </PendingRegion>
        </div>

        <div className="grid gap-5 lg:grid-cols-5">
          <ActivityPanel className="lg:col-span-3" />
          <IntegrationPanel
            className="lg:col-span-2"
            integrations={data.integrations}
            automationPaused={data.automation.paused}
          />
        </div>
      </main>
    </DashboardLiveProvider>
  );
}
