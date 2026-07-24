import type { SystemOverviewMetrics } from "@/data/placeholders/mission-control";
import { Panel } from "@/components/ui/primitives";
import { COLORS } from "@/lib/theme";

function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)]">
        {label}
      </p>
      <p
        className="mt-1 text-[22px] font-semibold tabular-nums tracking-tight"
        style={{ color }}
      >
        {value}
      </p>
    </div>
  );
}

export function SystemOverviewPanel({
  metrics,
}: {
  metrics: SystemOverviewMetrics;
}) {
  return (
    <Panel title="System Overview" subtitle="Placeholder metrics · Sprint 1A">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <MetricCard label="Active Projects" value={metrics.activeProjects} color={COLORS.accent} />
        <MetricCard label="Active Tasks" value={metrics.activeTasks} color={COLORS.run} />
        <MetricCard
          label="Pending Approvals"
          value={metrics.pendingApprovals}
          color={COLORS.wait}
        />
        <MetricCard
          label="Connected Services"
          value={metrics.connectedServices}
          color={COLORS.ok}
        />
        <MetricCard
          label="Running Executions"
          value={metrics.runningExecutions}
          color={COLORS.run}
        />
      </div>
    </Panel>
  );
}
