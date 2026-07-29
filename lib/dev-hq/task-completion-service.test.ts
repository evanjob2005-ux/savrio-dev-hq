import { beforeEach, describe, expect, it } from "vitest";

import { completeTaskForSuccessfulExecution } from "@/lib/dev-hq/task-completion-service";
import {
  getDevHqStore,
  resetDevHqStore,
  saveEscalation,
  saveExecution,
  saveTask,
} from "@/lib/dev-hq/store";
import type { Execution, Task } from "@/types/domain";

const EARLIER = "2026-07-29T12:00:00.000Z";
const LATER = "2026-07-29T12:00:01.000Z";
const TASK_ID = "task-completion-guards";

function seedTask(status: Task["status"] = "active"): Task {
  return saveTask({
    id: TASK_ID,
    projectId: "proj-x",
    workflowId: null,
    title: "Guard task completion",
    description: "Keep stale outcomes from winning.",
    status,
    priority: "High",
    assigneeAgentId: null,
    claimedAt: null,
    createdAt: EARLIER,
    updatedAt: EARLIER,
    dueAt: null,
  });
}

function seedExecution(
  id: string,
  status: Execution["status"],
  createdAt = EARLIER,
): Execution {
  return saveExecution({
    id,
    taskId: TASK_ID,
    workflowId: null,
    agentId: null,
    status,
    triggerRunId: null,
    startedAt: null,
    completedAt: status === "succeeded" ? createdAt : null,
    createdAt,
    assignmentId: null,
    attempt: 1,
    routing: {
      requiredCapabilities: ["validation"],
      preferredAgentId: null,
      provider: "simulation",
    },
    request: {
      instructions: "do work",
      requiredCapabilities: ["validation"],
      preferredAgentId: null,
    },
    reviewPolicy: "none",
  });
}

function taskStatus(): Task["status"] | undefined {
  return getDevHqStore().tasks.get(TASK_ID)?.status;
}

describe("successful-execution task completion guards", () => {
  beforeEach(() => {
    resetDevHqStore();
  });

  it("null arm: a lone successful no-review execution completes its active task", async () => {
    seedTask();
    seedExecution("exec-authoritative", "succeeded");

    expect(
      await completeTaskForSuccessfulExecution("exec-authoritative"),
    ).toBe(true);
    expect(taskStatus()).toBe("completed");
  });

  it("refuses completion while an escalation is open", async () => {
    seedTask();
    seedExecution("exec-authoritative", "succeeded");
    saveEscalation({
      id: "esc-open",
      origin: "retry_exhausted",
      taskId: TASK_ID,
      executionId: "exec-authoritative",
      reviewId: null,
      summary: "Founder decision required.",
      status: "open",
      resolution: null,
      raisedByAgentId: null,
      raisedAt: LATER,
      resolvedAt: null,
      revisionExecutionId: null,
    });

    expect(
      await completeTaskForSuccessfulExecution("exec-authoritative"),
    ).toBe(false);
    expect(taskStatus()).toBe("active");
  });

  it("null arm: the same resolved escalation no longer blocks completion", async () => {
    seedTask();
    seedExecution("exec-authoritative", "succeeded");
    saveEscalation({
      id: "esc-resolved",
      origin: "retry_exhausted",
      taskId: TASK_ID,
      executionId: "exec-authoritative",
      reviewId: null,
      summary: "Founder decision recorded.",
      status: "resolved",
      resolution: "accept",
      raisedByAgentId: null,
      raisedAt: EARLIER,
      resolvedAt: LATER,
      revisionExecutionId: null,
    });

    expect(
      await completeTaskForSuccessfulExecution("exec-authoritative"),
    ).toBe(true);
    expect(taskStatus()).toBe("completed");
  });

  it("refuses to overwrite a rejected task", async () => {
    seedTask("rejected");
    seedExecution("exec-authoritative", "succeeded");

    expect(
      await completeTaskForSuccessfulExecution("exec-authoritative"),
    ).toBe(false);
    expect(taskStatus()).toBe("rejected");
  });

  it("null arm: the identical successful execution may complete an active task", async () => {
    seedTask("active");
    seedExecution("exec-authoritative", "succeeded");

    expect(
      await completeTaskForSuccessfulExecution("exec-authoritative"),
    ).toBe(true);
    expect(taskStatus()).toBe("completed");
  });

  it.each(["queued", "running", "succeeded"] as const)(
    "refuses an older success while a newer execution is %s",
    async (newerStatus) => {
      seedTask();
      seedExecution("exec-older", "succeeded", EARLIER);
      seedExecution("exec-newer", newerStatus, LATER);

      expect(await completeTaskForSuccessfulExecution("exec-older")).toBe(
        false,
      );
      expect(taskStatus()).toBe("active");
    },
  );

  it("uses creation order deterministically when execution timestamps tie", async () => {
    seedTask();
    seedExecution("exec-older", "succeeded", EARLIER);
    seedExecution("exec-newer", "queued", EARLIER);

    expect(await completeTaskForSuccessfulExecution("exec-older")).toBe(false);
    expect(taskStatus()).toBe("active");
  });
});
