import { beforeEach, describe, expect, it } from "vitest";

import { createDevEscalationStore } from "@/lib/dev-hq/adapters/dev-escalation-store";
import { resetDevHqStore } from "@/lib/dev-hq/store";

describe("DevEscalationStore", () => {
  const store = createDevEscalationStore();

  beforeEach(() => {
    resetDevHqStore();
  });

  it("creates an open escalation with defaults", async () => {
    const escalation = await store.createEscalation({
      origin: "retry_exhausted",
      taskId: "task-1",
      executionId: "exec-1",
      summary: "budget spent",
    });
    expect(escalation.id).toBeTruthy();
    expect(escalation.status).toBe("open");
    expect(escalation.resolution).toBeNull();
    expect(escalation.reviewId).toBeNull();
    expect(escalation.resolvedAt).toBeNull();
    expect(await store.getEscalation(escalation.id)).toEqual(escalation);
  });

  it("dedupes creation per execution and origin, even after resolution", async () => {
    const first = await store.createEscalation({
      origin: "retry_exhausted",
      taskId: "t",
      executionId: "exec-1",
      summary: "first",
    });
    const again = await store.createEscalation({
      origin: "retry_exhausted",
      taskId: "t",
      executionId: "exec-1",
      summary: "second",
    });
    expect(again.id).toBe(first.id); // deduped

    await store.resolveEscalation({ escalationId: first.id, resolution: "accept" });
    const afterResolve = await store.createEscalation({
      origin: "retry_exhausted",
      taskId: "t",
      executionId: "exec-1",
      summary: "third",
    });
    expect(afterResolve.id).toBe(first.id); // still deduped after resolution
    expect(afterResolve.status).toBe("resolved");
  });

  it("lists open escalations and finds by execution", async () => {
    const a = await store.createEscalation({
      origin: "retry_exhausted",
      taskId: "t",
      executionId: "exec-1",
      summary: "a",
    });
    await store.createEscalation({
      origin: "retry_exhausted",
      taskId: "t",
      executionId: "exec-2",
      summary: "b",
    });
    expect(await store.listOpen()).toHaveLength(2);
    expect((await store.findOpenByExecution("exec-1"))?.id).toBe(a.id);
    expect(await store.findOpenByExecution("exec-missing")).toBeNull();
  });

  it("finds an escalation by execution and origin regardless of status", async () => {
    const escalation = await store.createEscalation({
      origin: "retry_exhausted",
      taskId: "t",
      executionId: "exec-1",
      summary: "a",
    });
    expect((await store.findByExecution("exec-1", "retry_exhausted"))?.id).toBe(
      escalation.id,
    );
    await store.resolveEscalation({ escalationId: escalation.id, resolution: "accept" });
    // findOpenByExecution excludes resolved; findByExecution still returns it.
    expect(await store.findOpenByExecution("exec-1")).toBeNull();
    expect((await store.findByExecution("exec-1", "retry_exhausted"))?.id).toBe(
      escalation.id,
    );
    expect(await store.findByExecution("exec-missing", "retry_exhausted")).toBeNull();
  });

  /**
   * F-5. `createEscalation` dedupes per (execution, origin), so that pair is the
   * identity of an escalation — and a lookup keyed on the execution alone answers
   * a different question than the writer asks. One escalation of any origin used
   * to hide every other one on the same execution.
   */
  it("does not report one origin's escalation when asked about another", async () => {
    const stall = await store.createEscalation({
      origin: "queue_stalled",
      taskId: "t",
      executionId: "exec-1",
      summary: "stalled",
    });

    expect((await store.findByExecution("exec-1", "queue_stalled"))?.id).toBe(
      stall.id,
    );
    expect(
      await store.findByExecution("exec-1", "retry_exhausted"),
      "a queue_stalled escalation was returned for a retry_exhausted lookup; a backstop asking whether this execution had exhausted its retries would skip raising the real escalation (F-5)",
    ).toBeNull();
    expect(
      await store.findByExecution("exec-1", "review_exhausted"),
    ).toBeNull();
  });

  it("resolves once, then returns null on repeat", async () => {
    const escalation = await store.createEscalation({
      origin: "retry_exhausted",
      taskId: "t",
      executionId: "exec-1",
      summary: "a",
    });
    const resolved = await store.resolveEscalation({
      escalationId: escalation.id,
      resolution: "accept",
    });
    expect(resolved?.status).toBe("resolved");
    expect(resolved?.resolution).toBe("accept");
    expect(
      await store.resolveEscalation({
        escalationId: escalation.id,
        resolution: "accept",
      }),
    ).toBeNull();
    expect(await store.listOpen()).toHaveLength(0);
    expect(await store.findOpenByExecution("exec-1")).toBeNull();
  });

  it("returns null resolving a missing escalation", async () => {
    expect(
      await store.resolveEscalation({
        escalationId: "esc-missing",
        resolution: "accept",
      }),
    ).toBeNull();
  });

  // --- canonical revision execution reservation (Task 1E-5) ---
  describe("reserveRevisionExecution", () => {
    async function seedEscalation() {
      return store.createEscalation({
        origin: "retry_exhausted",
        taskId: "t",
        executionId: "exec-1",
        summary: "a",
      });
    }

    it("defaults revisionExecutionId to null on creation", async () => {
      expect((await seedEscalation()).revisionExecutionId).toBeNull();
    });

    it("reserves once and never overwrites", async () => {
      const escalation = await seedEscalation();

      const first = await store.reserveRevisionExecution({
        escalationId: escalation.id,
        executionId: "exec-canonical",
      });
      expect(first).toBe("exec-canonical");
      expect((await store.getEscalation(escalation.id))?.revisionExecutionId).toBe(
        "exec-canonical",
      );

      // A later caller proposing a *different* id still receives the incumbent,
      // and the persisted value is unchanged.
      const second = await store.reserveRevisionExecution({
        escalationId: escalation.id,
        executionId: "exec-other",
      });
      expect(second).toBe("exec-canonical");
      expect((await store.getEscalation(escalation.id))?.revisionExecutionId).toBe(
        "exec-canonical",
      );
    });

    it("gives every concurrent caller the same id", async () => {
      const escalation = await seedEscalation();
      const reserved = await Promise.all(
        ["a", "b", "c", "d"].map((suffix) =>
          store.reserveRevisionExecution({
            escalationId: escalation.id,
            executionId: `exec-${suffix}`,
          }),
        ),
      );
      expect(new Set(reserved).size).toBe(1);
      expect(reserved[0]).toBe(
        (await store.getEscalation(escalation.id))?.revisionExecutionId,
      );
    });

    it("throws for a missing escalation", async () => {
      await expect(
        store.reserveRevisionExecution({
          escalationId: "esc-missing",
          executionId: "exec-canonical",
        }),
      ).rejects.toThrow("Escalation not found: esc-missing");
    });
  });
});
