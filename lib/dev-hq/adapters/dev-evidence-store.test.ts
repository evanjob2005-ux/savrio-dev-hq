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
});
