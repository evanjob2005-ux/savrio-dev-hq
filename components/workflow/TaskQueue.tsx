import type { Task } from "@/types/workflow";
import { PRIORITY_ACCENT, STAGES, AGENTS } from "@/lib/workflow/config";
import { Panel, ProgressBar, StatusDot, Avatar, Badge } from "@/components/ui/primitives";
import { COLORS } from "@/lib/theme";

export function TaskQueue({
  tasks,
  selectedId,
  runningId,
  paused,
  onSelect,
}: {
  tasks: Task[];
  selectedId: string;
  runningId: string | null;
  paused: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <Panel
      title="Task Queue"
      subtitle={`${tasks.length} tasks`}
      bodyClassName="p-2"
    >
      <ul className="flex flex-col gap-2" role="list">
        {tasks.map((task) => {
          const selected = task.id === selectedId;
          const isRunning = runningId === task.id;
          const stage = STAGES[task.currentStage];
          const priorityColor = PRIORITY_ACCENT[task.priority];
          const agent = AGENTS[task.currentAgent];

          return (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => onSelect(task.id)}
                aria-pressed={selected}
                aria-label={`Select task ${task.id}: ${task.title}`}
                className="w-full rounded-lg border px-3 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60"
                style={{
                  borderColor: selected ? "var(--border-strong)" : "var(--border)",
                  background: selected ? "var(--surface-3)" : "var(--surface-2)",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-[var(--text-faint)]">
                    {task.id}
                  </span>
                  <Badge color={priorityColor}>{task.priority}</Badge>
                </div>

                <h3 className="mt-1.5 line-clamp-2 text-[13px] font-medium leading-snug text-[var(--text)]">
                  {task.title}
                </h3>

                <div className="mt-2 flex items-center gap-2">
                  <StatusDot
                    color={
                      isRunning && !paused
                        ? COLORS.run
                        : task.currentStage === "WAITING_FOR_EVAN"
                          ? COLORS.wait
                          : task.currentStage === "COMPLETE"
                            ? COLORS.ok
                            : COLORS.idle
                    }
                    pulse={isRunning && !paused}
                    size={7}
                  />
                  <span className="truncate text-[11.5px] text-[var(--text-dim)]">
                    {stage.label}
                  </span>
                  <span className="ml-auto flex items-center gap-1.5">
                    <Avatar initials={agent.initials} accent={agent.accent} size={18} />
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <ProgressBar
                    value={task.progress}
                    color={priorityColor}
                    className="flex-1"
                    label={`${task.id} progress`}
                  />
                  <span className="w-8 text-right text-[10.5px] tabular-nums text-[var(--text-faint)]">
                    {task.progress}%
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-1.5 font-mono text-[10.5px] text-[var(--text-faint)]">
                  <span className="truncate">{task.repository}</span>
                  <span className="text-[var(--border-strong)]">/</span>
                  <span className="truncate text-[var(--text-dim)]">{task.branch}</span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
