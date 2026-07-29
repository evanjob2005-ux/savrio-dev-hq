// Derives the Mission Control command-center view model from a live DevHqState
// snapshot.
//
// This module is pure presentation logic: it only reads the state returned by
// GET /api/dev-hq/state and reshapes it for rendering. It never mutates the
// store, never calls an API, and never invents values. Anything the backend does
// not record is reported as absent so the UI can label it honestly.

import type { DevHqState } from "@/lib/dev-hq/types";
import { COLORS } from "@/lib/theme";
import { WORKFLOW_STAGE, actorName, type StatusToken } from "@/lib/mission-control/status";
import type {
  Approval,
  Event,
  Execution,
  FounderRequestWorkflowStage,
  Project,
  Task,
  Workflow,
  WorkflowRunRecord,
} from "@/types/domain";

/** How far a run has progressed through the workflow's declared stages. */
export type StageState = "complete" | "current" | "pending" | "unknown";

export interface StageNode {
  id: string;
  name: string;
  order: number;
  requiresApproval: boolean;
  state: StageState;
}

export type RunOutcome =
  | "in_progress"
  | "awaiting_approval"
  | "completed"
  | "rejected"
  | "needs_revision"
  | "failed";

export interface StageProgress {
  stages: StageNode[];
  /** Index into `stages` of the current stage, or -1 when not recorded. */
  currentIndex: number;
  percent: number;
  outcome: RunOutcome;
  status: StatusToken;
  /** True when the run ended and no further stages will execute. */
  terminal: boolean;
}

export interface ProjectNode {
  project: Project;
  workflow: Workflow | null;
  tasks: Task[];
  executions: Execution[];
  approvals: Approval[];
  runs: WorkflowRunRecord[];
  events: Event[];
  /** Most recently updated run for this project. */
  primaryRun: WorkflowRunRecord | null;
  stageProgress: StageProgress | null;
  pendingApprovals: Approval[];
  /** Agent ids actually recorded against this project's tasks or executions. */
  assignedAgentIds: string[];
  /** Agent ids that have requested approvals for this project's work. */
  orchestratingAgentIds: string[];
  needsAttention: boolean;
  headline: StatusToken;
}

export interface WorkBucket {
  id: string;
  label: string;
  description: string;
  color: string;
  tasks: Task[];
}

export interface ApprovalItem {
  approval: Approval;
  task: Task | null;
  project: Project | null;
  run: WorkflowRunRecord | null;
  /**
   * A pending approval can only be actioned once its run has opened the gate.
   * There is no wait token to attach any more: the gate is the run stage, and a
   * decision starts a new run rather than resuming a parked one.
   */
  actionable: boolean;
}

export interface AuditRecord {
  executionId: string;
  taskId: string;
  taskTitle: string | null;
  projectName: string | null;
  stage: FounderRequestWorkflowStage;
  status: StatusToken;
  reviewSummary: string | null;
  decision: WorkflowRunRecord["decision"];
  /** Orthogonal to `decision`: whether the workflow advanced on it. */
  continuation: WorkflowRunRecord["continuation"];
  continuationDetail: string | null;
  rejectionKind: WorkflowRunRecord["rejectionKind"];
  triggerRunId: string | null;
  continuationRunId: string | null;
  execution: Execution | null;
  approval: Approval | null;
  updatedAt: string;
}

export interface Participant {
  id: string;
  label: string;
  /** Roles inferred from the records the id appears in. */
  roles: string[];
  eventCount: number;
  lastActiveAt: string | null;
}

export interface ExecutiveSummary {
  status: StatusToken;
  runsTotal: number;
  inReview: number;
  awaitingFounder: number;
  decided: number;
  failed: number;
  runningExecutions: number;
  queuedExecutions: number;
  /** Runs whose Trigger.dev run id was recorded. */
  dispatchedRuns: number;
  lastActivityAt: string | null;
  latestReviewSummary: string | null;
}

