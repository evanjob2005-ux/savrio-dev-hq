import { beforeEach, describe, expect, it } from "vitest";

import { createDevEvidenceStore } from "@/lib/dev-hq/adapters/dev-evidence-store";
import { resetDevHqStore } from "@/lib/dev-hq/store";

describe("DevEvidenceStore", () => {
  const store = createDevEvidenceStore();

  beforeEach(() => {
    resetDevHqStore();
  });

  it("adds evidence with defaults and reads it back by id", async () => {
    const evidence = await store.addEvidence({
      executionId: "exec-1",
      taskId: "task-1",
      kind: "log",
      label: "Outcome",
      summary: "Succeeded.",
    });

    expect(evidence.id).toBeTruthy();
    expect(evidence.uri).toBeNull();
    expect(evidence.createdByAgentId).toBeNull();
    expect(evidence.createdAt).toBeTruthy();
    expect(await store.getEvidence(evidence.id)).toEqual(evidence);
    expect(await store.getEvidence("evd-missing")).toBeNull();
  });

  it("accepts evidence with no execution reference", async () => {
    const evidence = await store.addEvidence({
      taskId: "task-1",
      kind: "log",
      label: "System note",
      summary: "Not tied to an execution.",
    });
    expect(evidence.executionId).toBeNull();
    expect(await store.listForTask("task-1")).toHaveLength(1);
  });

  it("preserves supplied uri and agent id", async () => {
    const evidence = await store.addEvidence({
      executionId: "exec-1",
      taskId: "task-1",
      kind: "artifact",
      label: "Diff",
      summary: "Change set.",
      uri: "https://example.test/diff",
      createdByAgentId: "agent-supervisor",
    });
    expect(evidence.uri).toBe("https://example.test/diff");
    expect(evidence.createdByAgentId).toBe("agent-supervisor");
    expect(evidence.kind).toBe("artifact");
  });

  it("lists evidence by task and by execution, newest first", async () => {
    await store.addEvidence({
      executionId: "exec-1",
      taskId: "task-1",
      kind: "log",
      label: "A",
      summary: "first",
    });
    await store.addEvidence({
      executionId: "exec-2",
      taskId: "task-1",
      kind: "log",
      label: "B",
      summary: "second",
    });
    await store.addEvidence({
      executionId: "exec-1",
      taskId: "task-2",
      kind: "log",
      label: "C",
      summary: "third",
    });

    expect(await store.listForTask("task-1")).toHaveLength(2);
    expect(await store.listForExecution("exec-1")).toHaveLength(2);
    expect(await store.listForExecution("exec-2")).toHaveLength(1);
    expect(await store.listForTask("task-missing")).toEqual([]);
  });

  // URI-keyed create-or-get, mirroring the keyed event and keyed finding
  // patterns: uniqueness is a property of the write, not of a preceding read.
  describe("ensureEvidence", () => {
    function input(uri: string, label = "Outcome") {
      return {
        executionId: "exec-1",
        taskId: "task-1",
        kind: "log" as const,
        label,
        summary: "Succeeded.",
        uri,
      };
    }

    it("creates the row on first call and returns the same one on replay", async () => {
      const first = await store.ensureEvidence(input("review:rvw-1:outcome"));
      const replay = await store.ensureEvidence(
        input("review:rvw-1:outcome", "A different label"),
      );

      expect(replay.id).toBe(first.id);
      // The first writer's content is authoritative; a replay never rewrites it.
      expect(replay.label).toBe("Outcome");
      expect(await store.listForTask("task-1")).toHaveLength(1);
    });

    it("creates exactly one row under concurrent callers for one uri", async () => {
      const results = await Promise.all(
        Array.from({ length: 8 }, () =>
          store.ensureEvidence(input("review:rvw-1:finding:blocking-1")),
        ),
      );

      expect(new Set(results.map((evidence) => evidence.id)).size).toBe(1);
      expect(await store.listForTask("task-1")).toHaveLength(1);
    });

    it("still creates distinct rows for distinct uris", async () => {
      const a = await store.ensureEvidence(input("review:rvw-1:outcome"));
      const b = await store.ensureEvidence(input("review:rvw-1:finding:x"));

      expect(a.id).not.toBe(b.id);
      expect(await store.listForTask("task-1")).toHaveLength(2);
    });

    it("keeps unkeyed appends append-only", async () => {
      await store.addEvidence(input("review:rvw-1:outcome"));
      await store.addEvidence(input("review:rvw-1:outcome"));

      // addEvidence remains the append-only audit write; only ensureEvidence
      // claims uri uniqueness.
      expect(await store.listForTask("task-1")).toHaveLength(2);
    });
  });
});
