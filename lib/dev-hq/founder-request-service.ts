import { tasks, wait } from "@trigger.dev/sdk";
import {
  DEV_HQ_ACTORS,
  EXECUTIVE_ORCHESTRATOR_AGENT_ID,
  FOUNDER_REQUEST_WORKFLOW_ID,
  FOUNDER_USER_ID,
} from "@/lib/dev-hq/constants";
import { getDevHqAdapters } from "@/lib/dev-hq/adapters";
import { nowIso, slugify } from "@/lib/dev-hq/id";
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
  const {
    projectRepository,
    taskRepository,
    workflowEngine,
    workflowRunRepository,
    eventLogger,
  } = getDevHqAdapters();
  const timestamp = nowIso();
  const slug = slugify(input.title) || "founder-request";

  const project = await projectRepository.createProject({
    name: input.title.trim(),
    slug,
    description: input.description.trim(),
    repository: "savrio/dev-hq",
    defaultBranch: "main",
    status: "active",
    ownerId: FOUNDER_USER_ID,
    at: timestamp,
  });

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
  await workflowEngine.markExecutionRunning(execution.id, {
    at: timestamp,
    triggerRunId,
  });
  await workflowRunRepository.updateRun(execution.id, {
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
  const {
    taskRepository,
    workflowEngine,
    workflowRunRepository,
    approvalManager,
    eventLogger,
  } = getDevHqAdapters();
  const run = await workflowRunRepository.getRun(executionId);
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
    const approval = await approvalManager.findPendingByExecution(executionId);
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

  // A retry can land here after an earlier attempt created the approval but
  // before the approval gate advanced the stage. Reuse that approval rather
  // than creating a second one that no wait token will ever be attached to.
  const priorApproval = await approvalManager.findPendingByExecution(executionId);
  if (priorApproval) {
    return {
      passed: true,
      summary: run.reviewSummary ?? priorApproval.summary,
      approvalId: priorApproval.id,
      idempotent: true,
    };
  }

  const task = await taskRepository.getTask(run.taskId);
  if (!task) {
    throw new Error(`Task not found: ${run.taskId}`);
  }

  await workflowRunRepository.updateRun(executionId, {
    stage: "executive_review",
  });
  await workflowEngine.markExecutionRunning(executionId);

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

  const approval = await approvalManager.createApproval({
    taskId: task.id,
    executionId,
    title: `Founder approval - ${task.title}`,
    summary: review.summary,
    requestedByAgentId: EXECUTIVE_ORCHESTRATOR_AGENT_ID,
  });
  await workflowRunRepository.updateRun(executionId, {
    reviewSummary: review.summary,
  });

  return { passed: true, summary: review.summary, approvalId: approval.id };
}

export async function registerApprovalGate(input: {
  executionId: string;
  approvalId: string;
  waitTokenId: string;
}): Promise<Approval> {
  const { approvalManager, workflowRunRepository, eventLogger } =
    getDevHqAdapters();
  const run = await workflowRunRepository.getRun(input.executionId);
  if (!run) {
    throw new Error(`Workflow run not found: ${input.executionId}`);
  }

  const approval = await approvalManager.getApproval(input.approvalId);
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

  const updated = await approvalManager.attachWaitToken(
    input.approvalId,
    input.waitTokenId,
  );
  await workflowRunRepository.updateRun(input.executionId, {
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
  const {
    taskRepository,
    workflowEngine,
    workflowRunRepository,
    approvalManager,
    eventLogger,
  } = getDevHqAdapters();
  const run = await workflowRunRepository.getRun(input.executionId);
  if (!run) {
    throw new Error(`Workflow run not found: ${input.executionId}`);
  }

  if (isWorkflowCompleted(run)) {
    return run;
  }

  const task = await taskRepository.getTask(run.taskId);
  if (!task) {
    throw new Error(`Task not found: ${run.taskId}`);
  }

  const rejectionKind =
    input.decision === "rejected" ? (input.rejectionKind ?? "founder") : null;
  const timestamp = nowIso();
  const penultimateStage = terminalStageForOutcome(input.decision, rejectionKind);

  // Converge the approval record on the decision the workflow acted on. In the
  // normal flow it is already decided and this is a no-op; it only takes effect
  // when the token was completed but the decision was not recorded. Validation
  // rejections pass no approvalId and are unaffected.
  if (input.approvalId) {
    await approvalManager.decidePendingApproval({
      approvalId: input.approvalId,
      decidedByUserId: FOUNDER_USER_ID,
      status: input.decision,
      at: timestamp,
    });
  }

  await taskRepository.updateTask(task.id, {
    status: taskStatusForOutcome(input.decision, rejectionKind),
    occurredAt: timestamp,
  });

  await workflowEngine.markExecutionSucceeded(input.executionId, {
    at: timestamp,
  });

  await workflowRunRepository.updateRun(
    input.executionId,
    {
      stage: penultimateStage,
      decision: input.decision,
      rejectionKind,
      reviewSummary: run.reviewSummary,
    },
    { at: timestamp },
  );

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

  return workflowRunRepository.updateRun(
    input.executionId,
    { stage: "completed" },
    { at: timestamp },
  );
}

/** Marks a workflow as technically failed (infrastructure/code errors only). */
export async function failWorkflowExecution(
  executionId: string,
  message: string,
): Promise<WorkflowRunRecord> {
  const { workflowEngine, workflowRunRepository, eventLogger } =
    getDevHqAdapters();
  const run = await workflowRunRepository.getRun(executionId);
  if (!run) {
    throw new Error(`Workflow run not found: ${executionId}`);
  }
  if (isWorkflowCompleted(run)) {
    return run;
  }

  const timestamp = nowIso();
  await workflowEngine.markExecutionFailed(executionId, { at: timestamp });

  await eventLogger.log({
    type: "workflow.failed",
    entityType: "execution",
    entityId: executionId,
    message,
    actorId: null,
    actorLabel: "System",
  });

  return workflowRunRepository.updateRun(
    executionId,
    {
      stage: "failed",
      decision: null,
      rejectionKind: null,
    },
    { at: timestamp },
  );
}

/**
 * Re-completes the wait token for an already-decided approval. A prior attempt
 * may have recorded the decision but failed before completing the token, which
 * would block the run until it times out. Completing an already-completed token
 * is a no-op, so replaying it is safe and always uses the recorded decision
 * rather than the one the caller asked for.
 */
async function replayDecisionToken(approval: Approval): Promise<void> {
  if (!approval.waitTokenId) return;
  await wait.completeToken<{ approved: boolean }>(approval.waitTokenId, {
    approved: approval.status === "approved",
  });
}

export async function approveFounderRequest(approvalId: string): Promise<DevHqState> {
  const { approvalManager, eventLogger, stateReader } = getDevHqAdapters();
  const approval = await approvalManager.getApproval(approvalId);
  if (!approval) {
    throw new Error(`Approval not found: ${approvalId}`);
  }

  if (approval.status === "approved" || approval.status === "rejected") {
    await replayDecisionToken(approval);
    return stateReader.getState();
  }

  if (!approval.waitTokenId) {
    throw new Error(`Approval is missing wait token: ${approvalId}`);
  }

  // Complete the token before recording the decision. If this throws, the
  // approval stays pending and the founder can retry; recording first would
  // leave a decided approval whose run never resumes.
  await wait.completeToken<{ approved: boolean }>(approval.waitTokenId, {
    approved: true,
  });

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

  return stateReader.getState();
}

export async function rejectFounderRequest(approvalId: string): Promise<DevHqState> {
  const { approvalManager, eventLogger, stateReader } = getDevHqAdapters();
  const approval = await approvalManager.getApproval(approvalId);
  if (!approval) {
    throw new Error(`Approval not found: ${approvalId}`);
  }

  if (approval.status === "rejected" || approval.status === "approved") {
    await replayDecisionToken(approval);
    return stateReader.getState();
  }

  if (!approval.waitTokenId) {
    throw new Error(`Approval is missing wait token: ${approvalId}`);
  }

  // Complete the token before recording the decision, for the same reason as
  // approveFounderRequest.
  await wait.completeToken<{ approved: boolean }>(approval.waitTokenId, {
    approved: false,
  });

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

  return stateReader.getState();
}

export async function getDevHqStateSnapshot(): Promise<DevHqState> {
  return getDevHqAdapters().stateReader.getState();
}
