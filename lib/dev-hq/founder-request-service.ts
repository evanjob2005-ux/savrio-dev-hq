import { tasks, wait } from "@trigger.dev/sdk";
import {
  DEV_HQ_ACTORS,
  buildDevHqState,
  getDevHqStore,
  getWorkflowRun,
  saveApproval,
  saveExecution,
  saveProject,
  saveTask,
  upsertWorkflowRun,
} from "@/lib/dev-hq/store";
import {
  EXECUTIVE_ORCHESTRATOR_AGENT_ID,
  FOUNDER_REQUEST_WORKFLOW_ID,
  FOUNDER_USER_ID,
} from "@/lib/dev-hq/constants";
import { getDevHqAdapters } from "@/lib/dev-hq/adapters";
import { nextId, nowIso, slugify } from "@/lib/dev-hq/id";
import type { DevHqState } from "@/lib/dev-hq/types";
import type {
  Approval,
  Execution,
  FounderRequestInput,
  Project,
  Task,
  WorkflowRejectionKind,
  WorkflowRunRecord,
} from "@/types/domain";

function deterministicExecutiveReview(task: Task): {
  passed: boolean;
  summary: string;
} {
  const titleOk = task.title.trim().length >= 3;
  const descriptionOk = task.description.trim().length >= 10;
  if (titleOk && descriptionOk) {
    return {
      passed: true,
      summary:
        "Executive review passed. Scope is clear and ready for founder approval.",
    };
  }
  return {
    passed: false,
    summary:
      "Validation failed: request requires a title (3+ chars) and description (10+ chars). Revise and resubmit.",
  };
}

function isWorkflowCompleted(run: WorkflowRunRecord): boolean {
  return run.stage === "completed" || run.stage === "failed";
}

function updateWorkflowRun(
  executionId: string,
  patch: Partial<WorkflowRunRecord>,
): WorkflowRunRecord {
  const current = getWorkflowRun(executionId);
  if (!current) {
    throw new Error(`Workflow run not found: ${executionId}`);
  }
  return upsertWorkflowRun({
    ...current,
    ...patch,
    updatedAt: nowIso(),
  });
}

function taskStatusForOutcome(
  decision: "approved" | "rejected",
  rejectionKind: WorkflowRejectionKind | null,
): Task["status"] {
  if (decision === "approved") return "completed";
  if (rejectionKind === "validation") return "needs_revision";
  return "rejected";
}

function terminalStageForOutcome(
  decision: "approved" | "rejected",
  rejectionKind: WorkflowRejectionKind | null,
): WorkflowRunRecord["stage"] {
  if (decision === "approved") return "approved";
  if (rejectionKind === "validation") return "validation_rejected";
  return "rejected";
}

function workflowCompletedMessage(
  decision: "approved" | "rejected",
  rejectionKind: WorkflowRejectionKind | null,
  taskTitle: string,
): string {
  if (decision === "approved") {
    return `Workflow completed: founder approved "${taskTitle}".`;
  }
  if (rejectionKind === "validation") {
    return `Workflow completed: validation rejected "${taskTitle}" (needs revision).`;
  }
  return `Workflow completed: founder rejected "${taskTitle}".`;
}

