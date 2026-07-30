import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { triggerMock } = vi.hoisted(() => ({ triggerMock: vi.fn() }));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: { trigger: triggerMock },
}));

import { POST } from "@/app/api/dev-hq/internal/execution/complete/route";
import {
  dispatchAgentExecution,
  handleExecutionReclaim,
  handleExecutionRunning,
} from "@/lib/dev-hq/agent-execution-service";
import { getExecution } from "@/lib/dev-hq/execution-manager";
import {
  getAssignment,
  resetDevHqStore,
  saveAssignment,
  saveTask,
} from "@/lib/dev-hq/store";
import type { Task } from "@/types/domain";

const TS = "2026-07-29T09:00:00.000Z";
const TOKEN = "test-internal-token";
const HEADER = "x-dev-hq-internal-token";

function seedTask(): Task {
  return saveTask({
    id: "task-complete-route",
    projectId: "proj-x",
    workflowId: null,
    title: "Completable work",
    description: "please fail this",
    status: "active",
    priority: "High",
    assigneeAgentId: null,
    claimedAt: null,
    createdAt: TS,
    updatedAt: TS,
    dueAt: null,
  });
}

function request(body: unknown, token?: string): Request {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers[HEADER] = token;
  return new Request(
    "http://localhost/api/dev-hq/internal/execution/complete",
    { method: "POST", headers, body: JSON.stringify(body) },
  );
}

/**
 * P0-2. `assignmentId` was optional on this callback, and the service's
 * staleness guard is `if (input.assignmentId && current.assignmentId !== ...)`.
 * An omitted field therefore skipped the guard entirely and finalized "whatever
 * attempt is current" — so a worker whose own attempt had been reclaimed could
 * write its abandoned outcome over the live retry.
 */
describe("POST /api/dev-hq/internal/execution/complete", () => {
  const originalToken = process.env.DEV_HQ_INTERNAL_TOKEN;

  beforeEach(() => {
    resetDevHqStore();
    triggerMock.mockReset();
    let counter = 0;
    const runsByKey = new Map<string, string>();
    triggerMock.mockImplementation(
      async (
        _taskId: string,
        _payload: unknown,
        options?: { idempotencyKey?: string },
      ) => {
        const key = options?.idempotencyKey;
        if (key && runsByKey.has(key)) return { id: runsByKey.get(key)! };
        const id = `run-${(counter += 1)}`;
        if (key) runsByKey.set(key, id);
        return { id };
      },
    );
    process.env.DEV_HQ_INTERNAL_TOKEN = TOKEN;
  });

  afterEach(() => {
    if (originalToken === undefined) delete process.env.DEV_HQ_INTERNAL_TOKEN;
    else process.env.DEV_HQ_INTERNAL_TOKEN = originalToken;
  });

  /**
   * Drive one execution to attempt 2 by expiring attempt 1's lease, and return
   * both attempts' assignment ids. Attempt 1's worker is the stale one: its
   * assignment was released under it and it is no longer current.
   */
  async function executionOnAttemptTwo() {
    const task = seedTask();
    const dispatched = await dispatchAgentExecution({
      taskId: task.id,
      requiredCapabilities: ["validation"],
      instructions: "do the work",
      idempotencyKey: "complete-route-stale",
    });
    const executionId = dispatched.executionId!;
    const staleAssignmentId = (await getExecution(executionId))!.assignmentId!;
    await handleExecutionRunning(executionId, staleAssignmentId);

    // Expire attempt 1's lease, then sweep: reclaim consumes the attempt and
    // hands the execution a NEW assignment for attempt 2.
    const claimed = getAssignment(staleAssignmentId)!;
    saveAssignment({ ...claimed, leaseExpiresAt: TS });
    await handleExecutionReclaim("2999-01-01T00:00:00.000Z");

    const afterReclaim = (await getExecution(executionId))!;
    const liveAssignmentId = afterReclaim.assignmentId!;
    await handleExecutionRunning(executionId, liveAssignmentId);

    expect(liveAssignmentId).not.toBe(staleAssignmentId);
    expect((await getExecution(executionId))!.status).toBe("running");
    expect((await getExecution(executionId))!.attempt).toBe(2);
    return { executionId, staleAssignmentId, liveAssignmentId };
  }

  it("refuses a finalization that names no attempt", async () => {
    const { executionId, liveAssignmentId } = await executionOnAttemptTwo();

    // Attempt 1's worker wakes up and reports, omitting the assignment. This is
    // the exact body the defect made survivable.
    const response = await POST(
      request(
        {
          executionId,
          status: "succeeded",
          summary: "Simulated agent succeeded.",
        },
        TOKEN,
      ),
    );

    // The damage first, so a reverted guard reports what was destroyed rather
    // than only which status code was missing.
    const execution = (await getExecution(executionId))!;
    expect(
      { status: execution.status, assignmentId: execution.assignmentId },
      "attempt 1's abandoned result was written over the LIVE attempt 2: its agent and assignment were released and its outcome recorded, by a callback that never said which attempt it was (P0-2)",
    ).toEqual({ status: "running", assignmentId: liveAssignmentId });

    expect(
      response.status,
      "an anonymous completion was accepted: with no attempt named, the service's staleness guard is skipped entirely and a superseded worker finalizes whatever attempt is current (P0-2)",
    ).toBe(400);
  });

  it("refuses a finalization whose attempt is not a string", async () => {
    const { executionId } = await executionOnAttemptTwo();

    const response = await POST(
      request(
        { executionId, assignmentId: 42, status: "succeeded" },
        TOKEN,
      ),
    );

    expect(response.status).toBe(400);
    expect((await getExecution(executionId))!.status).toBe("running");
  });

  it("absorbs a superseded attempt's finalization without touching the live one", async () => {
    const { executionId, staleAssignmentId, liveAssignmentId } =
      await executionOnAttemptTwo();

    // Named honestly, the stale callback is a 200 no-op — the worker stands down
    // cleanly rather than seeing an error it would retry.
    const response = await POST(
      request(
        {
          executionId,
          assignmentId: staleAssignmentId,
          status: "succeeded",
          summary: "Simulated agent succeeded.",
        },
        TOKEN,
      ),
    );

    expect(response.status).toBe(200);
    const execution = (await getExecution(executionId))!;
    expect(execution.status).toBe("running");
    expect(execution.assignmentId).toBe(liveAssignmentId);
  });

  /**
   * NULL ARM. Identical starting state — the same execution on attempt 2 after
   * the same reclaim — differing only in which attempt the callback names. The
   * current attempt's own completion must still work end to end, so the guard
   * above cannot be passing merely because this route rejects everything.
   */
  it("null arm: the live attempt's own finalization still completes it", async () => {
    const { executionId, liveAssignmentId } = await executionOnAttemptTwo();

    const response = await POST(
      request(
        {
          executionId,
          assignmentId: liveAssignmentId,
          status: "succeeded",
          summary: "Simulated agent succeeded.",
        },
        TOKEN,
      ),
    );

    expect(response.status).toBe(200);
    expect((await getExecution(executionId))!.status).toBe("succeeded");
  });
});
