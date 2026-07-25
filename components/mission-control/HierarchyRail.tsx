// The command chain, top to bottom: Founder → Executive Orchestrator → Project
// Orchestrators → Shared Work Management Layer → Assigned Agents and Queues.
//
// Each tier reports a live count and a readable status. Tiers the backend does
// not model yet are labelled rather than filled with invented values.

import { Panel } from "@/components/ui/primitives";
import { DataSourceBadge } from "@/components/mission-control/DataSourceBadge";
import { StatusPill } from "@/components/mission-control/primitives";
import { COLORS } from "@/lib/theme";
import type { DataSource, StatusToken } from "@/lib/mission-control/status";
import type { CommandCenterModel } from "@/lib/mission-control/view-model";

interface Tier {
  key: string;
  tierLabel: string;
  name: string;
  status: StatusToken;
  metric: string;
  detail: string;
  source: DataSource;
  pulse?: boolean;
}

function buildTiers(model: CommandCenterModel): Tier[] {
  const { executive, counts, projects, attentionCount } = model;

  const assignedAgents = new Set(
    projects.flatMap((project) => project.assignedAgentIds),
  );
  const projectsNeedingAttention = projects.filter((p) => p.needsAttention).length;

  return [
    {
      key: "founder",
      tierLabel: "Tier 1 · Authority",
      name: "Evan · Founder",
      status:
        counts.pendingApprovals > 0
          ? { label: "Decision required", color: COLORS.wait }
          : { label: "No open decisions", color: COLORS.ok },
      metric: `${counts.pendingApprovals} pending`,
      detail:
        counts.pendingApprovals > 0
          ? "Workflow runs are paused until you decide."
          : "Nothing is waiting on you.",
      source: "live",
      pulse: counts.pendingApprovals > 0,
    },
    {
      key: "executive",
      tierLabel: "Tier 2 · Orchestration",
      name: "Executive Orchestrator",
      status: executive.status,
      metric: `${executive.runsTotal} run${executive.runsTotal === 1 ? "" : "s"}`,
      detail: `${executive.inReview} in review · ${executive.awaitingFounder} at approval gate · ${executive.failed} failed`,
      source: "derived",
      pulse: executive.inReview > 0,
    },
    {
      key: "project-orchestrators",
      tierLabel: "Tier 3 · Per project",
      name: "Project Orchestrators",
      status: { label: "Not yet assigned", color: COLORS.idle },
      metric: `${counts.projects} project${counts.projects === 1 ? "" : "s"}`,
      detail:
        "No dedicated project-orchestrator role exists in the backend yet. The Executive Orchestrator drives every project directly.",
      source: "unavailable",
    },
    {
      key: "work-layer",
      tierLabel: "Tier 4 · Shared layer",
      name: "Work Management Layer",
      status:
        attentionCount > 0
          ? { label: `${attentionCount} needing attention`, color: COLORS.warn }
          : { label: "All work settled", color: COLORS.ok },
      metric: `${counts.tasks} task${counts.tasks === 1 ? "" : "s"}`,
      detail: `${projectsNeedingAttention} of ${counts.projects} project${
        counts.projects === 1 ? "" : "s"
      } flagged · ${counts.executions} execution${counts.executions === 1 ? "" : "s"}`,
      source: "derived",
    },
    {
      key: "agents",
      tierLabel: "Tier 5 · Execution",
      name: "Assigned Agents & Queues",
      status:
        assignedAgents.size > 0
          ? { label: `${assignedAgents.size} assigned`, color: COLORS.run }
          : { label: "No agent claims recorded", color: COLORS.idle },
      metric: `${assignedAgents.size} agent${assignedAgents.size === 1 ? "" : "s"}`,
      detail:
        assignedAgents.size > 0
          ? "Agent ids recorded on tasks or executions."
          : "The founder-request workflow never claims a task for an agent, so no assignments exist to show.",
      source: assignedAgents.size > 0 ? "live" : "unavailable",
    },
  ];
}

export function HierarchyRail({ model }: { model: CommandCenterModel }) {
  const tiers = buildTiers(model);

  return (
    <Panel
      title="Command Chain"
      subtitle="Authority and ownership from founder down to execution"
      right={<DataSourceBadge source="derived" />}
    >
      <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5" role="list">
        {tiers.map((tier, index) => (
          <li key={tier.key} className="relative">
            <div
              className="flex h-full flex-col gap-2 rounded-lg border bg-[var(--surface-2)] px-3 py-2.5"
              style={{
                borderColor:
                  tier.source === "unavailable"
                    ? "var(--border)"
                    : `${tier.status.color}3d`,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-medium uppercase tracking-[0.07em] text-[var(--text-faint)]">
                  {tier.tierLabel}
                </span>
                <DataSourceBadge source={tier.source} />
              </div>
              <div>
                <p className="text-[13px] font-semibold leading-tight text-[var(--text)]">
                  {tier.name}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-[var(--text-dim)]">
                  {tier.metric}
                </p>
              </div>
              <StatusPill status={tier.status} pulse={tier.pulse} className="self-start" />
              <p className="text-[10.5px] leading-relaxed text-[var(--text-faint)]">
                {tier.detail}
              </p>
            </div>
            {index < tiers.length - 1 ? (
              <span
                className="pointer-events-none absolute -right-1.5 top-1/2 hidden -translate-y-1/2 text-[var(--border-strong)] xl:block"
                aria-hidden
              >
                ›
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </Panel>
  );
}
