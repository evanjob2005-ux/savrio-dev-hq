import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { triggerMock } = vi.hoisted(() => ({ triggerMock: vi.fn() }));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: { trigger: triggerMock },
}));

import { POST } from "@/app/api/dev-hq/internal/execution/dispatch/route";
import { resetDevHqStore, saveTask } from "@/lib/dev-hq/store";
import type { Task } from "@/types/domain";

const TS = "2026-07-24T21:00:00.000Z";
const TOKEN = "test-internal-token";
const HEADER = "x-dev-hq-internal-token";

function seedTask(): Task {
  return saveTask({
    id: "task-dispatch-1",
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

describe("POST /api/dev-hq/internal/execution/dispatch", () => {
  const originalToken = process.env.DEV_HQ_INTERNAL_TOKEN;

  beforeEach(() => {
    resetDevHqStore();
    triggerMock.mockReset();
    triggerMock.mockResolvedValue({ id: "run-1" });
  });

  afterEach(() => {
    if (originalToken === undefined) {
      delete process.env.DEV_HQ_INTERNAL_TOKEN;
    } else {
      process.env.DEV_HQ_INTERNAL_TOKEN = originalToken;
    }
  });

  it("fails closed with 503 when the internal token is not configured", async () => {
    delete process.env.DEV_HQ_INTERNAL_TOKEN;
    const response = await POST(request({ taskId: "task-dispatch-1" }));
    expect(response.status).toBe(503);
    expect(triggerMock).not.toHaveBeenCalled();
  });

  it("rejects a wrong token with 401", async () => {
    process.env.DEV_HQ_INTERNAL_TOKEN = TOKEN;
    const response = await POST(request({ taskId: "task-dispatch-1" }, "wrong"));
    expect(response.status).toBe(401);
    expect(triggerMock).not.toHaveBeenCalled();
  });

  it("returns 400 when taskId is missing", async () => {
    process.env.DEV_HQ_INTERNAL_TOKEN = TOKEN;
    const response = await POST(request({}, TOKEN));
    expect(response.status).toBe(400);
  });

  it("dispatches with a valid token", async () => {
    process.env.DEV_HQ_INTERNAL_TOKEN = TOKEN;
    const task = seedTask();
    const response = await POST(
      request(
        {
          taskId: task.id,
          requiredCapabilities: ["validation"],
          instructions: "do work",
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
