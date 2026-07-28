import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

interface CapturedTask {
  run?: (payload: {
    executionId: string;
    approvalId: string;
    decision: "approved" | "rejected";
  }) => Promise<unknown>;
  onFailure?: (input: {
    payload: {
      executionId: string;
      approvalId: string;
      decision: "approved" | "rejected";
    };
    error: unknown;
  }) => Promise<void>;
}

const { taskDefinitions, triggerMock } = vi.hoisted(() => ({
  taskDefinitions: new Map<string, CapturedTask>(),
  triggerMock: vi.fn(),
}));

vi.mock("@trigger.dev/sdk", () => {
  const metadata = { set: vi.fn() };
  return {
    metadata,
    task: (definition: CapturedTask & { id: string }) => {
      taskDefinitions.set(definition.id, definition);
      return definition;
    },
    tasks: {
      trigger: triggerMock,
    },
  };
});

vi.mock("@/lib/dev-hq/internal-guard", () => ({
  DEV_HQ_INTERNAL_TOKEN_HEADER: "x-dev-hq-internal-token",
  rejectInternalDevRequest: () => null,
}));

import { POST as failRoute } from "@/app/api/dev-hq/internal/fail/route";
import { POST as finalizeRoute } from "@/app/api/dev-hq/internal/finalize/route";
import { ApprovalQueuePanel } from "@/components/mission-control/ApprovalQueuePanel";
import { resetDevHqAdapters } from "@/lib/dev-hq/adapters";
import {
  approveFounderRequest,
  createFounderRequest,
  getDevHqStateSnapshot,
  registerApprovalGate,
  rejectFounderRequest,
  runExecutiveReview,
} from "@/lib/dev-hq/founder-request-service";
import { buildCommandCenterModel } from "@/lib/mission-control/view-model";
import { resetDevHqStore } from "@/lib/dev-hq/store";
import "@/trigger/founder-request-continuation";

const INITIAL_RUN_ID = "run_terminal_failure_initial";
const FIRST_CONTINUATION_RUN_ID = "run_terminal_failure_first";
const RETRY_CONTINUATION_RUN_ID = "run_terminal_failure_retry";
const CONTINUATION_TASK_ID = "founder-request-continuation";

let continuationDispatches = 0;

function continuationCalls() {
  return triggerMock.mock.calls.filter(
    (call) => call[0] === CONTINUATION_TASK_ID,
  );
}

function renderQueue() {
  const state = getDevHqStateSnapshot();
  return state.then((snapshot) => {
    const model = buildCommandCenterModel(snapshot);
    return {
      model,
      html: renderToStaticMarkup(
        createElement(ApprovalQueuePanel, {
          approvals: model.approvals,
          onApprove: () => undefined,
          onReject: () => undefined,
          busyApprovalId: null,
        }),
      ),
    };
  });
}

beforeEach(() => {
  resetDevHqStore();
  resetDevHqAdapters();
  continuationDispatches = 0;
  triggerMock.mockReset();
  triggerMock.mockImplementation(async (id: string) => {
    if (id !== CONTINUATION_TASK_ID) {
      return { id: INITIAL_RUN_ID };
    }
    continuationDispatches += 1;
    return {
      id:
        continuationDispatches === 1
          ? FIRST_CONTINUATION_RUN_ID
          : RETRY_CONTINUATION_RUN_ID,
    };
  });
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url,
    );
    const route =
      url.pathname === "/api/dev-hq/internal/finalize"
        ? finalizeRoute
        : failRoute;
    return route(
      new Request(`http://dev-hq.test${url.pathname}`, {
        method: "POST",
        headers: init?.headers,
        body: init?.body,
      }),
    );
  });
});

