import type { ReactNode } from "react";
import type { Task } from "@/types/workflow";
import { isRunnable } from "@/lib/workflow/useWorkflowEngine";

function IconPlay() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden fill="currentColor">
      <path d="M4 2.5v11a.5.5 0 0 0 .77.42l8.5-5.5a.5.5 0 0 0 0-.84l-8.5-5.5A.5.5 0 0 0 4 2.5Z" />
    </svg>
  );
}
function IconPause() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden fill="currentColor">
      <path d="M5 2.5H3.5A.5.5 0 0 0 3 3v10a.5.5 0 0 0 .5.5H5a.5.5 0 0 0 .5-.5V3a.5.5 0 0 0-.5-.5Zm7.5 0H11a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h1.5a.5.5 0 0 0 .5-.5V3a.5.5 0 0 0-.5-.5Z" />
    </svg>
  );
}

export function WorkflowControls({
  task,
  runningId,
  paused,
  onRun,
  onPause,
  onResume,
}: {
  task: Task;
  runningId: string | null;
  paused: boolean;
  onRun: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
}) {
  const isThisRunning = runningId === task.id;
  const anotherRunning = runningId !== null && runningId !== task.id;
  const atStart = task.currentStage === "PLANNING" || task.currentStage === "READY";

  const baseBtn =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-1)] disabled:cursor-not-allowed disabled:opacity-50";

  let control: ReactNode;
  let note: string;

  if (task.currentStage === "COMPLETE") {
    control = (
      <button type="button" className={baseBtn} disabled style={{ background: "var(--surface-3)", color: "var(--text-faint)" }} aria-label="Task complete">
        Completed
      </button>
    );
    note = "This task is complete and cannot be started again.";
  } else if (task.currentStage === "WAITING_FOR_EVAN") {
    control = (
      <button type="button" className={baseBtn} disabled style={{ background: "var(--surface-3)", color: "var(--wait)" }} aria-label="Awaiting Evan's approval">
        Awaiting approval
      </button>
    );
    note = "Use the approval panel below to approve or request changes.";
  } else if (isThisRunning && !paused) {
    control = (
      <button
        type="button"
        onClick={() => onPause(task.id)}
        className={`${baseBtn} focus-visible:ring-[var(--warn)]`}
        style={{ background: "var(--warn)", color: "#1a1205" }}
        aria-label="Pause the simulated workflow"
      >
        <IconPause /> Pause
      </button>
    );
    note = "Simulation running. State stays visible while paused.";
  } else if (isThisRunning && paused) {
    control = (
      <button
        type="button"
        onClick={() => onResume(task.id)}
        className={`${baseBtn} focus-visible:ring-[var(--accent)]`}
        style={{ background: "var(--accent)", color: "var(--bg)" }}
        aria-label="Resume the simulated workflow"
      >
        <IconPlay /> Resume
      </button>
    );
    note = "Paused. Current state is preserved.";
  } else {
    // Not running: offer to start / resume, unless another task holds the runner.
    const label = atStart ? "Start Workflow" : "Resume Workflow";
    control = (
      <button
        type="button"
        onClick={() => onRun(task.id)}
        disabled={anotherRunning || !isRunnable(task)}
        className={`${baseBtn} focus-visible:ring-[var(--accent)]`}
        style={{ background: "var(--accent)", color: "var(--bg)" }}
        aria-label={`${label} for ${task.id}`}
        title={anotherRunning ? "Another workflow is already running" : undefined}
      >
        <IconPlay /> {label}
      </button>
    );
    note = anotherRunning
      ? "Another workflow is running — only one simulates at a time."
      : atStart
        ? "Starts the simulated pipeline and stops at Waiting for Evan."
        : "Resumes the simulated pipeline from the current stage.";
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3">
      {control}
      <p className="text-[12px] text-[var(--text-faint)]">{note}</p>
      <span className="ml-auto text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-faint)]">
        Simulated automation
      </span>
    </div>
  );
}
