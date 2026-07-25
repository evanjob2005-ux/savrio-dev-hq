// One project and everything beneath it: the orchestrator driving it, its
// workflow position, its tasks and their owners, and the identifiers needed to
// audit the run.

import { Badge, StatusDot } from "@/components/ui/primitives";
import { DataSourceBadge } from "@/components/mission-control/DataSourceBadge";
import { MetaRow, StatusPill } from "@/components/mission-control/primitives";
import { WorkflowStageTrack } from "@/components/mission-control/WorkflowStageTrack";
import { COLORS } from "@/lib/theme";
import { shortStampFromIso } from "@/lib/format";
import { PRIORITY_ACCENT } from "@/lib/workflow/config";
import {
  APPROVAL_STATUS,
  EXECUTION_STATUS,
  LIFECYCLE_STATUS,
  actorName,
} from "@/lib/mission-control/status";
import type { ProjectNode } from "@/lib/mission-control/view-model";

export function ProjectOrchestratorCard({ node }: { node: ProjectNode }) {
  const { project, tasks, stageProgress, primaryRun, pendingApprovals } = node;
  const latestExecution = node.executions[0] ?? null;

  return (
    <article
      className="rounded-xl border bg-[var(--surface-1)] p-4"
      style={{
        borderColor: node.needsAttention ? `${node.headline.color}4d` : "var(--border)",
      }}
      aria-labelledby={`project-${project.id}-heading`}
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3
            id={`project-${project.id}-heading`}
            className="truncate text-[14px] font-semibold leading-tight text-[var(--text)]"
          >
            {project.name}
          </h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10.5px] text-[var(--text-faint)]">
            <span>{project.id}</span>
            <span className="text-[var(--border-strong)]" aria-hidden>
              |
            </span>
            <span className="truncate">
              {project.repository}/{project.defaultBranch}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <StatusPill
            status={node.headline}
            pulse={node.headline.label.startsWith("Awaiting")}
          />
          {node.needsAttention ? <Badge color={COLORS.warn}>Needs attention</Badge> : null}
        </div>
      </header>

      {project.description ? (
        <p className="mt-2 line-clamp-2 text-[11.5px] leading-relaxed text-[var(--text-dim)]">
          {project.description}
        </p>
      ) : null}

      {/* Orchestration ownership */}
      <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)]">
            Orchestration
          </span>
          <DataSourceBadge source="derived" />
        </div>
        <dl className="mt-1.5">
          <MetaRow label="Owner" value={actorName(project.ownerId)} mono={false} />
          <MetaRow
            label="Driving orchestrator"
            value={
              node.orchestratingAgentIds.length > 0
                ? node.orchestratingAgentIds.map(actorName).join(", ")
                : "Executive Orchestrator (no approval requested yet)"
            }
            mono={false}
          />
          <MetaRow label="Project orchestrator" value="Not yet assigned" mono={false} />
        </dl>
      </div>

      {/* Workflow position */}
      <div className="mt-3">
        {stageProgress && primaryRun && node.workflow ? (
          <WorkflowStageTrack
            progress={stageProgress}
            workflowName={node.workflow.name}
            label={`${project.name} workflow progress`}
          />
        ) : (
          <p className="rounded-lg border border-dashed border-[var(--border-strong)] px-3 py-2 text-[11px] text-[var(--text-faint)]">
            No workflow run recorded for this project yet.
          </p>
        )}
      </div>

      {/* Tasks and ownership */}
      <div className="mt-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--text-faint)]">
            Tasks ({tasks.length})
          </h4>
          <DataSourceBadge source="live" />
        </div>
        {tasks.length === 0 ? (
          <p className="mt-1.5 text-[11px] text-[var(--text-faint)]">
            No tasks recorded for this project.
          </p>
        ) : (
          <ul className="mt-1.5 flex flex-col gap-1.5" role="list">
            {tasks.map((task) => {
              const status = LIFECYCLE_STATUS[task.status];
              return (
                <li
                  key={task.id}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 text-[12px] font-medium leading-snug text-[var(--text)]">
                      {task.title}
                    </p>
                    <Badge color={PRIORITY_ACCENT[task.priority]}>{task.priority}</Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-dim)]">
                      <StatusDot
                        color={status.color}
                        size={6}
                        pulse={task.status === "active"}
                      />
                      {status.label}
                    </span>
                    <span className="text-[11px] text-[var(--text-faint)]">
                      Owner:{" "}
                      <span className="text-[var(--text-dim)]">
                        {task.assigneeAgentId
                          ? actorName(task.assigneeAgentId)
                          : "Unassigned"}
                      </span>
                    </span>
                    <span className="ml-auto font-mono text-[10px] text-[var(--text-faint)]">
                      {task.id}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Pending gates */}
      {pendingApprovals.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1.5" role="list">
          {pendingApprovals.map((approval) => (
            <li
              key={approval.id}
              className="rounded-lg border px-3 py-2"
              style={{
                borderColor: `${COLORS.wait}4d`,
                background: `${COLORS.wait}0f`,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 text-[11.5px] font-medium text-[var(--text)]">
                  {approval.title}
                </p>
                <StatusPill status={APPROVAL_STATUS[approval.status]} pulse />
              </div>
              <p className="mt-1 font-mono text-[10px] text-[var(--text-faint)]">
                {approval.id} · requested {shortStampFromIso(approval.requestedAt)} UTC
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Audit identifiers */}
      <dl className="mt-3 border-t border-[var(--border)] pt-2">
        <MetaRow
          label="Execution"
          value={
            latestExecution ? (
              <span className="inline-flex items-center gap-1.5">
                {latestExecution.id}
                <span style={{ color: EXECUTION_STATUS[latestExecution.status].color }}>
                  {EXECUTION_STATUS[latestExecution.status].label}
                </span>
              </span>
            ) : (
              "None"
            )
          }
        />
        <MetaRow label="Trigger.dev run" value={primaryRun?.triggerRunId ?? "Not dispatched"} />
        <MetaRow
          label="Updated"
          value={`${shortStampFromIso(project.updatedAt)} UTC`}
        />
      </dl>
    </article>
  );
}
