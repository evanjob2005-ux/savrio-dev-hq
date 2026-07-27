// Founder decision gates. Each item is a real pending approval whose workflow
// is waiting on a decision.
//
// An approval can only be actioned once its run has opened the gate, so that
// precondition is shown rather than letting the founder press a button that
// would fail. The gate is a run stage, not a wait token: the run that opened it
// has already ended, and a decision starts a new one.

import { Panel, Badge } from "@/components/ui/primitives";
import { DataSourceBadge } from "@/components/mission-control/DataSourceBadge";
import { EmptyState, MetaRow } from "@/components/mission-control/primitives";
import { COLORS } from "@/lib/theme";
import { shortStampFromIso } from "@/lib/format";
import { WORKFLOW_STAGE, actorName } from "@/lib/mission-control/status";
import type { ApprovalItem } from "@/lib/mission-control/view-model";

export function ApprovalQueuePanel({
  approvals,
  onApprove,
  onReject,
  busyApprovalId,
}: {
  approvals: ApprovalItem[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  busyApprovalId: string | null;
}) {
  return (
    <Panel
      title="Founder Approval Gates"
      subtitle={
        approvals.length === 0
          ? "Nothing is waiting on you"
          : `${approvals.length} run${approvals.length === 1 ? "" : "s"} blocked pending your decision`
      }
      right={<DataSourceBadge source="live" />}
      bodyClassName="p-0"
      className={approvals.length > 0 ? "ring-1 ring-[var(--accent)]/25" : ""}
    >
      {approvals.length === 0 ? (
        <EmptyState
          title="No pending approvals"
          detail="When the Executive Orchestrator passes a request through validation it opens a gate here and ends its run. Your decision starts the run that carries the request forward."
        />
      ) : (
        <ul className="divide-y divide-[var(--border)]" role="list">
          {approvals.map(({ approval, task, project, run, actionable }) => {
            const busy = busyApprovalId === approval.id;
            return (
              <li
                key={approval.id}
                className="px-4 py-3"
                style={{ background: `${COLORS.wait}0a` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="min-w-0 text-[12.5px] font-semibold leading-snug text-[var(--text)]">
                    {approval.title}
                  </h3>
                  <Badge color={COLORS.wait}>Awaiting founder</Badge>
                </div>

                <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--text-dim)]">
                  {approval.summary}
                </p>

                <dl className="mt-2">
                  <MetaRow label="Project" value={project?.name ?? "Unknown"} mono={false} />
                  <MetaRow label="Task" value={task?.title ?? approval.taskId} mono={false} />
                  <MetaRow
                    label="Requested by"
                    value={actorName(approval.requestedByAgentId)}
                    mono={false}
                  />
                  <MetaRow
                    label="Run stage"
                    value={run ? WORKFLOW_STAGE[run.stage].label : "Unknown"}
                    mono={false}
                  />
                  <MetaRow
                    label="Requested"
                    value={`${shortStampFromIso(approval.requestedAt)} UTC`}
                  />
                  <MetaRow label="Approval id" value={approval.id} />
                </dl>

                {actionable ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      aria-busy={busy}
                      onClick={() => onApprove(approval.id)}
                      className="rounded-md px-3 py-1.5 text-[12px] font-semibold text-[var(--bg)] outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-1)] disabled:opacity-60"
                      style={{ background: COLORS.ok }}
                    >
                      {busy ? "Working…" : "Approve"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      aria-busy={busy}
                      onClick={() => onReject(approval.id)}
                      className="rounded-md border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-1.5 text-[12px] font-medium text-[var(--text)] outline-none transition-colors hover:bg-[var(--surface-3)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-1)] disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <p
                    className="mt-3 rounded-md border px-3 py-2 text-[11px] leading-relaxed"
                    style={{
                      borderColor: `${COLORS.warn}40`,
                      background: `${COLORS.warn}0f`,
                      color: COLORS.warn,
                    }}
                    role="status"
                  >
                    Not actionable yet: the workflow has not opened the approval gate for
                    this request. Decisions are accepted once the run reaches the gate.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
