import type { WorkflowRunRecord } from "@/types/domain";
import { Panel, Badge, StatusDot } from "@/components/ui/primitives";
import { COLORS } from "@/lib/theme";
import { shortStampFromIso } from "@/lib/format";

const STAGE_LABEL: Record<WorkflowRunRecord["stage"], string> = {
  founder_request_received: "Founder Request",
  executive_review: "Executive Review",
  founder_approval_required: "Founder Approval Required",
  validation_rejected: "Validation Rejected",
  approved: "Approved",
  rejected: "Founder Rejected",
  completed: "Completed",
  failed: "Technical Failure",
};

const STAGE_COLOR: Record<WorkflowRunRecord["stage"], string> = {
  founder_request_received: COLORS.run,
  executive_review: COLORS.run,
  founder_approval_required: COLORS.wait,
  validation_rejected: COLORS.warn,
  approved: COLORS.ok,
  rejected: COLORS.err,
  completed: COLORS.ok,
  failed: COLORS.err,
};

function outcomeSummary(run: WorkflowRunRecord): string | null {
  if (run.reviewSummary) return run.reviewSummary;
  if (run.stage === "failed") return "Workflow failed due to a technical error.";
  return null;
}

export function WorkflowStatusPanel({
  workflowRuns,
}: {
  workflowRuns: WorkflowRunRecord[];
}) {
  return (
    <Panel
      title="Workflow Status"
      subtitle={`${workflowRuns.length} real workflow run(s)`}
      bodyClassName="p-0"
    >
      {workflowRuns.length === 0 ? (
        <p className="px-4 py-6 text-center text-[12px] text-[var(--text-faint)]">
          No workflow runs yet. Submit a founder request to start one.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--border)]" role="list">
          {workflowRuns.map((run) => (
            <li key={run.executionId} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-[10.5px] text-[var(--text-faint)]">
                    {run.executionId}
                  </p>
                  <h3 className="mt-1 truncate text-[12.5px] font-medium text-[var(--text)]">
                    {run.taskId}
                  </h3>
                </div>
                <Badge color={STAGE_COLOR[run.stage]}>{STAGE_LABEL[run.stage]}</Badge>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--text-dim)]">
                <StatusDot color={STAGE_COLOR[run.stage]} size={6} />
                <span>{STAGE_LABEL[run.stage]}</span>
                <span className="ml-auto font-mono text-[10.5px] text-[var(--text-faint)]">
                  {shortStampFromIso(run.updatedAt)}
                </span>
              </div>
              {outcomeSummary(run) ? (
                <p className="mt-2 text-[11.5px] leading-snug text-[var(--text-dim)]">
                  {outcomeSummary(run)}
                </p>
              ) : null}
              {run.decision ? (
                <p className="mt-1 font-mono text-[10.5px] text-[var(--text-faint)]">
                  decision={run.decision}
                  {run.rejectionKind ? ` · rejection=${run.rejectionKind}` : ""}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
