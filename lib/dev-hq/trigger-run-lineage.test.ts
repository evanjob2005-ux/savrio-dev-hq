// P-1 D-4: characterizes the triggerRunId lineage limitation.
//
// triggerRunId is a single nullable field, declared at
// types/domain/founder-request-workflow.ts:30 for WorkflowRunRecord and at
// types/domain/execution.ts for Execution. Two writes carry it per founder
// request — workflowEngine.markExecutionRunning (founder-request-service.ts:135-138)
// and workflowRunRepository.updateRun (:139-144) — and each lands on a different
// record. WorkflowRunPatch permits patching triggerRunId, so a later overwrite is
// legal, silent, and unrecoverable.
//
// This is the constraint any future lineage model must address. P-1 records it; it
// proposes nothing.

import { beforeEach, describe, expect, it, vi } from "vitest";

interface SdkHooks {
  trigger: (id: string, payload: unknown) => Promise<{ id: string }>;
  completeToken: (
    tokenId: string,
    payload: unknown,
  ) => Promise<{ success: boolean }>;
}

const { hooks } = vi.hoisted(() => ({ hooks: {} as SdkHooks }));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: {
    trigger: (id: string, payload: unknown) => hooks.trigger(id, payload),
  },
  wait: {
    completeToken: (tokenId: string, payload: unknown) =>
      hooks.completeToken(tokenId, payload),
  },
}));

import { getDevHqAdapters, resetDevHqAdapters } from "@/lib/dev-hq/adapters";
import {
  createFounderRequest,
  getDevHqStateSnapshot,
} from "@/lib/dev-hq/founder-request-service";
import { resetDevHqStore } from "@/lib/dev-hq/store";
import type { Execution, WorkflowRunRecord } from "@/types/domain";

const FIRST_RUN_ID = "run_lineage_first";
const SECOND_RUN_ID = "run_lineage_second";

async function createRequest() {
  return createFounderRequest({
    title: "Lineage characterization",
    description: "Record how triggerRunId is written and overwritten.",
    priority: "Medium",
  });
}

describe("triggerRunId lineage limitation", () => {
  beforeEach(() => {
    resetDevHqStore();
    resetDevHqAdapters();
    hooks.trigger = async () => ({ id: FIRST_RUN_ID });
    hooks.completeToken = async () => ({ success: true });
  });

  it("types triggerRunId as a single nullable string, not a collection", () => {
    const absent: WorkflowRunRecord["triggerRunId"] = null;
    const present: WorkflowRunRecord["triggerRunId"] = FIRST_RUN_ID;
    const onExecution: Execution["triggerRunId"] = null;

    // @ts-expect-error a list of runs is not representable on the current field.
    const lineage: WorkflowRunRecord["triggerRunId"] = [
      FIRST_RUN_ID,
      SECOND_RUN_ID,
    ];

    expect(absent).toBeNull();
    expect(present).toBe(FIRST_RUN_ID);
    expect(onExecution).toBeNull();
    // The @ts-expect-error above is the assertion; tsc --noEmit discharges it.
    expect(Array.isArray(lineage)).toBe(true);
  });

  it("carries triggerRunId on exactly two writes per founder request, to two different records", async () => {
    const adapters = getDevHqAdapters();
    const writes: Array<{ via: string; triggerRunId: string | null }> = [];

    const engine = adapters.workflowEngine;
    const originalMarkRunning = engine.markExecutionRunning.bind(engine);
    vi.spyOn(engine, "markExecutionRunning").mockImplementation(
      async (executionId, input) => {
        if (input?.triggerRunId !== undefined) {
          writes.push({
            via: "workflowEngine.markExecutionRunning -> Execution",
            triggerRunId: input.triggerRunId,
          });
        }
        return originalMarkRunning(executionId, input);
      },
    );

    const repo = adapters.workflowRunRepository;
    const originalUpdateRun = repo.updateRun.bind(repo);
    vi.spyOn(repo, "updateRun").mockImplementation(
      async (executionId, patch, options) => {
        if (patch.triggerRunId !== undefined) {
          writes.push({
            via: "workflowRunRepository.updateRun -> WorkflowRunRecord",
            triggerRunId: patch.triggerRunId,
          });
        }
        return originalUpdateRun(executionId, patch, options);
      },
    );

    const created = await createRequest();

    expect(writes).toEqual([
      {
        via: "workflowEngine.markExecutionRunning -> Execution",
        triggerRunId: FIRST_RUN_ID,
      },
      {
        via: "workflowRunRepository.updateRun -> WorkflowRunRecord",
        triggerRunId: FIRST_RUN_ID,
      },
    ]);

    // Two writes, two separate single-valued fields holding the same id.
    const execution = await adapters.workflowEngine.getExecution(
      created.execution.id,
    );
    const run = await adapters.workflowRunRepository.getRun(
      created.execution.id,
    );
    expect(execution?.triggerRunId).toBe(FIRST_RUN_ID);
    expect(run?.triggerRunId).toBe(FIRST_RUN_ID);
  });

  it("silently overwrites a prior triggerRunId and retains no lineage", async () => {
    const created = await createRequest();
    const { workflowEngine, workflowRunRepository } = getDevHqAdapters();

    const runBefore = await workflowRunRepository.getRun(created.execution.id);
    expect(runBefore?.triggerRunId).toBe(FIRST_RUN_ID);

    // WorkflowRunPatch permits triggerRunId, so this overwrite is legal, requires
    // no authorization, emits nothing, and returns normally.
    const runAfter = await workflowRunRepository.updateRun(
      created.execution.id,
      { triggerRunId: SECOND_RUN_ID },
    );
    expect(runAfter.triggerRunId).toBe(SECOND_RUN_ID);

    // The first run id is unrecoverable from the record: no history field holds it.
    expect(JSON.stringify(runAfter)).not.toContain(FIRST_RUN_ID);

    // The Execution record behaves identically.
    const executionAfter = await workflowEngine.markExecutionRunning(
      created.execution.id,
      { triggerRunId: SECOND_RUN_ID },
    );
    expect(executionAfter.triggerRunId).toBe(SECOND_RUN_ID);
    expect(JSON.stringify(executionAfter)).not.toContain(FIRST_RUN_ID);

    // Nothing on the timeline records that a run id was replaced, so the founder
    // has no way to observe that the earlier run ever existed.
    const state = await getDevHqStateSnapshot();
    expect(
      state.events.some((event) => event.message.includes(FIRST_RUN_ID)),
    ).toBe(false);
    expect(
      state.events.some((event) => event.message.includes(SECOND_RUN_ID)),
    ).toBe(false);
    expect(
      state.workflowRuns.find((r) => r.executionId === created.execution.id)
        ?.triggerRunId,
    ).toBe(SECOND_RUN_ID);
  });
});