describe("terminal continuation failure recovery", () => {
  it("preserves the decision, explains the failure, and retries only the same decision", async () => {
    const created = await createFounderRequest({
      title: "Terminal continuation recovery",
      description:
        "A confirmed continuation later exhausts retries and must remain truthful.",
      priority: "High",
    });
    const review = await runExecutiveReview(created.execution.id);
    const approval = await registerApprovalGate({
      executionId: created.execution.id,
      approvalId: review.approvalId!,
    });

    // The Founder decides and the provider returns a valid run id. This is the
    // legitimate dispatch path to `confirmed`, not the thrown-trigger control.
    await approveFounderRequest(approval.id);
    expect(continuationCalls()).toHaveLength(1);
    expect(continuationCalls()[0][2]).toMatchObject({
      idempotencyKey: `founder-continuation-${created.execution.id}`,
    });

    const continuationTask = taskDefinitions.get(CONTINUATION_TASK_ID);
    expect(continuationTask?.onFailure).toBeTypeOf("function");
    const firstPayload = continuationCalls()[0][1] as {
      executionId: string;
      approvalId: string;
      decision: "approved";
    };

    // Drive the actual task onFailure hook through its internal route and into
    // the service after the continuation has exhausted retries.
    await continuationTask!.onFailure!({
      payload: firstPayload,
      error: new Error("continuation exhausted its retry budget"),
    });

    const failedState = await getDevHqStateSnapshot();
    const failedApproval = failedState.approvals.find(
      (item) => item.id === approval.id,
    );
    const failedRun = failedState.workflowRuns.find(
      (item) => item.executionId === created.execution.id,
    );
    const failedExecution = failedState.executions.find(
      (item) => item.id === created.execution.id,
    );
    expect(failedApproval).toMatchObject({
      status: "pending",
      decision: "approved",
      continuation: "confirmed",
    });
    expect(failedRun).toMatchObject({
      stage: "failed",
      decision: "approved",
      continuation: "confirmed",
      continuationRunId: FIRST_CONTINUATION_RUN_ID,
    });
    expect(failedRun?.continuationDetail).toContain("exhausted its retries");
    expect(failedExecution?.status).toBe("failed");
    expect(failedApproval?.decidedAt).toBeNull();
    expect(approvalLooksComplete(failedApproval)).toBe(false);

    const failureEvent = failedState.events.find(
      (event) => event.type === "workflow.failed",
    );
    expect(failureEvent?.message).toContain(
      "recorded approved decision started",
    );
    expect(failureEvent?.message).toContain("same decision may be retried");
    expect(
      failedState.events.some((event) => event.type === "approval.approved"),
    ).toBe(false);
    expect(
      failedState.events.some((event) => event.type === "approval.rejected"),
    ).toBe(false);
    expect(
      failedState.events.some((event) => event.type === "workflow.completed"),
    ).toBe(false);

    const failedQueue = await renderQueue();
    expect(failedQueue.model.approvals[0]?.actionable).toBe(true);
    expect(failedQueue.model.auditRecords[0]).toMatchObject({
      stage: "failed",
      decision: "approved",
      continuation: "confirmed",
      continuationRunId: FIRST_CONTINUATION_RUN_ID,
    });
    expect(failedQueue.model.auditRecords[0]?.execution?.status).toBe("failed");
    expect(failedQueue.html).toContain(
      "continuation started but later failed after exhausting retries",
    );
    expect(failedQueue.html).toContain("Retry approval");
    expect(failedQueue.html).toContain("Retry required");
    expect(failedQueue.html).not.toContain("Retry rejection");
    expect(failedQueue.html).not.toContain(
      "workflow has not opened the approval gate",
    );

    // A conflicting choice is still denied before recovery dispatch.
    await rejectFounderRequest(approval.id);
    expect(continuationCalls()).toHaveLength(1);
    const conflictState = await getDevHqStateSnapshot();
    expect(
      conflictState.events.some(
        (event) => event.type === "approval.decision_conflicted",
      ),
    ).toBe(true);
    expect(
      conflictState.approvals.find((item) => item.id === approval.id),
    ).toMatchObject({
      decision: "approved",
      continuation: "confirmed",
    });

    // The same decision opens one new idempotency generation. A duplicate after
    // that confirmed start is a path-level no-op.
    await approveFounderRequest(approval.id);
    expect(continuationCalls()).toHaveLength(2);
    expect(continuationCalls()[1][2]).toMatchObject({
      idempotencyKey: `founder-continuation-${created.execution.id}-retry-1`,
    });
    await approveFounderRequest(approval.id);
    expect(continuationCalls()).toHaveLength(2);

    const recoveredState = await getDevHqStateSnapshot();
    const recoveredApproval = recoveredState.approvals.find(
      (item) => item.id === approval.id,
    );
    const recoveredRun = recoveredState.workflowRuns.find(
      (item) => item.executionId === created.execution.id,
    );
    const recoveredExecution = recoveredState.executions.find(
      (item) => item.id === created.execution.id,
    );
    expect(recoveredApproval).toMatchObject({
      status: "pending",
      decision: "approved",
      continuation: "confirmed",
    });
    expect(recoveredRun).toMatchObject({
      stage: "founder_approval_required",
      decision: "approved",
      continuation: "confirmed",
      continuationRunId: RETRY_CONTINUATION_RUN_ID,
    });
    expect(recoveredExecution?.status).toBe("running");
    expect(
      recoveredRun?.runLineage
        .filter((entry) => entry.role === "continuation")
        .map((entry) => entry.runId),
    ).toEqual([FIRST_CONTINUATION_RUN_ID, RETRY_CONTINUATION_RUN_ID]);
    expect(recoveredRun?.continuationDetail).toContain(
      "Same-decision retry run",
    );
    expect(recoveredRun?.continuationDetail).toContain(
      RETRY_CONTINUATION_RUN_ID,
    );
    expect(
      recoveredState.events.some((event) => event.type === "workflow.failed"),
    ).toBe(true);
    expect(
      recoveredState.events.some((event) => event.type === "approval.approved"),
    ).toBe(false);
    expect(
      recoveredState.events.some((event) => event.type === "approval.rejected"),
    ).toBe(false);
    expect(
      recoveredState.events.some((event) => event.type === "workflow.completed"),
    ).toBe(false);
    expect(recoveredApproval?.decidedAt).toBeNull();
    expect(approvalLooksComplete(recoveredApproval)).toBe(false);

    const recoveredQueue = await renderQueue();
    expect(recoveredQueue.model.approvals[0]?.actionable).toBe(false);
    expect(recoveredQueue.model.auditRecords[0]?.execution?.status).toBe(
      "running",
    );
    expect(recoveredQueue.html).toContain(
      "continuation run is confirmed started; awaiting its final outcome",
    );
    expect(recoveredQueue.html).not.toContain(
      "workflow has not opened the approval gate",
    );
    expect(recoveredQueue.html).not.toContain("Retry approval");

    // The recovery representation remains compatible with the existing
    // successful path: the retry worker can finalize the same recorded
    // decision, and only then does the approval become completed.
    const retryPayload = continuationCalls()[1][1] as {
      executionId: string;
      approvalId: string;
      decision: "approved";
    };
    expect(continuationTask?.run).toBeTypeOf("function");
    await continuationTask!.run!(retryPayload);

    const finalizedState = await getDevHqStateSnapshot();
    expect(
      finalizedState.approvals.find((item) => item.id === approval.id),
    ).toMatchObject({
      status: "approved",
      decision: "approved",
      continuation: "confirmed",
    });
    expect(
      finalizedState.workflowRuns.find(
        (item) => item.executionId === created.execution.id,
      ),
    ).toMatchObject({
      stage: "completed",
      decision: "approved",
      continuation: "confirmed",
      continuationRunId: RETRY_CONTINUATION_RUN_ID,
    });
    expect(
      finalizedState.executions.find(
        (item) => item.id === created.execution.id,
      )?.status,
    ).toBe("succeeded");
    expect(
      finalizedState.events.filter(
        (event) => event.type === "approval.approved",
      ),
    ).toHaveLength(1);
    expect(
      finalizedState.events.filter(
        (event) => event.type === "workflow.completed",
      ),
    ).toHaveLength(1);
  });
});

function approvalLooksComplete(
  approval:
    | {
        status: string;
        decidedAt: string | null;
      }
    | undefined,
): boolean {
  if (!approval) return false;
  return (
    approval.status === "approved" ||
    approval.status === "rejected" ||
    approval.decidedAt !== null
  );
}
