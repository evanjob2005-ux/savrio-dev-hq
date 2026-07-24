import type { Task } from "@/types/workflow";
import { Badge } from "@/components/ui/primitives";
import { COLORS } from "@/lib/theme";

function CheckRow({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-[var(--surface-2)] px-3 py-2">
      <span className="text-[12px] text-[var(--text-dim)]">{label}</span>
      <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-[var(--ok)]">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M3.5 8.5l3 3 6-6.5" stroke="var(--ok)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {status}
      </span>
    </div>
  );
}

export function ApprovalPanel({
  task,
  onApprove,
  onRequestChanges,
  blockedByOtherRun = false,
}: {
  task: Task;
  onApprove: (id: string) => void;
  onRequestChanges: (id: string) => void;
  /** True when a different task is actively simulating; approval is disabled
      so it cannot interrupt the running workflow. */
  blockedByOtherRun?: boolean;
}) {
  const changedFiles = task.expectedFiles.length;
  const validationLine = task.requiredValidation
    .map((v) => `${v.label}: ${v.status}`)
    .join(" · ");

  return (
    <section
      className="rounded-xl border p-5"
      style={{ borderColor: `${COLORS.wait}55`, background: "linear-gradient(180deg, rgba(242,184,75,0.08), rgba(242,184,75,0.02))" }}
      aria-labelledby="approval-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="approval-heading" className="flex items-center gap-2 text-[14px] font-semibold text-[var(--text)]">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full text-[13px]"
            style={{ background: `${COLORS.wait}22`, color: COLORS.wait }}
            aria-hidden
          >
            ★
          </span>
          Approval requested — Evan
        </h3>
        <Badge color={COLORS.wait}>Waiting for Evan</Badge>
      </div>

      <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--text-dim)]">
        <span className="font-medium text-[var(--text)]">Implementation summary: </span>
        {task.objective} The simulated pipeline completed engineering, review, and QA.
        This is a mock approval gate — approving performs no real commit, merge, or deploy.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <CheckRow label="Claude — build" status="Complete" />
        <CheckRow label="Codex — focused review" status="Complete" />
        <CheckRow label="Claude — final review" status="Complete" />
        <CheckRow label="Gemini — QA" status="Complete" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 sm:grid-cols-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-faint)]">Changed files</div>
          <div className="text-[16px] font-semibold tabular-nums text-[var(--text)]">{changedFiles}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-faint)]">Retries</div>
          <div className="text-[16px] font-semibold tabular-nums text-[var(--text)]">{task.retryCount}</div>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-faint)]">Validation</div>
          <div className="truncate text-[12px] text-[var(--ok)]">{validationLine}</div>
        </div>
      </div>

      {task.knownRisks.length > 0 && (
        <div className="mt-3">
          <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-faint)]">Known risks</div>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[12px] text-[var(--text-dim)]">
            {task.knownRisks.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onApprove(task.id)}
          disabled={blockedByOtherRun}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold text-[var(--bg)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ok)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-1)] disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: "var(--ok)" }}
          aria-label={`Approve ${task.id} and move it to complete`}
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => onRequestChanges(task.id)}
          disabled={blockedByOtherRun}
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--warn)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-1)] disabled:cursor-not-allowed disabled:opacity-50"
          style={{ borderColor: `${COLORS.warn}66`, color: COLORS.warn, background: `${COLORS.warn}12` }}
          aria-label={`Request changes on ${task.id} and route it back to Claude build`}
        >
          Request Changes
        </button>
        {blockedByOtherRun && (
          <p className="text-[12px] text-[var(--warn)]">
            Another workflow is running — pause or finish it before approving this task.
          </p>
        )}
      </div>
    </section>
  );
}
