// P-1 D-4, carried onto P-2's lineage model.
//
// P-1 recorded the limitation: triggerRunId is a single nullable field, declared
// on WorkflowRunRecord and on Execution. Two writes carry it per founder request
// — workflowEngine.markExecutionRunning and workflowRunRepository.updateRun — and
// each lands on a DIFFERENT record. It is not written twice onto one field.
// WorkflowRunPatch permitted patching triggerRunId, so a later overwrite was
// legal, silent, and unrecoverable.
//
// P-2 keeps every part of that shape except the last. Both fields are still
// single-valued, both records still get one write, and an overwrite is still
// legal — what changed is that it is no longer unrecoverable. The repository owns
// an append-only lineage that both records' writes land in, so the id that was
// displaced is still there afterwards, and the second run the split workflow
// introduces has a field of its own rather than displacing the first.

import { beforeEach, describe, expect, it, vi } from "vitest";

interface SdkHooks {
  trigger: (
    id: string,
    payload: unknown,
    options?: { idempotencyKey?: string },
  ) => Promise<unknown>;
}

const { hooks } = vi.hoisted(() => ({ hooks: {} as SdkHooks }));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: {
    trigger: (
      id: string,
      payload: unknown,
      options?: { idempotencyKey?: string },
    ) => hooks.trigger(id, payload, options),
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

describe("triggerRunId lineage", () => {
  beforeEach(() => {
    resetDevHqStore();
    resetDevHqAdapters();
    hooks.trigger = async () => ({ id: FIRST_RUN_ID });
  });

  it("types triggerRunId as a single nullable string, not a collection", () => {
    const absent: WorkflowRunRecord["triggerRunId"] = null;
    const present: WorkflowRunRecord["triggerRunId"] = FIRST_RUN_ID;
    const onExecution: Execution["triggerRunId"] = null;

    // @ts-expect-error a list of runs is not representable on this field, and is
    // not meant to be: the lineage is a separate field, not a widening of this one.
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

    // Both writes are in the lineage, each naming the record it landed on, so
    // neither record's field is the only place its own id survives.
    expect(
      run?.runLineage.map((entry) => ({
        runId: entry.runId,
        role: entry.role,
        record: entry.record,
      })),
    ).toEqual([
      { runId: FIRST_RUN_ID, role: "initial", record: "execution" },
      { runId: FIRST_RUN_ID, role: "initial", record: "workflow_run" },
    ]);
  });

  it("retains a displaced triggerRunId in the lineage instead of losing it", async () => {
    const created = await createRequest();
    const { workflowEngine, workflowRunRepository } = getDevHqAdapters();

    const runBefore = await workflowRunRepository.getRun(created.execution.id);
    expect(runBefore?.triggerRunId).toBe(FIRST_RUN_ID);

    // WorkflowRunPatch still permits triggerRunId, so this overwrite is still
    // legal, requires no authorization, and returns normally. That was never the
    // defect on its own.
    const runAfter = await workflowRunRepository.updateRun(
      created.execution.id,
      { triggerRunId: SECOND_RUN_ID },
    );
    expect(runAfter.triggerRunId).toBe(SECOND_RUN_ID);

    // The defect was that the first id became unrecoverable. It no longer is:
    // the record still carries it, in order, alongside the id that replaced it.
    expect(JSON.stringify(runAfter)).toContain(FIRST_RUN_ID);
    expect(runAfter.runLineage.map((entry) => entry.runId)).toEqual([
      FIRST_RUN_ID,
      FIRST_RUN_ID,
      SECOND_RUN_ID,
    ]);

    // The Execution record is single-valued too, and its write is recorded the
    // same way — the engine owns the field, the lineage owns the history.
    const executionAfter = await workflowEngine.markExecutionRunning(
      created.execution.id,
      { triggerRunId: SECOND_RUN_ID },
    );
    expect(executionAfter.triggerRunId).toBe(SECOND_RUN_ID);
    expect(JSON.stringify(executionAfter)).not.toContain(FIRST_RUN_ID);
    await workflowRunRepository.appendRunLineage(created.execution.id, {
      runId: SECOND_RUN_ID,
      role: "initial",
      record: "execution",
    });

    const state = await getDevHqStateSnapshot();
    const stateRun = state.workflowRuns.find(
      (r) => r.executionId === created.execution.id,
    );
    expect(stateRun?.triggerRunId).toBe(SECOND_RUN_ID);
    expect(
      stateRun?.runLineage.filter((entry) => entry.runId === FIRST_RUN_ID),
    ).toHaveLength(2);
    expect(
      stateRun?.runLineage.filter((entry) => entry.record === "execution"),
    ).toHaveLength(2);

    // The timeline still says nothing about run ids. The lineage is the record of
    // what happened to them, and it is served in state rather than narrated.
    expect(
      state.events.some((event) => event.message.includes(FIRST_RUN_ID)),
    ).toBe(false);
    expect(
      state.events.some((event) => event.message.includes(SECOND_RUN_ID)),
    ).toBe(false);
  });

  it("gives the continuation run a field of its own rather than displacing the first", async () => {
    const created = await createRequest();
    const { workflowRunRepository } = getDevHqAdapters();

    const run = await workflowRunRepository.updateRun(created.execution.id, {
      continuationRunId: SECOND_RUN_ID,
    });

    expect(run.triggerRunId).toBe(FIRST_RUN_ID);
    expect(run.continuationRunId).toBe(SECOND_RUN_ID);
    expect(run.runLineage.at(-1)).toMatchObject({
      runId: SECOND_RUN_ID,
      role: "continuation",
      record: "workflow_run",
    });
  });

  it("does not let a caller rewrite the lineage through a patch", () => {
    // runLineage is omitted from WorkflowRunPatch. History that a caller could
    // overwrite would not be history.
    const patch: import("@/types/contracts").WorkflowRunPatch = {
      // @ts-expect-error runLineage is not patchable.
      runLineage: [],
    };
    expect(patch).toBeDefined();
  });
});
