// NBF-3 (F-1). One task, one live agent-backed execution.
//
// `assertTaskDispatchable` refuses a task whose `assigneeAgentId` is set, which
// reads as the "one owner" guard and is not one: nothing in production ever
// writes that field to a non-null value (the repository sets it null at
// creation; only `claimTask` assigns it, and `claimTask` has no callers). So two
// dispatches carrying different idempotency keys against the same active task
// both passed, and because `ensureExecution` keys on the *execution* id rather
// than the task, both created their own canonical execution, both were assigned,
// and both were dispatched.
//
// The red arm below therefore asserts what actually goes wrong — TWO live
// executions on ONE task, each with its own assignment and its own durable run —
// not merely that a predicate returns false.

import { beforeEach, describe, expect, it, vi } from "vitest";

const { triggerMock } = vi.hoisted(() => ({ triggerMock: vi.fn() }));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: { trigger: triggerMock },
}));

import {
  dispatchAgentExecution,
  handleExecutionComplete,
  handleExecutionRunning,
  UndispatchableRequestError,
} from "@/lib/dev-hq/agent-execution-service";
import { getExecution } from "@/lib/dev-hq/execution-manager";
import {
  getDevHqStore,
  resetDevHqStore,
  saveAgent,
  saveTask,
} from "@/lib/dev-hq/store";
import type { Execution, Task } from "@/types/domain";

const TS = "2026-07-29T09:00:00.000Z";

