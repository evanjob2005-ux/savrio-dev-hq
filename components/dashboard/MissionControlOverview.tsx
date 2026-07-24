import { MISSION_CONTROL_PLACEHOLDERS } from "@/data/placeholders/mission-control";
import { SystemOverviewPanel } from "@/components/dashboard/SystemOverviewPanel";
import { ProjectsPanel } from "@/components/dashboard/ProjectsPanel";
import { ActiveTasksPanel } from "@/components/dashboard/ActiveTasksPanel";
import { FounderApprovalQueuePanel } from "@/components/dashboard/FounderApprovalQueuePanel";
import { RecentActivityPanel } from "@/components/dashboard/RecentActivityPanel";
import { AgentStatusOverviewPanel } from "@/components/dashboard/AgentStatusOverviewPanel";
import { ConnectedServicesPanel } from "@/components/dashboard/ConnectedServicesPanel";

/** Sprint 1A overview sections. Placeholder data only — no live integrations. */
export function MissionControlOverview() {
  const data = MISSION_CONTROL_PLACEHOLDERS;

  return (
    <section aria-label="Mission Control overview" className="flex flex-col gap-4">
      <SystemOverviewPanel metrics={data.overview} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ProjectsPanel projects={data.projects} />
        <ActiveTasksPanel tasks={data.activeTasks} />
        <FounderApprovalQueuePanel approvals={data.approvalQueue} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <RecentActivityPanel events={data.recentActivity} />
        <AgentStatusOverviewPanel agents={data.agents} />
        <ConnectedServicesPanel services={data.connectedServices} />
      </div>
    </section>
  );
}
