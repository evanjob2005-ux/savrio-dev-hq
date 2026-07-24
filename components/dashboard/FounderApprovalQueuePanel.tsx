import type { Approval } from "@/types/domain";
import { Panel, Badge } from "@/components/ui/primitives";
import { COLORS } from "@/lib/theme";
import { shortStampFromIso } from "@/lib/format";

export function FounderApprovalQueuePanel({
  approvals,
  onApprove,
  onReject,
  busyApprovalId = null,
}: {
  approvals: Approval[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  busyApprovalId?: string | null;
}) {
  const pending = approvals.filter((a) => a.status === "pending");

  return (
    <Panel
      title="Founder Approval Queue"
      subtitle={`${pending.length} awaiting Evan`}
      bodyClassName="p-0"
    >
      {pending.length === 0 ? (
        <p className="px-4 py-6 text-center text-[12px] text-[var(--text-faint)]">
          No pending approvals.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--border)]" role="list">
          {pending.map((approval) => {
            const busy = busyApprovalId === approval.id;
            return (
              <li
                key={approval.id}
                className="px-4 py-3"
                style={{ background: "rgba(242,184,75,0.04)" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[12.5px] font-medium leading-snug text-[var(--text)]">
                    {approval.title}
                  </h3>
                  <Badge color={COLORS.wait}>Pending</Badge>
                </div>
                <p className="mt-1 text-[11.5px] leading-snug text-[var(--text-dim)]">
                  {approval.summary}
                </p>
                <p className="mt-2 font-mono text-[10.5px] text-[var(--text-faint)]">
                  {approval.taskId} · {shortStampFromIso(approval.requestedAt)}
                </p>
                {onApprove && onReject ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onApprove(approval.id)}
                      className="rounded-md px-3 py-1.5 text-[12px] font-medium text-[var(--bg)] disabled:opacity-60"
                      style={{ background: COLORS.ok }}
                    >
                      {busy ? "Working…" : "Approve"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onReject(approval.id)}
                      className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-[12px] font-medium text-[var(--text)] disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