export async function createFounderRequest(
  input: FounderRequestInput,
): Promise<{
  project: Project;
  task: Task;
  execution: Execution;
  triggerRunId: string;
}> {
  const { taskRepository, workflowEngine, eventLogger } = getDevHqAdapters();
  const timestamp = nowIso();
  const slug = slugify(input.title) || "founder-request";

  const project: Project = {
    id: nextId("proj"),
    name: input.title.trim(),
    slug,
    description: input.description.trim(),
    repository: "savrio/dev-hq",
    defaultBranch: "main",
    status: "active",
    ownerId: FOUNDER_USER_ID,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  saveProject(project);

  const task = await taskRepository.createTask({
    projectId: project.id,
    workflowId: FOUNDER_REQUEST_WORKFLOW_ID,
    title: input.title.trim(),
    description: input.description.trim(),
    priority: input.priority,
  });

  const execution = await workflowEngine.startWorkflow({
    workflowId: FOUNDER_REQUEST_WORKFLOW_ID,
    taskId: task.id,
  });

  await eventLogger.log({
    type: "founder_request.created",
    entityType: "task",
    entityId: task.id,
    message: `Founder request submitted: ${task.title}`,
    actorId: FOUNDER_USER_ID,
    actorLabel: "Evan",
  });

  const handle = await tasks.trigger("founder-request-workflow", {
    executionId: execution.id,
    taskId: task.id,
    projectId: project.id,
  });

  const triggerRunId = handle.id;
  saveExecution({ ...execution, triggerRunId, status: "running", startedAt: timestamp });
  updateWorkflowRun(execution.id, {
    triggerRunId,
    stage: "founder_request_received",
    rejectionKind: null,
    decision: null,
  });

  return {
    project,
    task: (await taskRepository.getTask(task.id)) ?? task,
    execution: (await workflowEngine.getExecution(execution.id)) ?? execution,
    triggerRunId,
  };
}

export async function runExecutiveReview(executionId: string): Promise<{
  passed: boolean;
  summary: string;
  approvalId: string | null;
  idempotent?: boolean;
}> {
  const { eventLogger } = getDevHqAdapters();
  const run = getWorkflowRun(executionId);
  if (!run) {
    throw new Error(`Workflow run not found: ${executionId}`);
  }

  if (isWorkflowCompleted(run)) {
    return {
      passed: run.decision === "approved",
      summary: run.reviewSummary ?? "Executive review already completed.",
      approvalId: null,
      idempotent: true,
    };
  }

  if (run.stage === "founder_approval_required") {
    const approval = [...getDevHqStore().approvals.values()].find(
      (a) => a.executionId === executionId && a.status === "pending",
    );
    return {
      passed: true,
      summary: run.reviewSummary ?? "Executive review already passed.",
      approvalId: approval?.id ?? null,
      idempotent: true,
    };
  }

  if (run.stage === "validation_rejected") {
    return {
      passed: false,
      summary: run.reviewSummary ?? "Validation already rejected this request.",
      approvalId: null,
      idempotent: true,
    };
  }

  const task = getDevHqStore().tasks.get(run.taskId);
  if (!task) {
    throw new Error(`Task not found: ${run.taskId}`);
  }

  updateWorkflowRun(executionId, { stage: "executive_review" });
  saveExecution({
    ...(getDevHqStore().executions.get(executionId) as Execution),
    status: "running",
    startedAt: nowIso(),
  });

  const review = deterministicExecutiveReview(task);

  if (!review.passed) {
    await eventLogger.log({
      type: "executive_review.validation_failed",
      entityType: "execution",
      entityId: executionId,
      message: review.summary,
      actorId: EXECUTIVE_ORCHESTRATOR_AGENT_ID,
      actorLabel: "Executive Orchestrator",
    });

    await finalizeWorkflowOutcome({
      executionId,
      decision: "rejected",
      rejectionKind: "validation",
    });

    return { passed: false, summary: review.summary, approvalId: null };
  }

  await eventLogger.log({
    type: "executive_review.passed",
    entityType: "execution",
    entityId: executionId,
    message: review.summary,
    actorId: EXECUTIVE_ORCHESTRATOR_AGENT_ID,
    actorLabel: "Executive Orchestrator",
  });

  const approval: Approval = {
    id: nextId("appr"),
    taskId: task.id,
    executionId,
    title: `Founder approval - ${task.title}`,
    summary: review.summary,
    status: "pending",
    requestedByAgentId: EXECUTIVE_ORCHESTRATOR_AGENT_ID,
    decidedByUserId: null,
    requestedAt: nowIso(),
    decidedAt: null,
    waitTokenId: null,
  };
  saveApproval(approval);
  updateWorkflowRun(executionId, { reviewSummary: review.summary });

  return { passed: true, summary: review.summary, approvalId: approval.id };
}

export async function registerApprovalGate(input: {
  executionId: string;
  approvalId: string;
  waitTokenId: string;
}): Promise<Approval> {
  const { eventLogger } = getDevHqAdapters();
  const run = getWorkflowRun(input.executionId);
  if (!run) {
    throw new Error(`Workflow run not found: ${input.executionId}`);
  }

  const approval = getDevHqStore().approvals.get(input.approvalId);
  if (!approval) {
    throw new Error(`Approval not found: ${input.approvalId}`);
  }

  if (approval.waitTokenId === input.waitTokenId) {
    return approval;
  }

  if (isWorkflowCompleted(run)) {
    return approval;
  }

  if (approval.waitTokenId && approval.waitTokenId !== input.waitTokenId) {
    return approval;
  }

  const updated: Approval = {
    ...approval,
    waitTokenId: input.waitTokenId,
  };
  saveApproval(updated);
  updateWorkflowRun(input.executionId, {
    stage: "founder_approval_required",
    waitTokenId: input.waitTokenId,
  });

  await eventLogger.log({
    type: "approval.requested",
    entityType: "approval",
    entityId: updated.id,
    message: `Founder approval required for ${updated.title}.`,
    actorId: EXECUTIVE_ORCHESTRATOR_AGENT_ID,
    actorLabel: "Executive Orchestrator",
  });

  return updated;
}

export async function finalizeWorkflowOutcome(input: {
  executionId: string;
  decision: "approved" | "rejected";
  rejectionKind?: WorkflowRejectionKind | null;
  approvalId?: string;
}): Promise<WorkflowRunRecord> {
  const { eventLogger } = getDevHqAdapters();
  const run = getWorkflowRun(input.executionId);
  if (!run) {
    throw new Error(`Workflow run not found: ${input.executionId}`);
  }

  if (isWorkflowCompleted(run)) {
    return run;
  }

  const task = getDevHqStore().tasks.get(run.taskId);
  if (!task) {
    throw new Error(`Task not found: ${run.taskId}`);
  }

  const rejectionKind =
    input.decision === "rejected" ? (input.rejectionKind ?? "founder") : null;
  const timestamp = nowIso();
  const penultimateStage = terminalStageForOutcome(input.decision, rejectionKind);

  if (input.approvalId && rejectionKind === "founder") {
    const approval = getDevHqStore().approvals.get(input.approvalId);
    if (approval && approval.status === "pending") {
      saveApproval({
        ...approval,
        status: input.decision,
        decidedByUserId: FOUNDER_USER_ID,
        decidedAt: timestamp,
      });
    }
  }

  saveTask({
    ...task,
    status: taskStatusForOutcome(input.decision, rejectionKind),
    updatedAt: timestamp,
  });

  saveExecution({
    ...(getDevHqStore().executions.get(input.executionId) as Execution),
    status: "succeeded",
    completedAt: timestamp,
  });

  updateWorkflowRun(input.executionId, {
    stage: penultimateStage,
    decision: input.decision,
    rejectionKind,
    reviewSummary: run.reviewSummary,
  });

  if (input.decision === "approved") {
    await eventLogger.log({
      type: "founder_request.approved",
      entityType: "execution",
      entityId: input.executionId,
      message: `Founder approved request: ${task.title}`,
      actorId: FOUNDER_USER_ID,
      actorLabel: "Evan",
    });
  } else if (rejectionKind === "founder") {
    await eventLogger.log({
      type: "founder_request.rejected",
      entityType: "execution",
      entityId: input.executionId,
      message: `Founder rejected request: ${task.title}`,
      actorId: FOUNDER_USER_ID,
      actorLabel: "Evan",
    });
  }

  await eventLogger.log({
    type: "workflow.completed",
    entityType: "execution",
    entityId: input.executionId,
    message: workflowCompletedMessage(input.decision, rejectionKind, task.title),
    actorId: null,
    actorLabel: "System",
  });

  return updateWorkflowRun(input.executionId, { stage: "completed" });
}

/** Marks a workflow as technically failed (infrastructure/code errors only). */
export async function failWorkflowExecution(
  executionId: string,
  message: string,
): Promise<WorkflowRunRecord> {
  const { eventLogger } = getDevHqAdapters();
  const run = getWorkflowRun(executionId);
  if (!run) {
    throw new Error(`Workflow run not found: ${executionId}`);
  }
  if (isWorkflowCompleted(run)) {
    return run;
  }

  const timestamp = nowIso();
  saveExecution({
    ...(getDevHqStore().executions.get(executionId) as Execution),
    status: "failed",
    completedAt: timestamp,
  });

  await eventLogger.log({
    type: "workflow.failed",
    entityType: "execution",
    entityId: executionId,
    message,
    actorId: null,
    actorLabel: "System",
  });

  return updateWorkflowRun(executionId, {
    stage: "failed",
    decision: null,
    rejectionKind: null,
  });
}

export async function approveFounderRequest(approvalId: string): Promise<DevHqState> {
  const { approvalManager, eventLogger } = getDevHqAdapters();
  const approval = await approvalManager.getApproval(approvalId);
  if (!approval) {
    throw new Error(`Approval not found: ${approvalId}`);
  }

  if (approval.status === "approved") {
    return buildDevHqState();
  }
  if (approval.status === "rejected") {
    return buildDevHqState();
  }

  if (!approval.waitTokenId) {
    throw new Error(`Approval is missing wait token: ${approvalId}`);
  }

  await approvalManager.approve({
    approvalId,
    decidedByUserId: DEV_HQ_ACTORS.founderUserId,
  });

  await eventLogger.log({
    type: "approval.approved",
    entityType: "approval",
    entityId: approvalId,
    message: `Evan approved ${approval.title}.`,
    actorId: FOUNDER_USER_ID,
    actorLabel: "Evan",
  });

  await wait.completeToken<{ approved: boolean }>(approval.waitTokenId, {
    approved: true,
  });

  return buildDevHqState();
}

export async function rejectFounderRequest(approvalId: string): Promise<DevHqState> {
  const { approvalManager, eventLogger } = getDevHqAdapters();
  const approval = await approvalManager.getApproval(approvalId);
  if (!approval) {
    throw new Error(`Approval not found: ${approvalId}`);
  }

  if (approval.status === "rejected") {
    return buildDevHqState();
  }
  if (approval.status === "approved") {
    return buildDevHqState();
  }

  if (!approval.waitTokenId) {
    throw new Error(`Approval is missing wait token: ${approvalId}`);
  }

  await approvalManager.reject({
    approvalId,
    decidedByUserId: DEV_HQ_ACTORS.founderUserId,
  });

  await eventLogger.log({
    type: "approval.rejected",
    entityType: "approval",
    entityId: approvalId,
    message: `Evan rejected ${approval.title}.`,
    actorId: FOUNDER_USER_ID,
    actorLabel: "Evan",
  });

  await wait.completeToken<{ approved: boolean }>(approval.waitTokenId, {
    approved: false,
  });

  return buildDevHqState();
}

export function getDevHqStateSnapshot(): DevHqState {
  return buildDevHqState();
}
