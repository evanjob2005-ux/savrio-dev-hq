import { beforeEach, describe, expect, it, vi } from "vitest";

const { triggerMock } = vi.hoisted(() => ({
  triggerMock: vi.fn(
    async (...args: [string, unknown, { idempotencyKey?: string }?]) => ({
      id:
        args[0] === "founder-request-continuation"
          ? "run-continuation-1"
          : "run-test-1",
    }),
  ),
}));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: {
    trigger: triggerMock,
  },
}));

/** Continuation dispatches only, so the "exactly one" assertions are unambiguous. */
function continuationCalls() {
  return triggerMock.mock.calls.filter(
    (call) => call[0] === "founder-request-continuation",
  );
}

import { getDevHqAdapters, resetDevHqAdapters } from "@/lib/dev-hq/adapters";
import {
  approveFounderRequest,
  createFounderRequest,
  failWorkflowExecution,
  finalizeWorkflowOutcome,
  getDevHqStateSnapshot,
  registerApprovalGate,
  rejectFounderRequest,
  runExecutiveReview,
} from "@/lib/dev-hq/founder-request-service";
import { resetDevHqStore } from "@/lib/dev-hq/store";

async function seedPendingApproval(options?: {
  title?: string;
  description?: string;
}) {
  const created = await createFounderRequest({
    title: options?.title ?? "Ship Mission Control",
    description:
      options?.description ??
      "Deliver the founder request workflow with durable state.",
    priority: "High",
  });

  const review = await runExecutiveReview(created.execution.id);
  expect(review.passed).toBe(true);
  expect(review.approvalId).toBeTruthy();

  const approval = await registerApprovalGate({
    executionId: created.execution.id,
    approvalId: review.approvalId!,
  });

  return { created, review, approval };
}

