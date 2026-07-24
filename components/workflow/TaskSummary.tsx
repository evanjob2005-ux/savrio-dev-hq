import type { Ref } from "react";
import type { Task } from "@/types/workflow";
import { PRIORITY_ACCENT, STAGES } from "@/lib/workflow/config";
import { Badge, ProgressBar } from "@/components/ui/primitives";
import { COLORS } from "@/lib/theme";

function Meta({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-faint)]">
        {label}
      </span>
      <span
        className={`text-[12px] text-[var(--text-dim)] ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

export function TaskSummary({
  task,
  titleRef,
}: {
  task: Task;
  titleRef?: Ref<HTMLHeadingElement>;
}) {
  const stage = STAGES[task.currentStage];
  const priorityColor = PRIORITY_ACCENT[task.priority];

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[12px] text-[var(--text-faint)]">
              {task.id}
            </span>
            <Badge color={priorityColor}>{task.priority}</Badge>
            <Badge color={COLORS.textDim}>{stage.label}</Badge>
            {task.retryCount > 0 && (
              <Badge color={COLORS.warn}>Retry ×{task.retryCount}</Badge>
            )}
          </div>
          <h2
            ref={titleRef}
            tabIndex={-1}
            className="mt-2 rounded text-[19px] font-semibold leading-tight tracking-tight text-[var(--text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
          >
            {task.title}
          </h2>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[var(--text-dim)]">
            {task.objective}
          </p>
        </div>
        <div className="text-right">
          <div className="text-[26px] font-semibold tabular-nums leading-none text-[var(--text)]">
            {task.progress}
            <span className="text-[15px] text-[var(--text-faint)]">%</span>
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.08em] text-[var(--text-faint)]">
            Progress
          </div>
        </div>
      </div>

      <ProgressBar
        value={task.progress}
        color={priorityColor}
        className="mt-4"
        label={`${task.id} overall progress`}
      />

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <Meta label="Repository" value={task.repository} mono />
        <Meta label="Branch" value={task.branch} mono />
        <Meta label="Current agent" value={task.currentAgent} />
        <Meta label="Status" value={task.status} mono />
      </div>
    </section>
  );
}