function seedTask(overrides?: Partial<Task>): Task {
  return saveTask({
    id: "task-live-1",
    projectId: "proj-x",
    workflowId: null,
    title: "One owner",
    description: "Do the assigned work.",
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

/** Every agent-backed execution on a task that still owns its outcome. */
function liveExecutionsFor(taskId: string): Execution[] {
  return [...getDevHqStore().executions.values()].filter(
    (execution) =>
      execution.taskId === taskId &&
      Boolean(execution.routing) &&
      (execution.status === "queued" || execution.status === "running"),
  );
}

describe("one live agent execution per task (NBF-3)", () => {
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
   * THE DEFECT. Two dispatches, two different keys, one active task.
   *
   * With the guard reverted this test reports two live executions, two
   * assignments and two distinct Trigger runs on one task. That is one task with
   * two independent 3-attempt retry budgets, two review loops, and two
   * escalation paths racing on a single `Task.status`.
   */
  it("refuses a second dispatch while the task already has live agent work", async () => {
    const task = seedTask();

    const first = await dispatchAgentExecution({
      taskId: task.id,
      requiredCapabilities: ["validation"],
      idempotencyKey: "owner-key-a",
    });
    expect(first.assigned).toBe(true);

    // The refusal is checked LAST, deliberately. What is wrong when this guard
    // is absent is not that a predicate returned the wrong value — it is the
    // state the system is left in — so the state is asserted first and the
    // rejection is captured rather than awaited, or the diagnostic on failure
    // would be "a promise resolved" and would name nothing.
    const outcome = await dispatchAgentExecution({
      taskId: task.id,
      requiredCapabilities: ["validation"],
      idempotencyKey: "owner-key-b",
    }).catch((error: unknown) => error);

    const live = liveExecutionsFor(task.id);
    expect(
      live.map((execution) => execution.id),
      `task ${task.id} holds ${live.length} live agent executions; one task now has two independent retry budgets, two review loops, and two escalation paths racing on one Task.status (NBF-3)`,
    ).toEqual([first.executionId]);
    expect(
      [...getDevHqStore().agentAssignments.values()],
      "two assignments exist for one task, so two workers were told to run it (NBF-3)",
    ).toHaveLength(1);
    expect(
      new Set(triggerMock.mock.calls.map(([, payload]) => payload)).size,
      "two durable agent-execution runs were dispatched for one task (NBF-3)",
    ).toBe(1);
    expect(
      outcome,
      "the second dispatch was accepted for a task that already holds a live agent execution (NBF-3)",
    ).toBeInstanceOf(UndispatchableRequestError);
  });

  /**
   * The same defect reached the other way: a second dispatch while the first is
   * `running` rather than merely `queued`. Both are states in which the
   * execution still owns the task's outcome.
   */
  it("refuses a second dispatch while the first execution is running", async () => {
    const task = seedTask();
    const first = await dispatchAgentExecution({
      taskId: task.id,
      requiredCapabilities: ["validation"],
      idempotencyKey: "running-key-a",
    });
    const assignmentId = (await getExecution(first.executionId!))!.assignmentId!;
    await handleExecutionRunning(first.executionId!, assignmentId);
    expect((await getExecution(first.executionId!))!.status).toBe("running");

    // Free a second agent so capacity is genuinely available: the refusal must
    // come from the one-owner rule, not from there being nobody left to select.
    const supervisor = getDevHqStore().agents.get("agent-supervisor")!;
    saveAgent({ ...supervisor, availability: "available" });

    const outcome = await dispatchAgentExecution({
      taskId: task.id,
      requiredCapabilities: ["validation"],
      idempotencyKey: "running-key-b",
    }).catch((error: unknown) => error);

    const live = liveExecutionsFor(task.id);
    expect(
      live.map((execution) => `${execution.id}:${execution.status}`),
      `task ${task.id} holds ${live.length} live agent executions; a second worker was dispatched onto a task whose first execution is still running (NBF-3)`,
    ).toEqual([`${first.executionId}:running`]);
    expect(outcome).toBeInstanceOf(UndispatchableRequestError);
  });

  /**
   * NULL ARM 1. Identical starting state, identical two-dispatch sequence,
   * differing only in that the two dispatches name two different tasks. Two live
   * executions across two tasks is the normal, correct case and must still work
   * — otherwise the red arm above would be satisfied by a dispatch path that had
   * simply stopped dispatching.
   */
  it("null arm: two tasks each still get their own live execution", async () => {
    const taskA = seedTask();
    const taskB = seedTask({ id: "task-live-2" });

    const first = await dispatchAgentExecution({
      taskId: taskA.id,
      requiredCapabilities: ["validation"],
      idempotencyKey: "two-tasks-a",
    });
    const second = await dispatchAgentExecution({
      taskId: taskB.id,
      requiredCapabilities: ["validation"],
      idempotencyKey: "two-tasks-b",
    });

    expect(first.assigned).toBe(true);
    expect(second.assigned).toBe(true);
    expect(second.executionId).not.toBe(first.executionId);
    expect(liveExecutionsFor(taskA.id)).toHaveLength(1);
    expect(liveExecutionsFor(taskB.id)).toHaveLength(1);
  });

  /**
   * NULL ARM 2. Identical starting state and identical dispatch parameters; the
   * only difference is that the SAME key is replayed rather than a new one
   * issued. A replay must still converge on the execution its key already made —
   * that execution is itself live, so a guard evaluated on replays would make
   * every recovery refuse itself.
   */
  it("null arm: a replay of the same key still converges on its own execution", async () => {
    const task = seedTask();
    const first = await dispatchAgentExecution({
      taskId: task.id,
      requiredCapabilities: ["validation"],
      idempotencyKey: "converge-key",
    });
    const replay = await dispatchAgentExecution({
      taskId: task.id,
      requiredCapabilities: ["validation"],
      idempotencyKey: "converge-key",
    });

    expect(replay.executionId).toBe(first.executionId);
    expect(replay.triggerRunId).toBe(first.triggerRunId);
    expect(liveExecutionsFor(task.id)).toHaveLength(1);
  });

  /**
   * NULL ARM 3. Identical starting state; the only difference is that the first
   * execution has since reached a terminal state. A task legitimately
   * accumulates terminal executions, and refusing on those would make a task
   * dispatchable exactly once in its lifetime.
   */
  it("null arm: a task whose previous execution finished can be dispatched again", async () => {
    const task = seedTask();
    const first = await dispatchAgentExecution({
      taskId: task.id,
      requiredCapabilities: ["validation"],
      reviewPolicy: "none",
      idempotencyKey: "terminal-key-a",
    });
    const assignmentId = (await getExecution(first.executionId!))!.assignmentId!;
    await handleExecutionRunning(first.executionId!, assignmentId);
    await handleExecutionComplete({
      executionId: first.executionId!,
      assignmentId,
      status: "succeeded",
    });
    expect((await getExecution(first.executionId!))!.status).toBe("succeeded");

    const second = await dispatchAgentExecution({
      taskId: task.id,
      requiredCapabilities: ["validation"],
      idempotencyKey: "terminal-key-b",
    });

    expect(
      second.assigned,
      "a task whose only execution has finished could not be dispatched again; the guard is refusing on existence rather than liveness",
    ).toBe(true);
    expect(liveExecutionsFor(task.id).map((e) => e.id)).toEqual([
      second.executionId,
    ]);
  });

  /**
   * NULL ARM 4. A founder-request execution on the task must not block an agent
   * dispatch. It carries no routing and is never assigned an agent (ADR-0001
   * D2), so it is not a competing owner — and a guard that keyed on "any live
   * execution" would silently make founder-request tasks undispatchable.
   */
  it("null arm: a live founder-request execution does not block an agent dispatch", async () => {
    const task = seedTask();
    const store = getDevHqStore();
    store.executions.set("exec-founder-1", {
      id: "exec-founder-1",
      taskId: task.id,
      workflowId: "wf-founder-request",
      agentId: null,
      status: "running",
      triggerRunId: "run-founder",
      startedAt: TS,
      completedAt: null,
      createdAt: TS,
      assignmentId: null,
      attempt: 0,
    } as Execution);

    const result = await dispatchAgentExecution({
      taskId: task.id,
      requiredCapabilities: ["validation"],
      idempotencyKey: "founder-coexist",
    });

    expect(
      result.assigned,
      "a founder-request execution blocked an agent dispatch; it carries no routing and is never assigned an agent (ADR-0001 D2), so it is not a second owner",
    ).toBe(true);
  });
});
