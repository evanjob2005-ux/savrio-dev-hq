// Renders a run against the stages its workflow actually declares.
//
// Stage names and the approval-gate flag come from the stored Workflow
// definition; the current position is derived from the run's recorded stage.
// A technical failure does not record where it failed, so those stages are shown
// as unknown rather than guessed.

import { ProgressBar } from "@/components/ui/primitives";
import { COLORS } from "@/lib/theme";
import type { StageNode, StageProgress } from "@/lib/mission-control/view-model";

const STATE_META: Record<StageNode["state"], { color: string; label: string }> = {
  complete: { color: COLORS.ok, label: "Complete" },
  current: { color: COLORS.run, label: "Current" },
  pending: { color: COLORS.idle, label: "Pending" },
  unknown: { color: COLORS.idle, label: "Not recorded" },
};

export function WorkflowStageTrack({
  progress,
  workflowName,
  label,
}: {
  progress: StageProgress;
  workflowName: string;
  label: string;
}) {
  const railColor =
    progress.outcome === "failed"
      ? COLORS.err
      : progress.outcome === "rejected" || progress.outcome === "needs_revision"
        ? COLORS.warn
        : progress.status.color;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="truncate text-[11px] text-[var(--text-faint)]">
          {workflowName} · stage {progress.currentIndex < 0 ? "unknown" : progress.currentIndex + 1}{" "}
          of {progress.stages.length}
        </p>
        <p className="shrink-0 font-mono text-[11px] tabular-nums" style={{ color: railColor }}>
          {progress.percent}%
        </p>
      </div>

      <ProgressBar value={progress.percent} color={railColor} label={label} />

      <ol className="flex flex-col gap-1.5 sm:flex-row sm:gap-1" role="list">
        {progress.stages.map((stage) => {
          const meta = STATE_META[stage.state];
          const isCurrent = stage.state === "current";
          return (
            <li
              key={stage.id}
              className="flex min-w-0 flex-1 items-start gap-2 rounded-md border px-2 py-1.5 sm:flex-col sm:gap-1"
              style={{
                borderColor: isCurrent ? `${meta.color}55` : "var(--border)",
                background: isCurrent ? `${meta.color}12` : "var(--surface-2)",
              }}
            >
              <span
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold tabular-nums"
                style={{
                  color: stage.state === "pending" ? COLORS.textFaint : meta.color,
                  background: `${meta.color}1f`,
                  border: `1px solid ${meta.color}44`,
                }}
                aria-hidden
              >
                {stage.order}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[11px] font-medium text-[var(--text)]">
                  {stage.name}
                </span>
                <span className="block text-[10px]" style={{ color: meta.color }}>
                  {meta.label}
                  {stage.requiresApproval ? " · founder gate" : ""}
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      {progress.currentIndex < 0 ? (
        <p className="text-[10.5px] leading-relaxed text-[var(--text-faint)]">
          {progress.outcome === "failed"
            ? "The run failed with a technical error. The stage it failed in is not recorded in state, so no stage is marked complete."
            : // P2-36: the run has a stage, but this workflow no longer declares
              // the stage it belongs to. Saying so is the honest reading; the
              // previous numeric mapping would have silently pointed at whatever
              // stage now occupies that position.
              "The run's stage is not among the stages this workflow declares, so its position cannot be shown. No stage is marked complete."}
        </p>
      ) : null}
    </div>
  );
}
