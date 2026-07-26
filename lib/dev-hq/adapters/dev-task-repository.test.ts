import { beforeEach, describe, expect, it } from "vitest";

import { createDevTaskRepository } from "@/lib/dev-hq/adapters/dev-task-repository";
import { resetDevHqStore, saveTask } from "@/lib/dev-hq/store";
import type { Task } from "@/types/domain";

const TS = "2026-07-24T21:00:00.000Z";

function seedTask(overrides?: Partial<Task>): Task {
  return saveTask({
    id: "task-1",
    projectId: "proj-x",
    workflowId: null,
    title: "A task",
    description: "Do the work.",
    status: "needs_revision",
    priority: "High",
    assigneeAgentId: null,
    claimedAt: null,
    createdAt: TS,
    updatedAt: TS,
    dueAt: null,
    ...overrides,
  });
}

describe("DevTaskRepository", () => {
  const repository = createDevTaskRepository();

  beforeEach(() => {
    resetDevHqStore();
  });

  // --- conditional status transition (Task 1E-5) ---
  describe("updateTaskStatusIf", () => {
    it("writes when the precondition holds", async () => {
      const task = seedTask();
      const updated = await repository.updateTaskStatusIf(
        task.id,
        "active",
        () => true,
      );
      expect(updated?.status).toBe("active");
      expect((await repository.getTask(task.id))?.status).toBe("active");
    });

    it("refuses the write when the precondition rejects", async () => {
      const task = seedTask();
      const result = await repository.updateTaskStatusIf(
        task.id,
        "active",
        () => false,
      );
      expect(result).toBeNull();
      // The prior status survives — this is the whole point of the operation.
      expect((await repository.getTask(task.id))?.status).toBe("needs_revision");
    });

    it("passes the current persisted task to the precondition", async () => {
      const task = seedTask();
      // A writer lands after the caller last read the task.
      saveTask({ ...task, status: "completed" });

      const seen: Task["status"][] = [];
      const result = await repository.updateTaskStatusIf(
        task.id,
        "active",
        (current) => {
          seen.push(current.status);
          return current.status === "needs_revision"; // the caller's stale expectation
        },
      );

      expect(seen).toEqual(["completed"]); // current, not stale
      expect(result).toBeNull();
      expect((await repository.getTask(task.id))?.status).toBe("completed");
    });

    it("evaluates the precondition and writes with no await between them", async () => {
      const task = seedTask();
      let statusDuringPrecondition: Task["status"] | undefined;

      // Start the transition but do not await it: an async function body runs
      // synchronously up to its first await, so if check and write commit
      // together the store is already updated before control returns here.
      const pending = repository.updateTaskStatusIf(task.id, "active", (c) => {
        statusDuringPrecondition = c.status;
        return true;
      });

      expect(statusDuringPrecondition).toBe("needs_revision");
      expect((await repository.getTask(task.id))?.status).toBe("active");
      await pending;
    });

    it("is a no-op when the task already holds the target status", async () => {
      const task = seedTask({ status: "active" });
      const result = await repository.updateTaskStatusIf(
        task.id,
        "active",
        () => true,
      );
      expect(result?.status).toBe("active");
      expect(result?.updatedAt).toBe(TS); // untouched, not re-stamped
    });

    it("returns null for a missing task without consulting the precondition", async () => {
      let called = false;
      const result = await repository.updateTaskStatusIf(
        "task-missing",
        "active",
        () => {
          called = true;
          return true;
        },
      );
      expect(result).toBeNull();
      expect(called).toBe(false);
    });
  });
});
