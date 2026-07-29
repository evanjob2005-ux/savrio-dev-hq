import { beforeEach, describe, expect, it, vi } from "vitest";

const { triggerMock } = vi.hoisted(() => ({ triggerMock: vi.fn() }));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: { trigger: triggerMock },
}));

import {
  ConflictingDispatchRequestError,
  dispatchAgentExecution,
  dispatchExecutionIdFor,
  UndispatchableRequestError,
} from "@/lib/dev-hq/agent-execution-service";
import { getDevHqStore, resetDevHqStore, saveTask } from "@/lib/dev-hq/store";
import type { LifecycleStatus, Task } from "@/types/domain";

const TS = "2026-07-29T09:00:00.000Z";

function seedTask(overrides?: Partial<Task>): Task {
  return saveTask({
    id: "task-eligibility",
    projectId: "proj-x",
    workflowId: null,
    title: "Dispatchable work",
    description: "Do the work.",
    status: "active",
    priority: "High",
    assigneeAgentId: null,
    claimedAt: null,
    createdAt: TS,
    updatedAt: TS,
    dueAt: null,
    ...overrides,
  });
}

function executionIds(): string[] {
  return [...getDevHqStore().executions.keys()];
}

describe("dispatch eligibility", () => {
  beforeEach(() => {
    resetDevHqStore();
    let counter = 0;
    const runsByKey = new Map<string, string>();
    triggerMock.mockReset();
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
  });

  /**
   * P1-14. Dispatch checked only that the task EXISTED. Every other lifecycle
   * state — not yet authorized, explicitly stopped, already finished, refused,
   * or already owned by an agent — could receive an execution. `listReadyWork`
   * has always defined dispatchable work as active-and-unassigned; dispatch just
   * never consulted that definition.
   */
  describe("task lifecycle state (P1-14)", () => {
    it.each<LifecycleStatus>([
      "draft",
      "paused",
      "blocked",
      "needs_revision",
      "rejected",
      "completed",
      "archived",
    ])("refuses to dispatch a %s task", async (status) => {
      const task = seedTask({ status });

      await expect(
        dispatchAgentExecution({
          taskId: task.id,
          requiredCapabilities: ["validation"],
          idempotencyKey: `status-${status}`,
        }),
        `a ${status} task was given an execution; dispatch verified only that the task existed (P1-14)`,
      ).rejects.toBeInstanceOf(UndispatchableRequestError);

      expect(
        executionIds(),
        `an execution was created for a ${status} task (P1-14)`,
      ).toEqual([]);
      expect(triggerMock).not.toHaveBeenCalled();
    });

    it("refuses to dispatch a task an agent already owns", async () => {
      const task = seedTask({ assigneeAgentId: "agent-claude" });

      await expect(
        dispatchAgentExecution({
          taskId: task.id,
          requiredCapabilities: ["validation"],
          idempotencyKey: "already-assigned",
        }),
        "a task already owned by an agent was given a second owner (P1-14)",
      ).rejects.toBeInstanceOf(UndispatchableRequestError);

      expect(executionIds()).toEqual([]);
    });

    /**
     * NULL ARM. Identical starting state, identical request, differing only in
     * the task's status and assignee — the two fields the gate reads.
     */
    it("null arm: an active, unassigned task still dispatches", async () => {
      const task = seedTask();

      const result = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        idempotencyKey: "status-active",
      });

      expect(result.assigned).toBe(true);
      expect(result.agentId).toBe("agent-supervisor");
      expect(result.triggerRunId).toBe("run-1");
      expect(executionIds()).toEqual([dispatchExecutionIdFor("status-active")]);
    });

    /**
     * The gate must not break the key's contract. Eligibility is a property of
     * CREATING work; a replay converges on the execution its key already made.
     * The task legitimately moves on underneath a long-running dispatch — a
     * founder marks it completed, a workflow pauses it — and a recovery that
     * replays the key must still find its own execution rather than be told the
     * task is ineligible for work that was authorized before it changed.
     */
    it("still converges a replay whose task has since left the active state", async () => {
      const task = seedTask();
      const first = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        idempotencyKey: "replay-after-completion",
      });

      saveTask({ ...task, status: "completed" });

      const replay = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        idempotencyKey: "replay-after-completion",
      });

      expect(replay.executionId).toBe(first.executionId);
      expect(replay.triggerRunId).toBe(first.triggerRunId);
      expect(executionIds()).toHaveLength(1);
    });
  });

  /**
   * P0-5. The same failure shape as SVC-01 (commit e5aac96, "work that neither
   * completes nor fails"), arriving through the request instead of through the
   * seed: a capability set nothing can satisfy produces a queued execution that
   * the sweep retries forever, consuming no attempt, so the retry budget never
   * exhausts and no escalation is ever raised.
   */
  describe("capability satisfiability (P0-5)", () => {
    it("refuses a capability no agent could ever hold", async () => {
      const task = seedTask();

      await expect(
        dispatchAgentExecution({
          taskId: task.id,
          requiredCapabilities: ["no-such-capability"],
          idempotencyKey: "unknown-capability",
        }),
        "an unknown capability was accepted, creating work that neither completes nor fails (P0-5)",
      ).rejects.toBeInstanceOf(UndispatchableRequestError);

      expect(
        executionIds(),
        "a permanently queued execution was created for an unsatisfiable request (P0-5)",
      ).toEqual([]);
    });

    /**
     * The part the vocabulary check alone does NOT cover. Both capabilities are
     * in the frozen ADR-0001 O3 vocabulary and both are offered to the founder
     * by DispatchAgentPanel, but the roster is capability-partitioned:
     * "validation" belongs to agent-supervisor and "routing" to
     * agent-orchestrator. Requiring both is unsatisfiable by construction, and
     * strands exactly as a misspelling does.
     */
    it("refuses a combination that is valid but that no single agent holds", async () => {
      const task = seedTask();

      await expect(
        dispatchAgentExecution({
          taskId: task.id,
          requiredCapabilities: ["validation", "routing"],
          idempotencyKey: "joint-capability",
        }),
        "two individually valid capabilities that no agent holds together were accepted; nothing can ever be selected, so the execution strands queued (P0-5)",
      ).rejects.toBeInstanceOf(UndispatchableRequestError);

      expect(executionIds()).toEqual([]);
    });

    it("does not refuse a set that is merely out of capacity right now", async () => {
      const task = seedTask();
      // agent-supervisor holds "validation" and is the only one that does. Busy
      // is transient: staying queued is the approved outcome (ADR-0001 O6), and
      // reconciliation dispatches it when capacity returns. Refusing here would
      // turn a recoverable wait into a rejection.
      for (const agent of getDevHqStore().agents.values()) {
        getDevHqStore().agents.set(agent.id, { ...agent, availability: "busy" });
      }

      const result = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        idempotencyKey: "busy-not-unsatisfiable",
      });

      expect(result.assigned).toBe(false);
      expect(result.reason).toBe("no_agent_available");
      expect(result.executionId).toBe(
        dispatchExecutionIdFor("busy-not-unsatisfiable"),
      );
    });

    /**
     * NULL ARM. Identical starting state and request shape; only the capability
     * set differs, and it is one a single agent genuinely holds.
     */
    it("null arm: a set one agent holds still dispatches", async () => {
      const task = seedTask();

      const result = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["gates", "validation"],
        idempotencyKey: "satisfiable-capability",
      });

      expect(result.assigned).toBe(true);
      expect(result.agentId).toBe("agent-supervisor");
    });
  });

  /**
   * P1-15. `assertRequestMatches` compared instructions, capabilities and
   * preferred agent, but not the review policy — which is stored on the
   * execution rather than in `ExecutionRequest`. So one key could be replayed
   * under a different policy without conflict, the stored one silently won, and
   * the caller was told their dispatch had converged.
   */
  describe("review policy is part of the request identity (P1-15)", () => {
    it("refuses a replay that asks for a review the stored dispatch does not run", async () => {
      const task = seedTask();
      await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        reviewPolicy: "none",
        idempotencyKey: "policy-key",
      });

      await expect(
        dispatchAgentExecution({
          taskId: task.id,
          requiredCapabilities: ["validation"],
          reviewPolicy: "full",
          idempotencyKey: "policy-key",
        }),
        "a replay asking for `full` review converged on a `none` execution and was reported as successful; the review the caller asked for will never happen (P1-15)",
      ).rejects.toBeInstanceOf(ConflictingDispatchRequestError);

      const execution = getDevHqStore().executions.get(
        dispatchExecutionIdFor("policy-key"),
      )!;
      expect(execution.reviewPolicy).toBe("none");
    });

    it("refuses a replay that would drop a review the stored dispatch runs", async () => {
      const task = seedTask();
      await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        reviewPolicy: "full",
        idempotencyKey: "policy-key-drop",
      });

      await expect(
        dispatchAgentExecution({
          taskId: task.id,
          requiredCapabilities: ["validation"],
          reviewPolicy: "none",
          idempotencyKey: "policy-key-drop",
        }),
        "a replay asking for no review converged on a reviewed execution without conflict (P1-15)",
      ).rejects.toBeInstanceOf(ConflictingDispatchRequestError);
    });

    it("names the review policy as the conflicting field", async () => {
      const task = seedTask();
      await dispatchAgentExecution({
        taskId: task.id,
        reviewPolicy: "none",
        idempotencyKey: "policy-key-message",
      });

      await expect(
        dispatchAgentExecution({
          taskId: task.id,
          reviewPolicy: "basic",
          idempotencyKey: "policy-key-message",
        }),
      ).rejects.toThrow(/different review policy/);
    });

    /**
     * NULL ARM, two ways. From an identical starting state, a replay that agrees
     * with the stored policy converges, and so does one that states no policy at
     * all — the documented recovery case, where a caller that lost its form state
     * legitimately runs the stored request.
     */
    it("null arm: a replay under the same policy, or none at all, still converges", async () => {
      const task = seedTask();
      const first = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        reviewPolicy: "none",
        idempotencyKey: "policy-null-arm",
      });

      const agreeing = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        reviewPolicy: "none",
        idempotencyKey: "policy-null-arm",
      });
      const silent = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        idempotencyKey: "policy-null-arm",
      });

      expect(agreeing.executionId).toBe(first.executionId);
      expect(silent.executionId).toBe(first.executionId);
      expect(executionIds()).toHaveLength(1);
    });

    it("null arm: an explicit `basic` replay against a defaulted dispatch converges", async () => {
      const task = seedTask();
      // The first call states no policy, so DEFAULT_REVIEW_POLICY ("basic") is
      // stored. A replay naming that same policy explicitly is the SAME request
      // and must not be reported as a conflict.
      const first = await dispatchAgentExecution({
        taskId: task.id,
        idempotencyKey: "policy-default-arm",
      });
      const replay = await dispatchAgentExecution({
        taskId: task.id,
        reviewPolicy: "basic",
        idempotencyKey: "policy-default-arm",
      });

      expect(replay.executionId).toBe(first.executionId);
      expect(executionIds()).toHaveLength(1);
    });
  });
});