export interface CommandCenterModel {
  executive: ExecutiveSummary;
  projects: ProjectNode[];
  buckets: WorkBucket[];
  attentionCount: number;
  approvals: ApprovalItem[];
  auditRecords: AuditRecord[];
  participants: Participant[];
  counts: {
    projects: number;
    activeProjects: number;
    tasks: number;
    executions: number;
    runs: number;
    events: number;
    pendingApprovals: number;
  };
}

/**
 * The declared workflow stage each founder-request run stage sits at, named by
 * the stage's **id** (P2-36).
 *
 * This was a table of numeric positions — 0..4 — which silently assumed the
 * stored Workflow declares exactly the five stages it declares today, in that
 * order. Nothing enforced that. Insert a stage, reorder two, or drop one, and
 * every run kept rendering: `founder_approval_required` would simply point at
 * whatever stage now sat third, marking earlier ones complete and the founder's
 * open gate as somewhere it is not. Drift produced a confident wrong answer with
 * no failure anywhere.
 *
 * Resolving by id makes the declared list the authority for position: a
 * reordered or inserted stage moves the marker with it, and a stage that is no
 * longer declared resolves to nothing and renders as unrecorded rather than as a
 * guess (see `buildStageProgress`).
 *
 * `failed` is null for the original reason: a technical failure does not record
 * which stage it failed in, so the UI must not guess.
 */
const STAGE_ID_FOR_RUN_STAGE: Record<FounderRequestWorkflowStage, string | null> = {
  founder_request_received: "stage-founder-request",
  executive_review: "stage-executive-review",
  founder_approval_required: "stage-founder-approval",
  validation_rejected: "stage-decision",
  approved: "stage-decision",
  rejected: "stage-decision",
  completed: "stage-completed",
  failed: null,
};

const TERMINAL_STAGES: ReadonlySet<FounderRequestWorkflowStage> = new Set([
  "completed",
  "failed",
  "rejected",
  "approved",
  "validation_rejected",
]);

function runOutcome(run: WorkflowRunRecord): RunOutcome {
  if (run.stage === "failed") return "failed";
  if (run.stage === "completed") {
    if (run.decision === "approved") return "completed";
    if (run.rejectionKind === "validation") return "needs_revision";
    if (run.decision === "rejected") return "rejected";
    return "completed";
  }
  if (run.stage === "validation_rejected") return "needs_revision";
  if (run.stage === "rejected") return "rejected";
  if (run.stage === "approved") return "completed";
  if (run.stage === "founder_approval_required") return "awaiting_approval";
  return "in_progress";
}

const OUTCOME_STATUS: Record<RunOutcome, StatusToken> = {
  in_progress: { label: "Running", color: COLORS.run },
  awaiting_approval: { label: "Awaiting founder approval", color: COLORS.wait },
  completed: { label: "Approved and completed", color: COLORS.ok },
  rejected: { label: "Rejected by founder", color: COLORS.err },
  needs_revision: { label: "Validation rejected · needs revision", color: COLORS.warn },
  failed: { label: "Technical failure", color: COLORS.err },
};

/**
 * Maps a run onto the stages its workflow actually declares. Returns null when
 * the workflow definition is missing so the caller renders an honest gap rather
 * than a fabricated track.
 */
export function buildStageProgress(
  run: WorkflowRunRecord,
  workflow: Workflow | null,
): StageProgress | null {
  if (!workflow || workflow.stages.length === 0) return null;

  const ordered = [...workflow.stages].sort((a, b) => a.order - b.order);
  const outcome = runOutcome(run);
  // Resolved against the declared list, not assumed. `findIndex` returning -1 —
  // because the run stage maps to no declared stage, or to one this workflow no
  // longer declares — takes the same "not recorded" path as a technical failure,
  // which is the honest answer: we know the run's stage and cannot place it on
  // this workflow.
  const stageId = STAGE_ID_FOR_RUN_STAGE[run.stage];
  const currentIndex =
    stageId === null ? -1 : ordered.findIndex((stage) => stage.id === stageId);
  const terminal = TERMINAL_STAGES.has(run.stage);
  const lastIndex = ordered.length - 1;

  const stages: StageNode[] = ordered.map((stage, index) => {
    let state: StageState;
    if (currentIndex < 0) {
      state = "unknown";
    } else if (index < currentIndex) {
      state = "complete";
    } else if (index === currentIndex) {
      state = run.stage === "completed" ? "complete" : "current";
    } else {
      state = "pending";
    }
    return {
      id: stage.id,
      name: stage.name,
      order: stage.order,
      requiresApproval: stage.requiresApproval,
      state,
    };
  });

  const percent =
    currentIndex < 0
      ? 0
      : run.stage === "completed"
        ? 100
        : Math.round((currentIndex / Math.max(1, lastIndex)) * 100);

  return {
    stages,
    currentIndex,
    percent,
    outcome,
    status: OUTCOME_STATUS[outcome],
    terminal,
  };
}

