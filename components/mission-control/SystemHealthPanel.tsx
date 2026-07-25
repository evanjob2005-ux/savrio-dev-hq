// System health: the freshness of this dashboard's own feed, execution
// throughput, and the state of connected services.
//
// Service entries come from static placeholder data and are labelled as such —
// nothing here is health-checked over the network.

import { Panel, StatusDot } from "@/components/ui/primitives";
import { DataSourceBadge, NotImplementedNote } from "@/components/mission-control/DataSourceBadge";
import { MetaRow, StatusPill } from "@/components/mission-control/primitives";
import { COLORS } from "@/lib/theme";
import { clockFromIso, shortStampFromIso } from "@/lib/format";
import { CONNECTION_STATUS, EXECUTION_STATUS, type StatusToken } from "@/lib/mission-control/status";
import type { FeedStatus } from "@/lib/mission-control/useDevHqState";
import type { ExecutiveSummary } from "@/lib/mission-control/view-model";
import type { ConnectedService, Execution, ExecutionStatus } from "@/types/domain";

const FEED_STATUS: Record<FeedStatus, StatusToken> = {
  initial: { label: "Connecting", color: COLORS.idle },
  live: { label: "Live · polling every 3s", color: COLORS.ok },
  degraded: { label: "Degraded · a poll failed", color: COLORS.warn },
  disconnected: { label: "Disconnected · showing last known state", color: COLORS.err },
};

const EXECUTION_ORDER: ExecutionStatus[] = [
  "running",
  "queued",
  "succeeded",
  "failed",
  "cancelled",
];

export function SystemHealthPanel({
  feedStatus,
  updatedAt,
  executions,
  executive,
  services,
}: {
  feedStatus: FeedStatus;
  updatedAt: string | null;
  executions: Execution[];
  executive: ExecutiveSummary;
  services: ConnectedService[];
}) {
  const byStatus = EXECUTION_ORDER.map((status) => ({
    status,
    token: EXECUTION_STATUS[status],
    count: executions.filter((e) => e.status === status).length,
  }));

  return (
    <Panel
      title="System Health"
      subtitle="Feed, executions, and integrations"
      right={<DataSourceBadge source="derived" />}
    >
      <div className="flex flex-col gap-3">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--text-faint)]">
              State feed
            </h3>
            <DataSourceBadge source="live" />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <StatusPill status={FEED_STATUS[feedStatus]} pulse={feedStatus === "live"} />
            <span className="font-mono text-[10.5px] text-[var(--text-faint)]">
              {updatedAt ? `updated ${clockFromIso(updatedAt)} UTC` : "no snapshot yet"}
            </span>
          </div>
          <dl className="mt-1.5">
            <MetaRow label="Endpoint" value="GET /api/dev-hq/state" />
            <MetaRow
              label="Persistence"
              value="In-memory dev store (non-durable)"
              mono={false}
              wrap
            />
          </dl>
        </div>

        <div className="border-t border-[var(--border)] pt-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--text-faint)]">
              Executions
            </h3>
            <DataSourceBadge source="live" />
          </div>
          <ul className="mt-1.5 flex flex-col gap-1" role="list">
            {byStatus.map(({ status, token, count }) => (
              <li key={status} className="flex items-center gap-2">
                <StatusDot color={count > 0 ? token.color : "var(--idle)"} size={6} />
                <span className="text-[11.5px] text-[var(--text-dim)]">{token.label}</span>
                <span className="ml-auto font-mono text-[11px] tabular-nums text-[var(--text)]">
                  {count}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-[var(--border)] pt-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--text-faint)]">
              Trigger.dev orchestration
            </h3>
            <DataSourceBadge source="derived" />
          </div>
          <dl className="mt-1.5">
            <MetaRow
              label="Runs dispatched"
              value={`${executive.dispatchedRuns} of ${executive.runsTotal}`}
            />
            <MetaRow
              label="Last run update"
              value={
                executive.lastActivityAt
                  ? `${shortStampFromIso(executive.lastActivityAt)} UTC`
                  : "—"
              }
            />
          </dl>
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-[var(--text-faint)]">
            A recorded run id confirms the Trigger.dev client accepted the dispatch. Worker
            liveness is not polled by this dashboard.
          </p>
        </div>

        <div className="border-t border-[var(--border)] pt-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--text-faint)]">
              Connected services
            </h3>
            <DataSourceBadge source="preview" />
          </div>
          <ul className="mt-1.5 flex flex-col gap-1.5" role="list">
            {services.map((service) => {
              const token = CONNECTION_STATUS[service.status];
              return (
                <li
                  key={service.id}
                  className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5"
                >
                  <StatusDot color={token.color} size={6} />
                  <span className="text-[11.5px] font-medium text-[var(--text)]">
                    {service.name}
                  </span>
                  <span className="truncate font-mono text-[10px] text-[var(--text-faint)]">
                    {service.endpoint ?? "not configured"}
                  </span>
                  <span
                    className="ml-auto shrink-0 text-[10.5px] font-medium"
                    style={{ color: token.color }}
                  >
                    {token.label}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-2">
            <NotImplementedNote>
              These entries are static placeholders declaring intended integrations. No
              connection is tested and no last-sync time is measured, so they must not be read
              as live service health.
            </NotImplementedNote>
          </div>
        </div>
      </div>
    </Panel>
  );
}
