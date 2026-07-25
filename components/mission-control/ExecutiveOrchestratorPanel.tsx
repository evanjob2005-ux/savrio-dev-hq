// Executive Orchestrator status: what it is currently doing across every
// project, derived from real workflow runs and executions.

import { Panel, Avatar } from "@/components/ui/primitives";
import { DataSourceBadge } from "@/components/mission-control/DataSourceBadge";
import { MetricStat, StatusPill } from "@/components/mission-control/primitives";
import { COLORS } from "@/lib/theme";
import { shortStampFromIso } from "@/lib/format";
import { actorAccent } from "@/lib/mission-control/status";
import type { ExecutiveSummary } from "@/lib/mission-control/view-model";

export function ExecutiveOrchestratorPanel({
  executive,
}: {
  executive: ExecutiveSummary;
}) {
  const accent = actorAccent("Executive Orchestrator");

  return (
    <Panel
      title="Executive Orchestrator"
      subtitle="Reviews every founder request and opens the approval gate"
      right={<DataSourceBadge source="derived" />}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <Avatar
            initials="EO"
            accent={accent}
            size={36}
            active={executive.inReview > 0 || executive.awaitingFounder > 0}
          />
          <div className="min-w-0 flex-1">
            <StatusPill status={executive.status} pulse={executive.inReview > 0} />
            <p className="mt-1.5 font-mono text-[10.5px] text-[var(--text-faint)]">
              agent-executive-orchestrator
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-faint)]">
              {executive.lastActivityAt
                ? `Last run update ${shortStampFromIso(executive.lastActivityAt)} UTC`
                : "No workflow activity recorded yet."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MetricStat
            label="In review"
            value={executive.inReview}
            color={COLORS.run}
            hint="Being validated"
          />
          <MetricStat
            label="At gate"
            value={executive.awaitingFounder}
            color={COLORS.wait}
            hint="Awaiting you"
            emphasis={executive.awaitingFounder > 0}
          />
          <MetricStat
            label="Decided"
            value={executive.decided}
            color={COLORS.ok}
            hint="Runs settled"
          />
          <MetricStat
            label="Failed"
            value={executive.failed}
            color={COLORS.err}
            hint="Technical errors"
            emphasis={executive.failed > 0}
          />
        </div>

        <dl className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-[11px] text-[var(--text-faint)]">Executions running</dt>
            <dd className="font-mono text-[11px] text-[var(--text-dim)]">
              {executive.runningExecutions}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-[11px] text-[var(--text-faint)]">Executions queued</dt>
            <dd className="font-mono text-[11px] text-[var(--text-dim)]">
              {executive.queuedExecutions}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-[11px] text-[var(--text-faint)]">Dispatched to Trigger.dev</dt>
            <dd className="font-mono text-[11px] text-[var(--text-dim)]">
              {executive.dispatchedRuns} / {executive.runsTotal}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-[11px] text-[var(--text-faint)]">Total runs</dt>
            <dd className="font-mono text-[11px] text-[var(--text-dim)]">
              {executive.runsTotal}
            </dd>
          </div>
        </dl>

        {executive.latestReviewSummary ? (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)]">
              Most recent review finding
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--text-dim)]">
              {executive.latestReviewSummary}
            </p>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
