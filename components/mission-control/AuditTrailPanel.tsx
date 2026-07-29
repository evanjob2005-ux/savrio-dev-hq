// Auditability: for each workflow run, the recorded validation finding, the
// decision, who made it, and the ids needed to trace the run end to end.
//
// The Evidence domain type exists but has no store or API, so no evidence
// artifacts are claimed here. What is shown is the auditable record that the
// state API actually returns.

import { Panel, ScrollRegion } from "@/components/ui/primitives";
import { DataSourceBadge, NotImplementedNote } from "@/components/mission-control/DataSourceBadge";
import { EmptyState, MetaRow, StatusPill } from "@/components/mission-control/primitives";
import { COLORS } from "@/lib/theme";
import { shortStampFromIso } from "@/lib/format";
import { APPROVAL_STATUS, EXECUTION_STATUS, actorName } from "@/lib/mission-control/status";
import type { AuditRecord } from "@/lib/mission-control/view-model";

/**
 * Wording for the continuation dimension. Only `confirmed` says a run started;
 * the others say plainly that it did not, or that we do not know — which is the
 * distinction the audit trail exists to preserve.
 */
const CONTINUATION_LABEL: Record<AuditRecord["continuation"], string> = {
  not_attempted: "Not attempted — no decision recorded",
  confirmed: "Confirmed started",
  unconfirmed: "Unconfirmed — not known to have started",
  failed: "Failed — did not start",
};

function validationOutcome(record: AuditRecord): {
  label: string;
  color: string;
} {
  if (record.stage === "failed") {
    return { label: "Not completed — technical failure", color: COLORS.err };
  }
  if (record.rejectionKind === "validation") {
    return { label: "Validation failed", color: COLORS.warn };
  }
  if (record.reviewSummary) {
    return { label: "Validation passed", color: COLORS.ok };
  }
  return { label: "Validation not run yet", color: COLORS.idle };
}

export function AuditTrailPanel({ records }: { records: AuditRecord[] }) {
  return (
    <Panel
      title="Evidence & Audit Trail"
      subtitle={`${records.length} workflow run${records.length === 1 ? "" : "s"} on record`}
      right={<DataSourceBadge source="live" />}
      bodyClassName="p-0"
    >
      {records.length === 0 ? (
        <div className="p-4">
          <EmptyState
            title="No runs to audit yet"
            detail="Each founder request produces a run record with its validation finding, decision, and trace identifiers."
          />
        </div>
      ) : (
        <ScrollRegion
          label={`Workflow run audit records, ${records.length} item${
            records.length === 1 ? "" : "s"
          }`}
          className="max-h-[520px] overflow-y-auto"
        >
          <ul className="divide-y divide-[var(--border)]" role="list">
            {records.map((record) => {
              const validation = validationOutcome(record);
              return (
                <li key={record.executionId} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-[12.5px] font-medium text-[var(--text)]">
                        {record.taskTitle ?? record.taskId}
                      </h3>
                      <p className="mt-0.5 truncate text-[11px] text-[var(--text-faint)]">
                        {record.projectName ?? "Unknown project"}
                      </p>
                    </div>
                    <StatusPill status={record.status} />
                  </div>

                  <p
                    className="mt-2 inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium"
                    style={{
                      color: validation.color,
                      background: `${validation.color}14`,
                      border: `1px solid ${validation.color}33`,
                    }}
                  >
                    {validation.label}
                  </p>

                  {record.reviewSummary ? (
                    <p className="mt-2 text-[11.5px] leading-relaxed text-[var(--text-dim)]">
                      {record.reviewSummary}
                    </p>
                  ) : null}

                  <dl className="mt-2 border-t border-[var(--border)] pt-2">
                    <MetaRow
                      label="Decision"
                      value={
                        record.decision
                          ? `${record.decision}${
                              record.rejectionKind ? ` (${record.rejectionKind})` : ""
                            }`
                          : "Not decided"
                      }
                      mono={false}
                    />
                    <MetaRow
                      label="Decided by"
                      value={
                        record.approval?.decidedByUserId
                          ? actorName(record.approval.decidedByUserId)
                          : "—"
                      }
                      mono={false}
                    />
                    <MetaRow
                      label="Decided at"
                      value={
                        record.approval?.decidedAt
                          ? `${shortStampFromIso(record.approval.decidedAt)} UTC`
                          : "—"
                      }
                    />
                    <MetaRow
                      label="Approval"
                      value={
                        record.approval ? (
                          <span className="inline-flex items-center gap-1.5">
                            {record.approval.id}
                            <span
                              style={{ color: APPROVAL_STATUS[record.approval.status].color }}
                            >
                              {APPROVAL_STATUS[record.approval.status].label}
                            </span>
                          </span>
                        ) : (
                          "None"
                        )
                      }
                    />
                    <MetaRow
                      label="Execution"
                      value={
                        <span className="inline-flex items-center gap-1.5">
                          {record.executionId}
                          {record.execution ? (
                            <span
                              style={{ color: EXECUTION_STATUS[record.execution.status].color }}
                            >
                              {EXECUTION_STATUS[record.execution.status].label}
                            </span>
                          ) : null}
                        </span>
                      }
                    />
                    <MetaRow
                      label="Trigger.dev run"
                      value={record.triggerRunId ?? "Not dispatched"}
                    />
                    <MetaRow
                      label="Continuation"
                      value={
                        record.continuationRunId
                          ? `${CONTINUATION_LABEL[record.continuation]} — ${record.continuationRunId}`
                          : CONTINUATION_LABEL[record.continuation]
                      }
                    />
                    <MetaRow
                      label="Last updated"
                      value={`${shortStampFromIso(record.updatedAt)} UTC`}
                    />
                  </dl>
                </li>
              );
            })}
          </ul>
        </ScrollRegion>
      )}

      <div className="border-t border-[var(--border)] p-3">
        <NotImplementedNote>
          Evidence artifacts (lint, build, test, and review outputs) are not stored yet. The
          Evidence contract is defined in the domain types but has no repository or API, so
          nothing above is presented as a validation artifact — only the recorded review
          finding and decision trail.
        </NotImplementedNote>
      </div>
    </Panel>
  );
}
