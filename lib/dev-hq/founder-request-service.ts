import { tasks } from "@trigger.dev/sdk";
import {
  EXECUTIVE_ORCHESTRATOR_AGENT_ID,
  FOUNDER_REQUEST_WORKFLOW_ID,
  FOUNDER_USER_ID,
  TASK_STATUS_REFUSED_EVENT_TYPE,
} from "@/lib/dev-hq/constants";
import { getDevHqAdapters } from "@/lib/dev-hq/adapters";
// The one predicate the two Task.status orchestrators share (ARCH-02). Imported
// statically and by name so the coordination between them is greppable rather
// than implied; the dependency is one-way — the escalation service knows nothing
// about this one.
import { hasOpenEscalationForTask } from "@/lib/dev-hq/escalation-service";
import { nowIso, slugify } from "@/lib/dev-hq/id";
import type { DevHqState } from "@/lib/dev-hq/types";
import type {
  Approval,
  ContinuationState,
  Execution,
  FounderRequestInput,
  Project,
  Task,
  WorkflowDecision,
  WorkflowRejectionKind,
  WorkflowRunRecord,
} from "@/types/domain";

/** Run 1: carries the request to the approval gate and ends. */
const FOUNDER_REQUEST_TASK_ID = "founder-request-workflow";
/** Run 2: started by the founder's decision. */
const FOUNDER_REQUEST_CONTINUATION_TASK_ID = "founder-request-continuation";

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

  const handle = await tasks.trigger(FOUNDER_REQUEST_TASK_ID, {
    executionId: execution.id,
    taskId: task.id,
    projectId: project.id,
  });

  const triggerRunId = handle.id;
  await workflowEngine.markExecutionRunning(execution.id, {
    at: timestamp,
    triggerRunId,
  });
  // Execution.triggerRunId is owned by the workflow engine and the run record's
  // by the repository — two single-valued fields on two different records. The
  // engine's write is recorded here so both land in one ordered history instead
  // of each record forgetting independently. The repository records its own.
  await workflowRunRepository.appendRunLineage(execution.id, {
    runId: triggerRunId,
    role: "initial",
    record: "execution",
    at: timestamp,
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

/**
 * Opens the founder decision gate. Run 1 calls this and then ends.
 *
 * There is no token to attach. The gate is now a stage on the run record and a
 * pending approval — both readable, neither holding exclusive authority to
 * resume anything.
 */
export async function registerApprovalGate(input: {
  executionId: string;
  approvalId: string;
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

  if (isWorkflowCompleted(run)) {
    return approval;
  }

  // This path used to return early when a *different* wait token was already
  // attached, to protect the first token's exclusive right to resume the run.
  // That premise is gone with the token: nothing now holds an exclusive right to
  // resume, so there is nothing for a second registration to steal. Re-opening an
  // already-open gate is simply idempotent — the stage is already correct, and
  // the dedupe key keeps the timeline to one entry per approval.
  await workflowRunRepository.updateRun(input.executionId, {
    stage: "founder_approval_required",
  });

  await eventLogger.log({
    type: "approval.requested",
    entityType: "approval",
    entityId: approval.id,
    message: `Founder approval required for ${approval.title}.`,
    actorId: EXECUTIVE_ORCHESTRATOR_AGENT_ID,
    actorLabel: "Executive Orchestrator",
    dedupeKey: `approval-requested-${approval.id}`,
  });

  return approval;
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

  // Two convergences run here, in opposite directions. Both exist because the
  // approval record and the durable run are written by different processes, and
  // either one can be the side that got through.
  //
  // Forward — the workflow advanced, so an approval still carrying no decision is
  // converged onto the decision the workflow acted on. In the normal flow the
  // founder's decision is already recorded and this is a no-op.
  //
  // Inverse — the approval already carries the decision but records no confirmed
  // continuation, because the trigger call told us nothing. Executing this
  // function *is* the confirmation: the continuation ran, or nothing would be
  // finalising. So the continuation converges to confirmed here and only here,
  // this being the sole point at which the workflow has been observed to advance
  // rather than merely reported to have been asked to.
  //
  // Validation rejections pass no approvalId and are unaffected by either.
  if (input.approvalId) {
    await approvalManager.recordDecisionIntent({
      approvalId: input.approvalId,
      decision: input.decision,
    });
    await approvalManager.recordContinuation({
      approvalId: input.approvalId,
      continuation: "confirmed",
    });
    await approvalManager.decidePendingApproval({
      approvalId: input.approvalId,
      decidedByUserId: FOUNDER_USER_ID,
      status: input.decision,
      at: timestamp,
    });
  }

  // ARCH-02. This flow and the escalation lifecycle both write `Task.status`,
  // and this site used to write it unconditionally from a reading taken several
  // awaits earlier — so the later writer simply overwrote the earlier one's
  // decision. That is how an escalation could sit open on a task this flow had
  // already marked `completed`: a founder decision outstanding on work the board
  // reported finished.
  //
  // Both conditions are evaluated by the repository in the same synchronous step
  // as the write:
  //   - the task must still hold the status it was observed with, so a
  //     transition that landed in the gap refuses this write instead of being
  //     silently overwritten by it;
  //   - no unresolved escalation may hold the task. An open escalation means the
  //     founder still owes a decision here, and the escalation lifecycle owns
  //     the status until they give it. Whichever of the two flows runs second
  //     now observes the other and yields, so the pair converges either way
  //     round instead of depending on who wrote last.
  //
  // The conditional writer stamps its own `updatedAt`; this write no longer
  // shares `timestamp` with the rest of the finalization. Nothing reads that
  // correspondence, and giving it up is what buys the guarantee above.
  const taskOutcome = taskStatusForOutcome(input.decision, rejectionKind);
  const appliedTaskStatus = await taskRepository.updateTaskStatusIf(
    task.id,
    taskOutcome,
    (current) =>
      current.status === task.status && !hasOpenEscalationForTask(task.id),
  );
  if (!appliedTaskStatus) {
    // The workflow still finalizes — it did complete — but the task deliberately
    // keeps someone else's status, and that divergence goes on the timeline
    // rather than being inferred later from two records that disagree.
    const current = await taskRepository.getTask(task.id);
    await eventLogger.log({
      type: TASK_STATUS_REFUSED_EVENT_TYPE,
      entityType: "task",
      entityId: task.id,
      message:
        `Workflow ${input.executionId} finalized as ${input.decision} but did not set task ` +
        `${task.id} to "${taskOutcome}": the task now reads "${current?.status ?? "missing"}"` +
        `${
          hasOpenEscalationForTask(task.id)
            ? " and an unresolved founder escalation holds it"
            : " after another transition landed first"
        }. The other decision stands.`,
      actorId: null,
      actorLabel: "System",
      // One entry per (execution, intended outcome): a replay of the same
      // finalization is the same refusal, not a second one.
      dedupeKey: `${TASK_STATUS_REFUSED_EVENT_TYPE}:${input.executionId}:${taskOutcome}`,
    });
  }

  await workflowEngine.markExecutionSucceeded(input.executionId, {
    at: timestamp,
  });

  await workflowRunRepository.updateRun(
    input.executionId,
    {
      stage: penultimateStage,
      decision: input.decision,
      // Same inverse convergence on the run record: reaching this point is the
      // observation that the continuation ran.
      continuation: "confirmed",
      continuationDetail: run.continuationDetail
        ? `${run.continuationDetail} Recovery confirmed: the workflow advanced and finalised.`
        : null,
      rejectionKind,
      reviewSummary: run.reviewSummary,
    },
    { at: timestamp },
  );

  if (input.approvalId) {
    // A confirmed effect, not an assumed one: this event exists only because the
    // workflow advanced far enough to finalise. The equivalent statement at
    // decision time asserts an attempt instead.
    await eventLogger.log({
      type:
        input.decision === "approved" ? "approval.approved" : "approval.rejected",
      entityType: "approval",
      entityId: input.approvalId,
      message:
        input.decision === "approved"
          ? `Evan's approval of "${task.title}" took effect: the workflow advanced and finalised.`
          : `Evan's rejection of "${task.title}" took effect: the workflow advanced and finalised.`,
      actorId: FOUNDER_USER_ID,
      actorLabel: "Evan",
      dedupeKey: `approval-${input.decision}-${input.approvalId}`,
    });
  }

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
  continuationFailure?: {
    approvalId: string;
    decision: WorkflowDecision;
  },
): Promise<WorkflowRunRecord> {
  const { workflowEngine, workflowRunRepository, approvalManager, eventLogger } =
    getDevHqAdapters();
  const run = await workflowRunRepository.getRun(executionId);
  if (!run) {
    throw new Error(`Workflow run not found: ${executionId}`);
  }
  if (isWorkflowCompleted(run)) {
    return run;
  }

  let failureMessage = message;
  if (continuationFailure) {
    const approval = await approvalManager.getApproval(
      continuationFailure.approvalId,
    );
    if (!approval) {
      throw new Error(`Approval not found: ${continuationFailure.approvalId}`);
    }
    if (approval.executionId !== executionId) {
      throw new Error(
        `Approval ${approval.id} is not attached to execution ${executionId}`,
      );
    }
    if (approval.decision !== continuationFailure.decision) {
      throw new Error(
        `Continuation failure decision ${continuationFailure.decision} does not match recorded decision ${approval.decision ?? "none"}`,
      );
    }

    // Reaching this callback proves that the continuation started, even if its
    // trigger response raced the worker and had not yet updated this field.
    await approvalManager.recordContinuation({
      approvalId: approval.id,
      continuation: "confirmed",
    });
    failureMessage = `Continuation for the recorded ${continuationFailure.decision} decision started, exhausted its retries, and failed: ${message}. The same decision may be retried.`;
  }

  const timestamp = nowIso();
  await workflowEngine.markExecutionFailed(executionId, { at: timestamp });

  await eventLogger.log({
    type: "workflow.failed",
    entityType: "execution",
    entityId: executionId,
    message: failureMessage,
    actorId: null,
    actorLabel: "System",
  });

  return workflowRunRepository.updateRun(
    executionId,
    {
      stage: "failed",
      decision: continuationFailure?.decision ?? null,
      continuation: continuationFailure ? "confirmed" : run.continuation,
      continuationDetail: continuationFailure
        ? failureMessage
        : run.continuationDetail,
      rejectionKind: null,
    },
    { at: timestamp },
  );
}

/** What a continuation attempt established, which is not the same as what it returned. */
interface ContinuationAttempt {
  continuation: ContinuationState;
  runId: string | null;
  detail: string | null;
}

function describeThrown(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Classifies what the provider told us about the continuation run.
 *
 * "Success" means the workflow advanced. It never means a provider call returned
 * without throwing — that conflation is the whole defect this package exists to
 * remove, and it is why the only path to `confirmed` here is an actual run id.
 *
 * `failed` requires the provider to have said so in the shape of its own result.
 * Today's SDK signals dispatch errors by throwing, so `failed` is reached only by
 * a provider that returns a typed failure; that is deliberate, because the state
 * means "we know it did not start", and a throw does not establish that.
 */
function classifyContinuationResult(result: unknown): ContinuationAttempt {
  if (result && typeof result === "object") {
    const shape = result as { id?: unknown; ok?: unknown; error?: unknown };
    if (shape.ok === false) {
      return {
        continuation: "failed",
        runId: null,
        detail:
          typeof shape.error === "string"
            ? shape.error
            : "The continuation trigger returned a typed failure.",
      };
    }
    if (typeof shape.id === "string" && shape.id.length > 0) {
      return { continuation: "confirmed", runId: shape.id, detail: null };
    }
  }
  return {
    continuation: "unconfirmed",
    runId: null,
    detail:
      "The continuation trigger returned no run id, so no run is confirmed started.",
  };
}

/**
 * Starts the run that carries the founder's decision forward.
 *
 * Keyed on the execution, so a duplicate decision, a retry of an unconfirmed one,
 * and two tabs racing all resolve to the same continuation instead of starting a
 * second one.
 */
async function attemptContinuation(input: {
  executionId: string;
  approvalId: string;
  decision: WorkflowDecision;
  retryOrdinal?: number;
}): Promise<ContinuationAttempt> {
  try {
    const idempotencyKey =
      input.retryOrdinal === undefined
        ? `founder-continuation-${input.executionId}`
        : `founder-continuation-${input.executionId}-retry-${input.retryOrdinal}`;
    const handle = await tasks.trigger(
      FOUNDER_REQUEST_CONTINUATION_TASK_ID,
      {
        executionId: input.executionId,
        approvalId: input.approvalId,
        decision: input.decision,
      },
      { idempotencyKey },
    );
    return classifyContinuationResult(handle as unknown);
  } catch (error) {
    // A throw is not a typed failure. The call did not come back, so whether a
    // run started is unknown — which is `unconfirmed`, not `failed`. Claiming
    // `failed` here would assert knowledge we do not have.
    return {
      continuation: "unconfirmed",
      runId: null,
      detail: describeThrown(error),
    };
  }
}

/** Timeline wording per outcome. Each asserts an attempt or a confirmed start, never an effect. */
function continuationMessage(
  attempt: ContinuationAttempt,
  decision: WorkflowDecision,
  title: string,
): string {
  const choice = `Evan recorded a ${decision} decision for ${title}.`;
  if (attempt.continuation === "confirmed") {
    return `${choice} Continuation run ${attempt.runId} confirmed started.`;
  }
  if (attempt.continuation === "failed") {
    return `${choice} The continuation did not start: ${attempt.detail}`;
  }
  return `${choice} The continuation is unconfirmed and the workflow is not known to have advanced: ${attempt.detail}`;
}

/**
 * Records the founder's decision, then attempts the continuation, then records
 * what the attempt established — in that order.
 *
 * The ordering is inverted from the wait-token design, which completed the token
 * first so that a throw would leave the approval pending. That protection only
 * ever engaged on a throw, and the empirically established failure returns
 * success without throwing, so it did not cover the case that mattered. The
 * concern it was reaching for — a decided approval whose workflow never
 * advances — is answered by the continuation field instead: such an approval is
 * representable, visible, and retryable rather than prevented by an ordering that
 * could not prevent it.
 *
 * Note "recorded", not "recorded durably". Under the ratified P-A posture nothing
 * here is durable; this is the authority that exists for the current process
 * lifetime, and the record says only what it can support.
 *
 * This is also the replay path. An approval whose decision is recorded but whose
 * continuation is not confirmed is exactly the case the removed
 * `replayDecisionToken` existed for, and it is handled here rather than in a
 * parallel branch that could drift from this one.
 */
async function decideFounderRequest(
  approvalId: string,
  decision: WorkflowDecision,
): Promise<DevHqState> {
  const {
    approvalManager,
    workflowEngine,
    workflowRunRepository,
    eventLogger,
    stateReader,
  } = getDevHqAdapters();
  const approval = await approvalManager.getApproval(approvalId);
  if (!approval) {
    throw new Error(`Approval not found: ${approvalId}`);
  }

  if (!approval.executionId) {
    throw new Error(`Approval is not attached to an execution: ${approvalId}`);
  }
  const run = await workflowRunRepository.getRun(approval.executionId);
  if (!run) {
    throw new Error(`Workflow run not found: ${approval.executionId}`);
  }

  // A conflicting decision. The recorded one stands: it is the decision the
  // continuation was started for, and overwriting it would leave the record
  // saying one thing while the run does another. Nothing is started, and the
  // approval never holds both.
  if (approval.decision && approval.decision !== decision) {
    await eventLogger.log({
      type: "approval.decision_conflicted",
      entityType: "approval",
      entityId: approvalId,
      message: `A ${decision} decision was submitted for ${approval.title}, which already carries a ${approval.decision} decision. The recorded decision stands and no second continuation was started.`,
      actorId: FOUNDER_USER_ID,
      actorLabel: "Evan",
      dedupeKey: `approval-conflict-${approvalId}-${decision}`,
    });
    return stateReader.getState();
  }

  // A confirmed run normally makes repeats no-ops. A terminally failed run is
  // different: it did start, so `confirmed` remains truthful, but its failed
  // stage explicitly opens one same-decision recovery generation.
  const retryingTerminalFailure =
    approval.decision === decision &&
    approval.continuation === "confirmed" &&
    run.stage === "failed";
  if (
    approval.decision === decision &&
    approval.continuation === "confirmed" &&
    !retryingTerminalFailure
  ) {
    return stateReader.getState();
  }

  if (!approval.decision) {
    const recorded = await approvalManager.recordDecisionIntent({
      approvalId,
      decision,
    });
    // Refused: another caller recorded a decision between this read and this
    // write. Whatever they recorded is authoritative, so nothing is started here.
    if (!recorded) {
      return stateReader.getState();
    }
  }

  const priorFailureDetail = retryingTerminalFailure
    ? run.continuationDetail
    : null;
  const retryOrdinal = retryingTerminalFailure
    ? Math.max(
        1,
        run.runLineage.filter(
          (entry) =>
            entry.role === "continuation" &&
            entry.record === "workflow_run",
        ).length,
      )
    : undefined;
  const attempt = await attemptContinuation({
    executionId: approval.executionId,
    approvalId,
    decision,
    retryOrdinal,
  });
  const continuationDetail = retryingTerminalFailure
    ? `${priorFailureDetail ?? "The prior continuation failed after it started."} ${
        attempt.continuation === "confirmed"
          ? `Same-decision retry run ${attempt.runId} confirmed started.`
          : `Same-decision retry is ${attempt.continuation}: ${attempt.detail}`
      }`
    : attempt.detail;

  await approvalManager.recordContinuation({
    approvalId,
    continuation: attempt.continuation,
  });
  await workflowRunRepository.updateRun(approval.executionId, {
    ...(retryingTerminalFailure
      ? {
          stage: "founder_approval_required" as const,
          decision,
        }
      : {}),
    continuation: attempt.continuation,
    continuationDetail,
    ...(attempt.runId ? { continuationRunId: attempt.runId } : {}),
  });

  // A confirmed same-decision retry means work is running again. Leave the
  // Execution failed only when the retry did not establish a started run.
  if (retryingTerminalFailure && attempt.continuation === "confirmed") {
    await workflowEngine.markExecutionRunning(approval.executionId);
  }

  await eventLogger.log({
    type: "approval.decision_recorded",
    entityType: "approval",
    entityId: approvalId,
    message: continuationMessage(attempt, decision, approval.title),
    actorId: FOUNDER_USER_ID,
    actorLabel: "Evan",
  });

  return stateReader.getState();
}

export async function approveFounderRequest(approvalId: string): Promise<DevHqState> {
  return decideFounderRequest(approvalId, "approved");
}

export async function rejectFounderRequest(approvalId: string): Promise<DevHqState> {
  return decideFounderRequest(approvalId, "rejected");
}

export async function getDevHqStateSnapshot(): Promise<DevHqState> {
  return getDevHqAdapters().stateReader.getState();
}
