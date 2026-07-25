// Shared work-management layer: every task grouped by the state it is actually
// in, so blocked, failed, paused, and completed work is visible at once.

import { Panel, Badge, StatusDot } from "@/components/ui/primitives";
import { DataSourceBadge, NotImplementedNote } from "@/components/mission-control/DataSourceBadge";
import { EmptyState } from "@/components/mission-control/primitives";
import { PRIORITY_ACCENT } from "@/lib/workflow/config";
import { actorName } from "@/lib/mission-control/status";
import { shortStampFromIso } from "@/lib/format";
import type { WorkBucket } from "@/lib/mission-control/view-model";
import type { Project } from "@/types/domain";

export function WorkBoardPanel({
  buckets,
  projects,
}: {
  buckets: WorkBucket[];
  projects: Project[];
}) {
  const projectName = (projectId: string) =>
    projects.find((p) => p.id === projectId)?.name ?? projectId;

  const total = buckets.reduce((sum, bucket) => sum + bucket.tasks.length, 0);
  const populated = buckets.filter((bucket) => bucket.tasks.length > 0);

  return (
    <Panel
      title="Work Board"
      subtitle={`${total} task${total === 1 ? "" : "s"} across ${buckets.length} states`}
      right={<DataSourceBadge source="derived" />}
    >
      <div className="flex flex-col gap-3">
        {/* Always show every state, including empty ones, so a zero is explicit. */}
        <ul
          className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5"
          role="list"
          aria-label="Task counts by state"
        >
          {buckets.map((bucket) => {
            const empty = bucket.tasks.length === 0;
            return (
              <li
                key={bucket.id}
                className="rounded-lg border bg-[var(--surface-2)] px-2.5 py-2"
                style={{
                  borderColor: empty ? "var(--border)" : `${bucket.color}4d`,
                  background: empty ? undefined : `${bucket.color}0f`,
                }}
              >
                <div className="flex items-center gap-1.5">
                  <StatusDot color={empty ? "var(--idle)" : bucket.color} size={6} />
                  <span className="truncate text-[10.5px] font-medium uppercase tracking-[0.05em] text-[var(--text-faint)]">
                    {bucket.label}
                  </span>
                </div>
                <p
                  className="mt-0.5 text-[18px] font-semibold tabular-nums leading-tight"
                  style={{ color: empty ? "var(--text-faint)" : bucket.color }}
                >
                  {bucket.tasks.length}
                </p>
              </li>
            );
          })}
        </ul>

        {total === 0 ? (
          <EmptyState
            title="No tasks in the work layer"
            detail="Tasks are created by founder requests. Once one exists it will appear in the state that matches its lifecycle status."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {populated.map((bucket) => (
              <section key={bucket.id} aria-label={`${bucket.label} tasks`}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[11px] font-semibold" style={{ color: bucket.color }}>
                    {bucket.label}
                    <span className="ml-1.5 font-normal text-[var(--text-faint)]">
                      {bucket.tasks.length}
                    </span>
                  </p>
                  <p className="truncate text-[10.5px] text-[var(--text-faint)]">
                    {bucket.description}
                  </p>
                </div>
                <ul className="mt-1.5 flex flex-col gap-1.5" role="list">
                  {bucket.tasks.map((task) => (
                    <li
                      key={task.id}
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2"
                      style={{ borderLeft: `2px solid ${bucket.color}` }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 flex-1 text-[12px] font-medium leading-snug text-[var(--text)]">
                          {task.title}
                        </p>
                        <Badge color={PRIORITY_ACCENT[task.priority]}>{task.priority}</Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10.5px] text-[var(--text-faint)]">
                        <span className="truncate">{projectName(task.projectId)}</span>
                        <span>
                          Owner:{" "}
                          {task.assigneeAgentId ? actorName(task.assigneeAgentId) : "Unassigned"}
                        </span>
                        <span className="ml-auto font-mono">
                          {task.id} · {shortStampFromIso(task.updatedAt)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        <NotImplementedNote>
          Retry attempts are not observable here. Trigger.dev retries a failed step
          internally, and the state API records only the final stage, so there is no
          &ldquo;retrying&rdquo; count to display. A task also has no lifecycle value for a
          technical failure — the failure state above is derived from the workflow run
          instead.
        </NotImplementedNote>
      </div>
    </Panel>
  );
}
