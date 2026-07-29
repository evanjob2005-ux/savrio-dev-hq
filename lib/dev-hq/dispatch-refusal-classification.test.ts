// NBF-1 (F-4). The two dispatch surfaces classify the same two refusals.
//
// `dispatchAgentExecution` throws exactly two refusals — `UndispatchableRequestError`
// ("no dispatch could ever run this") and `ConflictingDispatchRequestError` ("this
// key is already held by a different request"). Neither is an outage; both are
// permanent answers about the request.
//
// Each surface classified exactly the one the other missed:
//
//   internal/execution/dispatch/route.ts  handled Undispatchable (409), and let
//                                         Conflicting fall through to 500 —
//                                         "the server broke, try again" about a
//                                         replay that will be refused forever.
//   lib/dev-hq/actions.ts                 handled Conflicting (resolved: true),
//                                         and returned resolved: false for
//                                         Undispatchable — so DispatchAgentPanel
//                                         never retired the pending key and
//                                         showed a retryable-looking hold on a
//                                         request refused identically forever.
//
// Falsifiable claims under test: the route answers 409 for BOTH, and the action
// answers `resolved: true` for BOTH. Each is paired with a null arm from an
// identical starting state — a genuine internal failure must still be 500 and
// `resolved: false`, or "classify everything as definitive" would pass.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { triggerMock } = vi.hoisted(() => ({ triggerMock: vi.fn() }));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: { trigger: triggerMock },
}));

import { POST as dispatchRoute } from "@/app/api/dev-hq/internal/execution/dispatch/route";
import { dispatchAgentExecutionAction } from "@/lib/dev-hq/actions";
import { dispatchExecutionIdFor } from "@/lib/dev-hq/agent-execution-service";
import { resetDevHqStore, saveTask } from "@/lib/dev-hq/store";
import type { Task } from "@/types/domain";

const TS = "2026-07-29T09:00:00.000Z";
const TOKEN = "test-internal-token";
const HEADER = "x-dev-hq-internal-token";

function seedTask(id = "task-classify-1"): Task {
  return saveTask({
    id,
    projectId: "proj-x",
    workflowId: null,
    title: "Classify me",
    description: "Do the work.",
    status: "active",
    priority: "High",
    assigneeAgentId: null,
    claimedAt: null,
    createdAt: TS,
    updatedAt: TS,
    dueAt: null,
  });
}

function post(body: unknown): Promise<Response> {
  return dispatchRoute(
    new Request("http://localhost/api/dev-hq/internal/execution/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json", [HEADER]: TOKEN },
      body: JSON.stringify(body),
    }),
  );
}