describe("founder-request repository abstraction", () => {
  beforeEach(() => {
    resetDevHqStore();
    resetDevHqAdapters();
    triggerMock.mockClear();
  });

  it("creates a founder request through the repository adapters", async () => {
    const result = await createFounderRequest({
      title: "Ship Mission Control",
      description: "Deliver the founder request workflow with durable state.",
      priority: "High",
    });

    const adapters = getDevHqAdapters();
    const project = await adapters.projectRepository.getProject(result.project.id);
    const task = await adapters.taskRepository.getTask(result.task.id);
    const execution = await adapters.workflowEngine.getExecution(
      result.execution.id,
    );
    const run = await adapters.workflowRunRepository.getRun(result.execution.id);

    expect(project?.name).toBe("Ship Mission Control");
    expect(task?.status).toBe("active");
    expect(execution?.status).toBe("running");
    expect(execution?.triggerRunId).toBe("run-test-1");
    expect(run?.stage).toBe("founder_request_received");
    expect(run?.triggerRunId).toBe("run-test-1");
    expect(triggerMock).toHaveBeenCalledOnce();
  });

  it("finds and updates workflow runs", async () => {
    const { workflowRunRepository } = getDevHqAdapters();
    const created = await createFounderRequest({
      title: "Update run stage",
      description: "Exercise workflow run repository updates.",
      priority: "Medium",
    });

    const missing = await workflowRunRepository.getRun("exec-missing");
    expect(missing).toBeNull();

    await expect(
      workflowRunRepository.updateRun("exec-missing", {
        stage: "executive_review",
      }),
    ).rejects.toThrow("Workflow run not found: exec-missing");

    const updated = await workflowRunRepository.updateRun(created.execution.id, {
      stage: "executive_review",
      reviewSummary: "Moving into review",
    });

    expect(updated.stage).toBe("executive_review");
    expect(updated.reviewSummary).toBe("Moving into review");
    expect(await workflowRunRepository.getRun(created.execution.id)).toEqual(
      updated,
    );
  });

  it("creates and looks up pending approvals", async () => {
    const { approvalManager } = getDevHqAdapters();
    const created = await createFounderRequest({
      title: "Approval lookup",
      description: "Create and find a pending approval by execution.",
      priority: "Medium",
    });

    const review = await runExecutiveReview(created.execution.id);
    expect(review.approvalId).toBeTruthy();

    const byId = await approvalManager.getApproval(review.approvalId!);
    const pending = await approvalManager.findPendingByExecution(
      created.execution.id,
    );

    expect(byId?.status).toBe("pending");
    expect(pending?.id).toBe(review.approvalId);
    expect(await approvalManager.findPendingByExecution("exec-missing")).toBeNull();
  });

  it("approves a request and keeps repeated approvals safe", async () => {
    const { created, approval } = await seedPendingApproval();

    const first = await approveFounderRequest(approval.id);
    const afterFirst = first.approvals.find((item) => item.id === approval.id);
    // The decision is recorded and the continuation is confirmed started. The
    // approval is not complete yet: starting is not finishing.
    expect(afterFirst?.decision).toBe("approved");
    expect(afterFirst?.continuation).toBe("confirmed");
    expect(afterFirst?.status).toBe("pending");
    expect(continuationCalls()).toHaveLength(1);
    expect(continuationCalls()[0][1]).toMatchObject({
      executionId: created.execution.id,
      approvalId: approval.id,
      decision: "approved",
    });
    expect(continuationCalls()[0][2]).toMatchObject({
      idempotencyKey: `founder-continuation-${created.execution.id}`,
    });

    // A repeat starts nothing further.
    const second = await approveFounderRequest(approval.id);
    expect(
      second.approvals.find((item) => item.id === approval.id)?.decision,
    ).toBe("approved");
    expect(continuationCalls()).toHaveLength(1);

    // The continuation run finalises, which is what completes the approval.
    const finalized = await finalizeWorkflowOutcome({
      executionId: created.execution.id,
      decision: "approved",
      approvalId: approval.id,
    });
    expect(finalized.stage).toBe("completed");
    expect(finalized.decision).toBe("approved");
    expect(finalized.continuation).toBe("confirmed");

    const settled = await getDevHqStateSnapshot();
    expect(
      settled.approvals.find((item) => item.id === approval.id)?.status,
    ).toBe("approved");

    const again = await finalizeWorkflowOutcome({
      executionId: created.execution.id,
      decision: "approved",
      approvalId: approval.id,
    });
    expect(again).toEqual(finalized);
  });

  it("rejects a request and keeps repeated rejections safe", async () => {
    const { created, approval } = await seedPendingApproval({
      title: "Reject this request",
      description: "Founder decides not to proceed with this work.",
    });

    const first = await rejectFounderRequest(approval.id);
    const afterFirst = first.approvals.find((item) => item.id === approval.id);
    expect(afterFirst?.decision).toBe("rejected");
    expect(afterFirst?.continuation).toBe("confirmed");
    expect(afterFirst?.status).toBe("pending");
    expect(continuationCalls()).toHaveLength(1);
    expect(continuationCalls()[0][1]).toMatchObject({ decision: "rejected" });

    const second = await rejectFounderRequest(approval.id);
    expect(
      second.approvals.find((item) => item.id === approval.id)?.decision,
    ).toBe("rejected");
    expect(continuationCalls()).toHaveLength(1);

    const finalized = await finalizeWorkflowOutcome({
      executionId: created.execution.id,
      decision: "rejected",
      rejectionKind: "founder",
      approvalId: approval.id,
    });
    expect(finalized.stage).toBe("completed");
    expect(finalized.decision).toBe("rejected");
    expect(finalized.rejectionKind).toBe("founder");

    const settled = await getDevHqStateSnapshot();
    expect(
      settled.approvals.find((item) => item.id === approval.id)?.status,
    ).toBe("rejected");
  });

  it("reuses a pending approval when executive review is retried", async () => {
    const created = await createFounderRequest({
      title: "Idempotent review",
      description: "Retrying executive review must not create a second approval.",
      priority: "High",
    });

    const first = await runExecutiveReview(created.execution.id);
    const second = await runExecutiveReview(created.execution.id);

    expect(first.idempotent).toBeUndefined();
    expect(second.idempotent).toBe(true);
    expect(second.approvalId).toBe(first.approvalId);

    const pending = await getDevHqAdapters().approvalManager.listPending();
    expect(pending).toHaveLength(1);
  });

  it("produces clear errors for missing records", async () => {
    await expect(runExecutiveReview("exec-missing")).rejects.toThrow(
      "Workflow run not found: exec-missing",
    );
    await expect(approveFounderRequest("appr-missing")).rejects.toThrow(
      "Approval not found: appr-missing",
    );
    await expect(rejectFounderRequest("appr-missing")).rejects.toThrow(
      "Approval not found: appr-missing",
    );
    await expect(failWorkflowExecution("exec-missing", "boom")).rejects.toThrow(
      "Workflow run not found: exec-missing",
    );
    await expect(
      registerApprovalGate({
        executionId: "exec-missing",
        approvalId: "appr-missing",
      }),
    ).rejects.toThrow("Workflow run not found: exec-missing");
  });

  it("generates a Mission Control state snapshot", async () => {
    const created = await createFounderRequest({
      title: "State snapshot",
      description: "Snapshot must include the live request entities.",
      priority: "Low",
    });
    await runExecutiveReview(created.execution.id);

    const state = await getDevHqStateSnapshot();

    expect(state.projects.some((p) => p.id === created.project.id)).toBe(true);
    expect(state.tasks.some((t) => t.id === created.task.id)).toBe(true);
    expect(
      state.executions.some((e) => e.id === created.execution.id),
    ).toBe(true);
    expect(
      state.workflowRuns.some((r) => r.executionId === created.execution.id),
    ).toBe(true);
    expect(state.approvals.length).toBeGreaterThan(0);
    expect(state.overview.activeProjects).toBeGreaterThanOrEqual(1);
    expect(state.overview.pendingApprovals).toBeGreaterThanOrEqual(1);
  });

  it("marks a technical failure without inventing a business decision", async () => {
    const created = await createFounderRequest({
      title: "Failure path",
      description: "Technical failure should mark the run as failed.",
      priority: "High",
    });

    const failed = await failWorkflowExecution(
      created.execution.id,
      "Worker crashed",
    );
    expect(failed.stage).toBe("failed");
    expect(failed.decision).toBeNull();

    const execution = await getDevHqAdapters().workflowEngine.getExecution(
      created.execution.id,
    );
    expect(execution?.status).toBe("failed");

    const again = await failWorkflowExecution(
      created.execution.id,
      "Worker crashed again",
    );
    expect(again).toEqual(failed);
  });
});