function executiveStatus(summary: {
  failed: number;
  awaitingFounder: number;
  inReview: number;
  runsTotal: number;
}): StatusToken {
  if (summary.failed > 0) {
    return { label: "Attention · failed run recorded", color: COLORS.err };
  }
  if (summary.awaitingFounder > 0) {
    return { label: "Waiting on founder decision", color: COLORS.wait };
  }
  if (summary.inReview > 0) {
    return { label: "Reviewing requests", color: COLORS.run };
  }
  if (summary.runsTotal > 0) {
    return { label: "Idle · all runs settled", color: COLORS.ok };
  }
  return { label: "Idle · no runs yet", color: COLORS.idle };
}

function uniqueStrings(values: (string | null | undefined)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))];
}

/** Newest ISO timestamp from the given values, or null when all are absent. */
function latestTimestamp(values: (string | null | undefined)[]): string | null {
  const present = values.filter((v): v is string => Boolean(v));
  if (present.length === 0) return null;
  return present.reduce((max, value) => (value.localeCompare(max) > 0 ? value : max));
}

export function buildCommandCenterModel(state: DevHqState): CommandCenterModel {
  const workflowById = new Map(state.workflows.map((w) => [w.id, w]));
  const taskById = new Map(state.tasks.map((t) => [t.id, t]));
  const projectById = new Map(state.projects.map((p) => [p.id, p]));
  const runByExecutionId = new Map(state.workflowRuns.map((r) => [r.executionId, r]));
  const executionById = new Map(state.executions.map((e) => [e.id, e]));

  const approvalByExecutionId = new Map<string, Approval>();
  for (const approval of state.approvals) {
    if (approval.executionId && !approvalByExecutionId.has(approval.executionId)) {
      approvalByExecutionId.set(approval.executionId, approval);
    }
  }

  // ---- Executive Orchestrator ------------------------------------------------
  const inReview = state.workflowRuns.filter(
    (r) => r.stage === "founder_request_received" || r.stage === "executive_review",
  ).length;
  const awaitingFounder = state.workflowRuns.filter(
    (r) => r.stage === "founder_approval_required",
  ).length;
  const failed = state.workflowRuns.filter((r) => r.stage === "failed").length;
  const decided = state.workflowRuns.filter(
    (r) => r.decision !== null || r.stage === "completed",
  ).length;

  const executive: ExecutiveSummary = {
    status: executiveStatus({
      failed,
      awaitingFounder,
      inReview,
      runsTotal: state.workflowRuns.length,
    }),
    runsTotal: state.workflowRuns.length,
    inReview,
    awaitingFounder,
    decided,
    failed,
    runningExecutions: state.executions.filter((e) => e.status === "running").length,
    queuedExecutions: state.executions.filter((e) => e.status === "queued").length,
    dispatchedRuns: state.workflowRuns.filter((r) => r.triggerRunId !== null).length,
    lastActivityAt: latestTimestamp(state.workflowRuns.map((r) => r.updatedAt)),
    latestReviewSummary:
      state.workflowRuns.find((r) => r.reviewSummary !== null)?.reviewSummary ?? null,
  };

  // ---- Project hierarchy -----------------------------------------------------
  const projects: ProjectNode[] = state.projects.map((project) => {
    const tasks = state.tasks.filter((t) => t.projectId === project.id);
    const taskIds = new Set(tasks.map((t) => t.id));
    const executions = state.executions.filter((e) => taskIds.has(e.taskId));
    const executionIds = new Set(executions.map((e) => e.id));
    const approvals = state.approvals.filter((a) => taskIds.has(a.taskId));
    const approvalIds = new Set(approvals.map((a) => a.id));
    const runs = state.workflowRuns.filter((r) => r.projectId === project.id);

    // Events reference whichever entity they describe, so match against every
    // id that belongs to this project.
    const ownedIds = new Set<string>([
      project.id,
      ...taskIds,
      ...executionIds,
      ...approvalIds,
    ]);
    const events = state.events.filter((e) => ownedIds.has(e.entityId));

    const primaryRun = runs.length > 0 ? runs[0] : null;
    const workflow = primaryRun
      ? workflowById.get(primaryRun.workflowId) ?? null
      : workflowById.get(tasks.find((t) => t.workflowId)?.workflowId ?? "") ?? null;

    const stageProgress = primaryRun ? buildStageProgress(primaryRun, workflow) : null;
    const pendingApprovals = approvals.filter((a) => a.status === "pending");

    const headline: StatusToken = stageProgress
      ? stageProgress.status
      : {
          label: `Project ${project.status.replace(/_/g, " ")}`,
          color: COLORS.idle,
        };

    const needsAttention =
      pendingApprovals.length > 0 ||
      runs.some((r) => r.stage === "failed") ||
      tasks.some((t) => t.status === "blocked" || t.status === "needs_revision");

    return {
      project,
      workflow,
      tasks,
      executions,
      approvals,
      runs,
      events,
      primaryRun,
      stageProgress,
      pendingApprovals,
      assignedAgentIds: uniqueStrings([
        ...tasks.map((t) => t.assigneeAgentId),
        ...executions.map((e) => e.agentId),
      ]),
      orchestratingAgentIds: uniqueStrings(approvals.map((a) => a.requestedByAgentId)),
      needsAttention,
      headline,
    };
  });

  // ---- Shared work management layer ----------------------------------------
  const failedTaskIds = new Set(
    state.workflowRuns.filter((r) => r.stage === "failed").map((r) => r.taskId),
  );
  const awaitingApprovalTaskIds = new Set(
    state.workflowRuns
      .filter((r) => r.stage === "founder_approval_required")
      .map((r) => r.taskId),
  );

  const byStatus = (status: Task["status"]) =>
    state.tasks.filter((t) => t.status === status && !failedTaskIds.has(t.id));

  const buckets: WorkBucket[] = [
    {
      id: "awaiting-approval",
      label: "Awaiting approval",
      description: "Paused on a founder decision gate.",
      color: COLORS.wait,
      tasks: state.tasks.filter((t) => awaitingApprovalTaskIds.has(t.id)),
    },
    {
      id: "in-progress",
      label: "In progress",
      description: "Claimed by the workflow and running.",
      color: COLORS.run,
      tasks: byStatus("active").filter((t) => !awaitingApprovalTaskIds.has(t.id)),
    },
    {
      id: "blocked",
      label: "Blocked",
      description: "Cannot proceed without intervention.",
      color: COLORS.err,
      tasks: byStatus("blocked"),
    },
    {
      id: "paused",
      label: "Paused",
      description: "Deliberately held.",
      color: COLORS.warn,
      tasks: byStatus("paused"),
    },
    {
      id: "needs-revision",
      label: "Needs revision",
      description: "Rejected by validation. Revise and resubmit.",
      color: COLORS.warn,
      tasks: byStatus("needs_revision"),
    },
    {
      id: "failed",
      label: "Technical failure",
      description: "Workflow errored. Stage at failure is not recorded.",
      color: COLORS.err,
      tasks: state.tasks.filter((t) => failedTaskIds.has(t.id)),
    },
    {
      id: "rejected",
      label: "Rejected",
      description: "Declined by the founder.",
      color: COLORS.err,
      tasks: byStatus("rejected"),
    },
    {
      id: "completed",
      label: "Completed",
      description: "Approved and closed.",
      color: COLORS.ok,
      tasks: byStatus("completed"),
    },
    {
      id: "draft",
      label: "Draft",
      description: "Created but not yet started.",
      color: COLORS.idle,
      tasks: byStatus("draft"),
    },
  ];

  const attentionCount = buckets
    .filter((b) => ["awaiting-approval", "blocked", "failed", "needs-revision"].includes(b.id))
    .reduce((sum, b) => sum + b.tasks.length, 0);

  // ---- Approvals -----------------------------------------------------------
  const approvals: ApprovalItem[] = state.approvals
    .filter((a) => a.status === "pending")
    .map((approval) => {
      const task = taskById.get(approval.taskId) ?? null;
      const run = approval.executionId
        ? runByExecutionId.get(approval.executionId) ?? null
        : null;
      return {
        approval,
        task,
        project: task ? projectById.get(task.projectId) ?? null : null,
        run,
        actionable:
          run?.stage === "founder_approval_required"
            ? !approval.decision || approval.continuation !== "confirmed"
            : run?.stage === "failed" &&
              Boolean(approval.decision) &&
              approval.continuation === "confirmed",
      };
    });

  // ---- Audit trail ---------------------------------------------------------
  const auditRecords: AuditRecord[] = state.workflowRuns.map((run) => {
    const task = taskById.get(run.taskId) ?? null;
    return {
      executionId: run.executionId,
      taskId: run.taskId,
      taskTitle: task?.title ?? null,
      projectName: projectById.get(run.projectId)?.name ?? null,
      stage: run.stage,
      status: WORKFLOW_STAGE[run.stage],
      reviewSummary: run.reviewSummary,
      decision: run.decision,
      continuation: run.continuation,
      continuationDetail: run.continuationDetail,
      rejectionKind: run.rejectionKind,
      triggerRunId: run.triggerRunId,
      continuationRunId: run.continuationRunId,
      execution: executionById.get(run.executionId) ?? null,
      approval: approvalByExecutionId.get(run.executionId) ?? null,
      updatedAt: run.updatedAt,
    };
  });

  // ---- Participants actually recorded in state -----------------------------
  const participantRoles = new Map<string, Set<string>>();
  const addRole = (id: string | null | undefined, role: string) => {
    if (!id) return;
    const roles = participantRoles.get(id) ?? new Set<string>();
    roles.add(role);
    participantRoles.set(id, roles);
  };

  for (const project of state.projects) addRole(project.ownerId, "Project owner");
  for (const task of state.tasks) addRole(task.assigneeAgentId, "Task assignee");
  for (const execution of state.executions) addRole(execution.agentId, "Execution runner");
  for (const approval of state.approvals) {
    addRole(approval.requestedByAgentId, "Requests approvals");
    addRole(approval.decidedByUserId, "Approval authority");
  }
  for (const event of state.events) addRole(event.actorId, "Logs activity");

  const participants: Participant[] = [...participantRoles.entries()]
    .map(([id, roles]) => {
      const actorEvents = state.events.filter((e) => e.actorId === id);
      return {
        id,
        label: actorEvents[0]?.actorLabel ?? actorName(id),
        roles: [...roles],
        eventCount: actorEvents.length,
        lastActiveAt: latestTimestamp(actorEvents.map((e) => e.timestamp)),
      };
    })
    .sort((a, b) => b.eventCount - a.eventCount);

  return {
    executive,
    projects,
    buckets,
    attentionCount,
    approvals,
    auditRecords,
    participants,
    counts: {
      projects: state.projects.length,
      activeProjects: state.projects.filter((p) => p.status === "active").length,
      tasks: state.tasks.length,
      executions: state.executions.length,
      runs: state.workflowRuns.length,
      events: state.events.length,
      pendingApprovals: approvals.length,
    },
  };
}