describe("dispatch refusal classification (NBF-1)", () => {
  const originalToken = process.env.DEV_HQ_INTERNAL_TOKEN;

  beforeEach(() => {
    vi.stubEnv("DEV_HQ_DEPLOYMENT_MODE", "local");
    resetDevHqStore();
    triggerMock.mockReset();
    triggerMock.mockResolvedValue({ id: "run-1" });
    process.env.DEV_HQ_INTERNAL_TOKEN = TOKEN;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    if (originalToken === undefined) {
      delete process.env.DEV_HQ_INTERNAL_TOKEN;
    } else {
      process.env.DEV_HQ_INTERNAL_TOKEN = originalToken;
    }
  });

  describe("the internal route", () => {
    /**
     * A dispatch key replayed with different instructions. The key exists to
     * detect exactly this, and the route reported it as a server fault.
     */
    it("answers 409 for a key replayed with a different request", async () => {
      const task = seedTask();
      const first = await post({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        instructions: "Run the migration.",
        idempotencyKey: "classify-conflict",
      });
      expect(first.status).toBe(200);

      const replay = await post({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        instructions: "Delete the production database.",
        idempotencyKey: "classify-conflict",
      });

      expect(
        replay.status,
        "a replayed dispatch key carrying a different request was reported as 500 — an outage the caller will retry — when it is a permanent refusal the caller must fix (NBF-1)",
      ).toBe(409);
      expect(((await replay.json()) as { error: string }).error).toMatch(
        /different instructions/,
      );
    });

    /**
     * The refusal the route already classified, kept under test so the pair is
     * asserted together rather than one being assumed from the other.
     */
    it("answers 409 for a request nothing could ever run", async () => {
      const task = seedTask();
      const response = await post({
        taskId: task.id,
        // Both are in the frozen vocabulary and both are offered by
        // DispatchAgentPanel, but the roster is capability-partitioned.
        requiredCapabilities: ["validation", "routing"],
        idempotencyKey: "classify-undispatchable",
      });

      expect(response.status).toBe(409);
    });

    /**
     * NULL ARM. Identical starting state and an identical shape of failure path
     * — an exception out of `dispatchAgentExecution` — differing only in that it
     * is a genuine internal fault rather than a refusal. It must still be 500,
     * or "409 for both refusals" is satisfied by a handler that answers 409 for
     * everything.
     */
    it("null arm: a genuine internal failure is still 500", async () => {
      const task = seedTask();
      triggerMock.mockRejectedValueOnce(new Error("Trigger.dev is unreachable"));

      const response = await post({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        idempotencyKey: "classify-outage",
      });

      expect(response.status).toBe(500);
      expect(((await response.json()) as { error: string }).error).toBe(
        "Trigger.dev is unreachable",
      );
    });

    /** NULL ARM. A legitimate dispatch through the same route still succeeds. */
    it("null arm: a legitimate dispatch still returns 200", async () => {
      const task = seedTask();
      const response = await post({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        idempotencyKey: "classify-ok",
      });

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ assigned: true });
    });
  });

  describe("the server action", () => {
    /**
     * THE SHIPPED-UI CONSEQUENCE. The founder ticks `validation` and `routing`,
     * two adjacent checkboxes in DispatchAgentPanel that the capability-
     * partitioned roster cannot satisfy together. The request is refused, and
     * the panel retires its pending key only `if (outcome.resolved)` — so with
     * `resolved: false` it kept showing a retryable-looking hold on a request
     * that will be refused identically forever.
     */
    it("resolves the identity for a request nothing could ever run", async () => {
      const task = seedTask();

      const outcome = await dispatchAgentExecutionAction({
        taskId: task.id,
        requiredCapabilities: ["validation", "routing"],
        idempotencyKey: "action-undispatchable",
      });

      expect(outcome.ok).toBe(false);
      expect(
        outcome.resolved,
        "an unsatisfiable capability set left the dispatch identity unresolved, so DispatchAgentPanel holds the pending key and shows a retryable hold on a request that will be refused identically forever (NBF-1)",
      ).toBe(true);
      if (!outcome.ok) {
        expect(outcome.error).toMatch(/could never be assigned/);
      }
    });

    /**
     * The task-eligibility half of the same refusal class, so the claim is about
     * `UndispatchableRequestError` rather than about one message.
     */
    it("resolves the identity for a task that is not eligible for work", async () => {
      const task = seedTask();
      saveTask({ ...task, status: "completed" });

      const outcome = await dispatchAgentExecutionAction({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        idempotencyKey: "action-ineligible",
      });

      expect(outcome.ok).toBe(false);
      expect(outcome.resolved).toBe(true);
    });

    /** The refusal the action already classified, asserted alongside its pair. */
    it("resolves the identity for a key replayed with a different request", async () => {
      const task = seedTask();
      await dispatchAgentExecutionAction({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        instructions: "Run the migration.",
        idempotencyKey: "action-conflict",
      });

      const outcome = await dispatchAgentExecutionAction({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        instructions: "Delete the production database.",
        idempotencyKey: "action-conflict",
      });

      expect(outcome.ok).toBe(false);
      expect(outcome.resolved).toBe(true);
      if (!outcome.ok) {
        expect(outcome.executionId).toBe(
          dispatchExecutionIdFor("action-conflict"),
        );
      }
    });

    /**
     * NULL ARM. Identical starting state, identical call shape; only the failure
     * differs — a transient provider outage after the canonical execution was
     * created. State may exist, so the identity must be HELD, not retired.
     * Without this arm, "resolved: true for both refusals" is satisfied by
     * `resolved: true` unconditionally, which would silently drop recoverable
     * dispatches on the floor.
     */
    it("null arm: a transient failure leaves the identity unresolved", async () => {
      const task = seedTask();
      triggerMock.mockRejectedValueOnce(new Error("Trigger.dev is unreachable"));

      const outcome = await dispatchAgentExecutionAction({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        idempotencyKey: "action-outage",
      });

      expect(outcome.ok).toBe(false);
      expect(
        outcome.resolved,
        "a transient dispatch failure retired the identity; the browser would start a second logical dispatch against state that already exists",
      ).toBe(false);
    });

    /** NULL ARM. A legitimate dispatch through the action still succeeds. */
    it("null arm: a legitimate dispatch still resolves as ok", async () => {
      const task = seedTask();
      const outcome = await dispatchAgentExecutionAction({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        idempotencyKey: "action-ok",
      });

      expect(outcome).toMatchObject({ ok: true, resolved: true });
    });
  });
});
