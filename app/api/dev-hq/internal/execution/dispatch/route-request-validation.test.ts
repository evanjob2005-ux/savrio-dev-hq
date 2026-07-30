import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { triggerMock } = vi.hoisted(() => ({ triggerMock: vi.fn() }));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: { trigger: triggerMock },
}));

import { POST } from "@/app/api/dev-hq/internal/execution/dispatch/route";
import { getDevHqStore, resetDevHqStore, saveTask } from "@/lib/dev-hq/store";
import type { LifecycleStatus, Task } from "@/types/domain";

const TS = "2026-07-29T09:00:00.000Z";
const TOKEN = "test-internal-token";
const HEADER = "x-dev-hq-internal-token";

function seedTask(overrides?: Partial<Task>): Task {
  return saveTask({
    id: "task-dispatch-validate",
    projectId: "proj-x",
    workflowId: null,
    title: "Dispatch me",
    description: "Do work.",
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

function request(body: unknown, token?: string): Request {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers[HEADER] = token;
  return new Request(
    "http://localhost/api/dev-hq/internal/execution/dispatch",
    { method: "POST", headers, body: JSON.stringify(body) },
  );
}

async function errorOf(response: Response): Promise<string> {
  return ((await response.json()) as { error?: string }).error ?? "";
}

/** Nothing was created: the defect's signature is a queued execution nobody can run. */
function queuedExecutions() {
  return [...getDevHqStore().executions.values()].filter(
    (execution) => execution.status === "queued",
  );
}

/**
 * P0-5 at the edge. The route accepted any capability string and silently
 * dropped anything that was not a string. Both produced a dispatch no agent can
 * satisfy: queued forever, no attempt consumed, so the retry budget never
 * exhausts and no escalation is ever raised — the SVC-01 shape (e5aac96, "work
 * that neither completes nor fails") arriving through the request.
 */
describe("POST /api/dev-hq/internal/execution/dispatch — request validation", () => {
  const originalToken = process.env.DEV_HQ_INTERNAL_TOKEN;

  beforeEach(() => {
    resetDevHqStore();
    triggerMock.mockReset();
    triggerMock.mockResolvedValue({ id: "run-1" });
    process.env.DEV_HQ_INTERNAL_TOKEN = TOKEN;
  });

  afterEach(() => {
    if (originalToken === undefined) delete process.env.DEV_HQ_INTERNAL_TOKEN;
    else process.env.DEV_HQ_INTERNAL_TOKEN = originalToken;
  });

  it("refuses a capability outside the frozen vocabulary", async () => {
    const task = seedTask();
    const response = await POST(
      request(
        {
          taskId: task.id,
          // A plausible typo for "implementation". No agent can ever hold it.
          requiredCapabilities: ["implementaion"],
          idempotencyKey: "dispatch-unknown-cap",
        },
        TOKEN,
      ),
    );

    expect(
      response.status,
      "an unknown capability was accepted; nothing can satisfy it, so the dispatch strands queued and never escalates (P0-5)",
    ).toBe(400);
    expect(await errorOf(response)).toContain("implementaion");
    expect(
      queuedExecutions(),
      "a permanently unrunnable execution was created (P0-5)",
    ).toEqual([]);
    expect(triggerMock).not.toHaveBeenCalled();
  });

  it("refuses a non-string capability instead of silently dropping it", async () => {
    const task = seedTask();
    const response = await POST(
      request(
        {
          taskId: task.id,
          requiredCapabilities: ["validation", 7],
          idempotencyKey: "dispatch-nonstring-cap",
        },
        TOKEN,
      ),
    );

    expect(
      response.status,
      "a malformed capability was filtered away, so the dispatch ran under a WEAKER routing policy than the caller asked for (P0-5)",
    ).toBe(400);
    expect(queuedExecutions()).toEqual([]);
    expect(triggerMock).not.toHaveBeenCalled();
  });

  it("refuses requiredCapabilities that is not an array", async () => {
    const task = seedTask();
    const response = await POST(
      request(
        {
          taskId: task.id,
          requiredCapabilities: "validation",
          idempotencyKey: "dispatch-scalar-cap",
        },
        TOKEN,
      ),
    );

    expect(response.status).toBe(400);
    expect(queuedExecutions()).toEqual([]);
  });

  it("answers a jointly unsatisfiable combination with 409, not 500", async () => {
    const task = seedTask();
    // Both are real capabilities and both appear as checkboxes in
    // DispatchAgentPanel, but the roster is partitioned: "validation" is the
    // supervisor's and "routing" is the orchestrator's. No agent holds both.
    const response = await POST(
      request(
        {
          taskId: task.id,
          requiredCapabilities: ["validation", "routing"],
          idempotencyKey: "dispatch-joint-cap",
        },
        TOKEN,
      ),
    );

    expect(
      response.status,
      "a combination no agent can hold was accepted, or reported as an internal error the operator would retry (P0-5)",
    ).toBe(409);
    expect(queuedExecutions()).toEqual([]);
    expect(triggerMock).not.toHaveBeenCalled();
  });

  it.each<LifecycleStatus>(["draft", "completed", "rejected", "paused"])(
    "answers a dispatch against a %s task with 409",
    async (status) => {
      const task = seedTask({ status });
      const response = await POST(
        request(
          {
            taskId: task.id,
            requiredCapabilities: ["validation"],
            idempotencyKey: `dispatch-status-${status}`,
          },
          TOKEN,
        ),
      );

      expect(
        response.status,
        `a ${status} task received an execution; dispatch checked only that the task existed (P1-14)`,
      ).toBe(409);
      expect(await errorOf(response)).toContain(status);
      expect(triggerMock).not.toHaveBeenCalled();
    },
  );

  /**
   * NULL ARM. Identical starting state and an identical request shape, differing
   * only in the field under test: an active task and in-vocabulary capabilities
   * one agent actually holds. If this fails, the cases above prove nothing about
   * validation — only that the route refuses things.
   */
  it("null arm: an active task with a satisfiable capability still dispatches", async () => {
    const task = seedTask();
    const response = await POST(
      request(
        {
          taskId: task.id,
          requiredCapabilities: ["validation"],
          idempotencyKey: "dispatch-null-arm",
        },
        TOKEN,
      ),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      assigned: boolean;
      agentId: string | null;
    };
    expect(body.assigned).toBe(true);
    expect(body.agentId).toBe("agent-supervisor");
    expect(triggerMock).toHaveBeenCalledTimes(1);
  });
});
