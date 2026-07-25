import { beforeEach, describe, expect, it } from "vitest";

import { createDevExecutionRunner } from "@/lib/dev-hq/adapters/dev-execution-runner";
import { resetDevHqStore, saveTask } from "@/lib/dev-hq/store";
import type { AgentResult, Task } from "@/types/domain";

const TS = "2026-07-24T21:00:00.000Z";

function seedTask(): Task {
  return saveTask({
    id: "task-runner-1",
    projectId: "proj-x",
    workflowId: null,
    title: "Runner task",
    description: "Dispatched via the adapter.",
    status: "active",
    priority: "High",
    assigneeAgentId: null,
    claimedAt: null,
    createdAt: TS,
    updatedAt: TS,
    dueAt: null,
  });
}

function succeeded(): AgentResult {
  return {
    agentId: "",
    taskId: "",
    status: "succeeded",
    summary: null,
    output: null,
    filesChanged: [],
    commandsRun: [],
    evidenceIds: [],
    errors: [],
    usage: null,
    startedAt: TS,
    completedAt: TS,
  };
}

describe("DevExecutionRunner", () => {
  const runner = createDevExecutionRunner();

  beforeEach(() => {
    resetDevHqStore();
  });

  it("drives assign -> claim -> heartbeat -> release through the manager", async () => {
    const task = seedTask();
    const decision = await runner.assignExecution(task.id, {
      requiredCapabilities: ["validation"],
    });
    expect(decision.assigned).toBe(true);

    const executionId = decision.execution!.id;
    const claimed = await runner.claimExecution(executionId, "agent-supervisor");
    expect(claimed.status).toBe("running");

    await runner.heartbeat(executionId);
    const done = await runner.releaseExecution(executionId, succeeded());
    expect(done.status).toBe("succeeded");

    expect((await runner.getExecution(executionId))?.status).toBe("succeeded");
  });

  it("surfaces no_agent_available from the manager", async () => {
    const task = seedTask();
    const decision = await runner.assignExecution(task.id, {
      requiredCapabilities: ["qa"],
    });
    expect(decision.assigned).toBe(false);
    expect(decision.reason).toBe("no_agent_available");
  });

  it("lists ready work", async () => {
    seedTask();
    const ready = await runner.listReadyWork();
    expect(ready.map((t) => t.id)).toContain("task-runner-1");
  });
});
