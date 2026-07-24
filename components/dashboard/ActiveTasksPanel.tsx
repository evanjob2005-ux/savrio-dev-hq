import type { Task } from "@/types/domain";
import { Panel, Badge, StatusDot } from "@/components/ui/primitives";
import { COLORS } from "@/lib/theme";
import { PRIORITY_ACCENT } from "@/lib/workflow/config";

const STATUS_COLOR: Record<Task["status"], string> = {
  draft: COLORS.idle,
  active: COLORS.run,
  paused: COLORS.warn,
  blocked: COLORS.err,
  completed: COLORS.ok,
  archived: COLORS.idle,
};

export function ActiveTasksPanel({ tasks }: { tasks: Task[] }) {
  const active = tasks.filter((t) => t.status === "active" || t.status === "blocked");

  return (
    <Panel
      title="Active Tasks"
      subtitle={`${active.length} in progress`}
      bodyClassName="p-0"
    >
      <ul className="divide-y divide-[var(--border)]" role="list">
        {active.map((task) => (
          <li key={task.id} className="px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10.5px] text-[var(--text-faint)]">
                {task.id}
              </span>
              <Badge color={PRIORITY_ACCENT[task.priority]}>{task.priority}</Badge>
            </div>
            <h3 className="mt-1 line-clamp-2 text-[12.5px] font-medium leading-snug text-[var(--text)]">
              {task.title}
            </h3>
            <div className="mt-2 flex items-center gap-2">
              <StatusDot color={STATUS_COLOR[task.status]} size={6} />
              <span className="text-[11px] capitalize text-[var(--text-dim)]">
                {task.status}
              </span>
              {task.assigneeAgentId ? (
                <span className="ml-auto truncate font-mono text-[10.5px] text-[var(--text-faint)]">
                  {task.assigneeAgentId}
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
