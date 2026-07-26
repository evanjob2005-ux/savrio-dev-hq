import { beforeEach, describe, expect, it, vi } from "vitest";

const { triggerMock, failNext } = vi.hoisted(() => ({
  triggerMock: vi.fn(),
  // One-shot failure injection for the revise flow's creation primitives, so a
  // crash between reservation and creation/assignment can be reproduced exactly.
  failNext: { ensureExecution: false, ensureAssignment: false },
}));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: { trigger: triggerMock },
}));

// Wrap only the two create-or-get primitives; every other Execution Manager
// export passes through untouched.
vi.mock("@/lib/dev-hq/execution-manager", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/dev-hq/execution-manager")>();
  return {
    ...actual,
    ensureExecution: async (
      ...args: Parameters<typeof actual.ensureExecution>
    ) => {
      if (failNext.ensureExecution) {
        failNext.ensureExecution = false;
        throw new Error("injected failure during execution creation");
      }
      return actual.ensureExecution(...args);
    },
    ensureAssignment: async (
      ...args: Parameters<typeof actual.ensureAssignment>
    ) => {
      if (failNext.ensureAssignment) {
        failNext.ensureAssignment = false;
        throw new Error("injected failure during assignment");
      }
      return actual.ensureAssignment(...args);
    },
  };
});

import {
  raiseRetryExhaustionEscalation,
  resolveEscalation,
  revisionExecutionIdFor,
} from "@/lib/dev-hq/escalation-service";
import {
  dispatchAgentExecution,
  handleExecutionComplete,
  handleExecutionReclaim,
  handleExecutionRunning,
} from "@/lib/dev-hq/agent-execution-service";
import { getDevHqAdapters } from "@/lib/dev-hq/adapters";
import { ESCALATION_EVENT_TYPE, EXECUTION_EVENT_TYPE } from "@/lib/dev-hq/constants";
import {
  getAgent,
  getAssignment,
  getDevHqStore,
  resetDevHqStore,
  saveAgent,
  saveTask,
} from "@/lib/dev-hq/store";
import {
  cancelExecution,
  ensureExecution,
  getExecution,
} from "@/lib/dev-hq/execution-manager";
import type { Execution, Task } from "@/types/domain";

const TS = "2026-07-24T21:00:00.000Z";
const FAR_FUTURE = "2999-01-01T00:00:00.000Z";

function seedTask(id = "task-esc-1"): Task {
  return saveTask({
    id,
    projectId: "proj-x",
    workflowId: null,
    title: "Escalation task",
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

function failedExecution(overrides?: Partial<Execution>): Execution {
  return {
    id: "exec-fake",
    taskId: "task-esc-1",
    workflowId: null,
    agentId: "agent-supervisor",
    status: "failed",
    triggerRunId: null,
    startedAt: null,
    completedAt: TS,
    createdAt: TS,
    assignmentId: null,
    attempt: 3,
    ...overrides,
  };
}

/** Dispatch and drive an execution to retry exhaustion (all attempts fail). */
async function exhaust(taskId: string): Promise<string> {
  const dispatched = await dispatchAgentExecution({
    taskId,
    requiredCapabilities: ["validation"],
    instructions: "fail",
  });
  const executionId = dispatched.executionId!;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await handleExecutionRunning(executionId);
    await handleExecutionComplete({
      executionId,
      status: "failed",
      instructions: "fail",
    });
  }
  return executionId;
}

async function taskEvents(taskId: string) {
  return getDevHqAdapters().eventLogger.listRecent({
    entityType: "task",
    entityId: taskId,
    limit: 50,
  });
}

describe("escalation service", () => {
  beforeEach(() => {
    resetDevHqStore();
    let counter = 0;
    triggerMock.mockReset();
    triggerMock.mockImplementation(async () => ({ id: `run-${(counter += 1)}` }));
    failNext.ensureExecution = false;
    failNext.ensureAssignment = false;
  });

  it("creates an escalation from the approved failure condition (retry exhaustion)", async () => {
    const executionId = await exhaust(seedTask().id);

    const escalation =
      await getDevHqAdapters().escalationStore.findOpenByExecution(executionId);
    expect(escalation).not.toBeNull();
    expect(escalation!.origin).toBe("retry_exhausted");
    expect(escalation!.taskId).toBe("task-esc-1");

    const task = await getDevHqAdapters().taskRepository.getTask("task-esc-1");
    expect(task?.status).toBe("needs_revision");
  });

  it("does not escalate a succeeded execution", async () => {
    const dispatched = await dispatchAgentExecution({
      taskId: seedTask().id,
      requiredCapabilities: ["validation"],
      instructions: "do work",
    });
    await handleExecutionRunning(dispatched.executionId!);
    await handleExecutionComplete({
      executionId: dispatched.executionId!,
      status: "succeeded",
      instructions: "do work",
    });
    expect(await getDevHqAdapters().escalationStore.listOpen()).toHaveLength(0);
  });

  it("does not escalate a single failure that still has retry budget", async () => {
    const dispatched = await dispatchAgentExecution({
      taskId: seedTask().id,
      requiredCapabilities: ["validation"],
      instructions: "fail",
    });
    await handleExecutionRunning(dispatched.executionId!);
    await handleExecutionComplete({
      executionId: dispatched.executionId!,
      status: "failed",
      instructions: "fail",
    });
    expect(
      await getDevHqAdapters().escalationStore.findOpenByExecution(
        dispatched.executionId!,
      ),
    ).toBeNull();
  });

  it("does not create duplicate escalations on repeated processing", async () => {
    const executionId = await exhaust(seedTask().id);
    const failed = (await getExecution(executionId))!;

    await raiseRetryExhaustionEscalation(failed);
    await raiseRetryExhaustionEscalation(failed);

    expect(await getDevHqAdapters().escalationStore.listOpen()).toHaveLength(1);
  });

  it("emits exactly one escalation.raised event", async () => {
    await exhaust(seedTask().id);
    const raised = (await taskEvents("task-esc-1")).filter(
      (e) => e.type === ESCALATION_EVENT_TYPE.raised,
    );
    expect(raised).toHaveLength(1);
  });

  it("records exactly one escalation-creation evidence entry", async () => {
    await exhaust(seedTask().id);
    const evidence =
      await getDevHqAdapters().evidenceStore.listForTask("task-esc-1");
    expect(
      evidence.filter(
        (e) => e.label === "Escalation raised: retry budget exhausted",
      ),
    ).toHaveLength(1);
  });

  it("resolves an escalation idempotently and emits one resolution event", async () => {
    const executionId = await exhaust(seedTask().id);
    const escalation =
      (await getDevHqAdapters().escalationStore.findOpenByExecution(executionId))!;

    const first = await resolveEscalation(escalation.id, "revise");
    expect(first.status).toBe("resolved");
    expect(first.resolution).toBe("revise");
    expect(
      (await getDevHqAdapters().taskRepository.getTask("task-esc-1"))?.status,
    ).toBe("active"); // revise reopens for a fresh execution

    const second = await resolveEscalation(escalation.id, "revise");
    expect(second.status).toBe("resolved");

    const resolved = (await taskEvents("task-esc-1")).filter(
      (e) => e.type === ESCALATION_EVENT_TYPE.resolved,
    );
    expect(resolved).toHaveLength(1);
  });

  it("applies accept and abandon resolutions to the task", async () => {
    const executionId = await exhaust(seedTask().id);
    const escalation =
      (await getDevHqAdapters().escalationStore.findOpenByExecution(executionId))!;
    await resolveEscalation(escalation.id, "accept");
    expect(
      (await getDevHqAdapters().taskRepository.getTask("task-esc-1"))?.status,
    ).toBe("completed");
  });

  it("applies only the persisted winning resolution when a resolution loses the race", async () => {
    const executionId = await exhaust(seedTask().id);
    const adapters = getDevHqAdapters();
    const escalation =
      (await adapters.escalationStore.findOpenByExecution(executionId))!;

    // Race: the losing "abandon" request read the open escalation, then a
    // concurrent "accept" wins the store transition before "abandon" commits.
    const originalResolve = adapters.escalationStore.resolveEscalation.bind(
      adapters.escalationStore,
    );
    vi.spyOn(adapters.escalationStore, "resolveEscalation").mockImplementationOnce(
      async () => {
        await originalResolve({ escalationId: escalation.id, resolution: "accept" });
        return null; // "abandon" finds it already resolved
      },
    );

    const result = await resolveEscalation(escalation.id, "abandon");

    // The losing "abandon" verb must never be applied.
    expect(result.resolution).toBe("accept");
    expect(
      (await adapters.escalationStore.getEscalation(escalation.id))?.resolution,
    ).toBe("accept");
    expect(
      (await adapters.taskRepository.getTask("task-esc-1"))?.status,
    ).toBe("completed");

    const resolvedEvidence = (
      await adapters.evidenceStore.listForTask("task-esc-1")
    ).filter((e) => e.label.startsWith("Escalation resolved:"));
    expect(resolvedEvidence).toHaveLength(1);
    expect(resolvedEvidence[0].label).toBe("Escalation resolved: accept");

    const resolvedEvents = (await taskEvents("task-esc-1")).filter(
      (e) => e.type === ESCALATION_EVENT_TYPE.resolved,
    );
    expect(resolvedEvents).toHaveLength(1);
    expect(resolvedEvents[0].message).toContain("accept");
  });

  it("leaves retry and assignment behavior unchanged (escalation is additive)", async () => {
    const executionId = await exhaust(seedTask().id);
    const failed = (await getExecution(executionId))!;
    // Retry behavior: still fails after the 3-attempt budget.
    expect(failed.status).toBe("failed");
    expect(failed.attempt).toBe(3);
    // Assignment behavior: the last agent is freed on the terminal outcome.
    expect(getAgent(failed.agentId!)?.availability).toBe("available");
  });

  // --- Fix 1: no duplicate escalation after resolution ---
  it("does not re-create or re-open an escalation after resolution", async () => {
    const executionId = await exhaust(seedTask().id);
    const escalation =
      (await getDevHqAdapters().escalationStore.findOpenByExecution(executionId))!;
    await resolveEscalation(escalation.id, "accept");
    expect(
      (await getDevHqAdapters().taskRepository.getTask("task-esc-1"))?.status,
    ).toBe("completed");

    const reRaised = await raiseRetryExhaustionEscalation(
      (await getExecution(executionId))!,
    );
    expect(reRaised.id).toBe(escalation.id);
    expect(reRaised.status).toBe("resolved");
    expect(await getDevHqAdapters().escalationStore.listOpen()).toHaveLength(0);
    // The task is not re-opened to needs_revision.
    expect(
      (await getDevHqAdapters().taskRepository.getTask("task-esc-1"))?.status,
    ).toBe("completed");
  });

  // --- Fix 2: preconditions validated in the service ---
  it("rejects raising an escalation for a non-exhausted execution", async () => {
    const dispatched = await dispatchAgentExecution({
      taskId: seedTask().id,
      requiredCapabilities: ["validation"],
      instructions: "do work",
    });
    const running = await handleExecutionRunning(dispatched.executionId!);
    await expect(raiseRetryExhaustionEscalation(running)).rejects.toThrow(
      /not "failed"/,
    );
  });

  it("rejects raising when the retry budget is not exhausted", async () => {
    seedTask();
    await expect(
      raiseRetryExhaustionEscalation(failedExecution({ attempt: 1 })),
    ).rejects.toThrow(/budget not exhausted/);
  });

  // --- Fix 3: reconcile missing side effects on a retry ---
  it("reconciles missing side effects when the escalation already exists", async () => {
    seedTask(); // task-esc-1, status active
    // Simulate a partially-applied raise: the escalation record exists but the
    // task/evidence/event side effects were never applied.
    await getDevHqAdapters().escalationStore.createEscalation({
      origin: "retry_exhausted",
      taskId: "task-esc-1",
      executionId: "exec-recon",
      summary: "partial raise",
      raisedByAgentId: "agent-executive-orchestrator",
    });
    expect(
      (await getDevHqAdapters().taskRepository.getTask("task-esc-1"))?.status,
    ).toBe("active");

    await raiseRetryExhaustionEscalation(
      failedExecution({ id: "exec-recon", attempt: 3 }),
    );

    expect(
      (await getDevHqAdapters().taskRepository.getTask("task-esc-1"))?.status,
    ).toBe("needs_revision");
    expect(
      (await taskEvents("task-esc-1")).filter(
        (e) => e.type === ESCALATION_EVENT_TYPE.raised,
      ),
    ).toHaveLength(1);
    expect(
      (await getDevHqAdapters().evidenceStore.listForTask("task-esc-1")).filter(
        (e) => e.label === "Escalation raised: retry budget exhausted",
      ),
    ).toHaveLength(1);

    // Re-raising does not duplicate the reconciled side effects.
    await raiseRetryExhaustionEscalation(
      failedExecution({ id: "exec-recon", attempt: 3 }),
    );
    expect(
      (await taskEvents("task-esc-1")).filter(
        (e) => e.type === ESCALATION_EVENT_TYPE.raised,
      ),
    ).toHaveLength(1);
    expect(await getDevHqAdapters().escalationStore.listOpen()).toHaveLength(1);
  });

  // --- revise dispatch (Sprint 1E-5 approved blockers) ---
  //
  // Required invariant: exactly one canonical fresh execution per revise
  // escalation, under concurrency, execution-creation failure, assignment
  // failure, dispatch failure, and replay. The canonical execution id is treated
  // as opaque throughout — read from escalation.revisionExecutionId, or derived
  // via revisionExecutionIdFor(), never spelled out as a literal.
  describe("revise dispatch", () => {
    function executionsForTask(taskId: string) {
      return [...getDevHqStore().executions.values()].filter(
        (execution) => execution.taskId === taskId,
      );
    }

    /** Drive a task to retry exhaustion and return its open escalation. */
    async function exhaustAndEscalate(taskId = seedTask().id) {
      const executionId = await exhaust(taskId);
      const escalation = (await getDevHqAdapters().escalationStore.findOpenByExecution(
        executionId,
      ))!;
      return { taskId, executionId, escalation };
    }

    /** Executions for the task other than the exhausted original. */
    function revisions(taskId: string, originalExecutionId: string) {
      return executionsForTask(taskId).filter(
        (execution) => execution.id !== originalExecutionId,
      );
    }

    async function reload(escalationId: string) {
      return (await getDevHqAdapters().escalationStore.getEscalation(
        escalationId,
      ))!;
    }

    // A revision is a fresh attempt at the *same* authorized work, so it must
    // reproduce the restrictions that work carried. Losing them would let a
    // pinned or capability-restricted execution be revised into unrestricted
    // work under a different agent.
    describe("inherited routing and request", () => {
      /** A second agent of a different provider that also matches the policy. */
      function seedRivalProviderAgent(): void {
        const supervisor = getAgent("agent-supervisor")!;
        saveAgent({
          ...supervisor,
          id: "agent-rival",
          name: "Rival",
          provider: "vendor-y",
          // Most idle, so unpinned selection would prefer it.
          lastActiveAt: "2020-01-01T00:00:00.000Z",
        });
      }

      /** Exhaust a pinned, instruction-carrying execution and escalate it. */
      async function exhaustPinned(taskId: string) {
        const dispatched = await dispatchAgentExecution({
          taskId,
          requiredCapabilities: ["validation"],
          preferredAgentId: "agent-supervisor",
          instructions: "fail: review the reserved capacity path",
          idempotencyKey: "pinned-key-1",
        });
        const executionId = dispatched.executionId!;
        for (let attempt = 1; attempt <= 3; attempt += 1) {
          await handleExecutionRunning(executionId);
          await handleExecutionComplete({
            executionId,
            status: "failed",
            instructions: "fail: review the reserved capacity path",
          });
        }
        const escalation =
          (await getDevHqAdapters().escalationStore.findOpenByExecution(executionId))!;
        return { executionId, escalation };
      }

      it("carries the routing policy, provider pin, and request into the revision", async () => {
        const taskId = seedTask().id;
        const { executionId, escalation } = await exhaustPinned(taskId);
        const original = (await getExecution(executionId))!;
        expect(original.routing?.provider).toBe("internal");
        expect(original.request?.instructions).toBe(
          "fail: review the reserved capacity path",
        );

        await resolveEscalation(escalation.id, "revise");

        const revision = (await getExecution(revisionExecutionIdFor(escalation.id)))!;
        expect(revision.routing).toEqual(original.routing);
        expect(revision.request).toEqual(original.request);
        expect(revision.attempt).toBe(1);
      });

      it("dispatches the authorized request, not the task description as it stands now", async () => {
        const taskId = seedTask().id;
        const { escalation } = await exhaustPinned(taskId);
        // The task description drifts after the request was authorized.
        await getDevHqAdapters().taskRepository.updateTask(taskId, {
          description: "something else entirely",
        });
        triggerMock.mockClear();

        await resolveEscalation(escalation.id, "revise");

        const payload = triggerMock.mock.calls.at(-1)![1] as {
          instructions: string;
        };
        expect(payload.instructions).toBe(
          "fail: review the reserved capacity path",
        );
      });

      it("keeps the revision on the routed provider rather than a rival agent", async () => {
        const taskId = seedTask().id;
        const { escalation } = await exhaustPinned(taskId);
        // A more-idle agent of a different provider is now available; an unpinned
        // revision would drift onto it.
        seedRivalProviderAgent();

        await resolveEscalation(escalation.id, "revise");

        const revision = (await getExecution(revisionExecutionIdFor(escalation.id)))!;
        expect(revision.routing?.provider).toBe("internal");
        expect(revision.agentId).not.toBe("agent-rival");
        expect(getAgent(revision.agentId!)!.provider).toBe("internal");
      });

      it("re-queues rather than drifting when no agent satisfies the inherited pin", async () => {
        const taskId = seedTask().id;
        const { escalation } = await exhaustPinned(taskId);
        seedRivalProviderAgent();
        // Every agent of the routed provider disappears from the registry.
        for (const agent of [...getDevHqStore().agents.values()]) {
          if (agent.provider === "internal") {
            getDevHqStore().agents.delete(agent.id);
          }
        }

        await resolveEscalation(escalation.id, "revise");

        const revision = await getExecution(revisionExecutionIdFor(escalation.id));
        expect(revision?.agentId ?? null).toBeNull();
        expect(revision?.status).toBe("queued");
        // Recoverable, and still pinned for whenever capacity returns.
        expect(revision?.routing?.provider).toBe("internal");
      });
    });

    it("records the revise-created assignment exactly once, even after a sweep", async () => {
      const { taskId, executionId, escalation } = await exhaustAndEscalate();
      await resolveEscalation(escalation.id, "revise");

      const revision = (await getExecution(revisionExecutionIdFor(escalation.id)))!;
      const revisionAssignmentId = revision.assignmentId!;
      expect(revisionAssignmentId).toBeTruthy();

      async function assignedEventsFor(id: string) {
        const events = await getDevHqAdapters().eventLogger.listRecent({
          entityType: "execution",
          entityId: id,
          limit: 200,
        });
        return events.filter((e) => e.type === EXECUTION_EVENT_TYPE.assigned);
      }

      // One transition, recorded once, naming this assignment.
      const afterRevise = await assignedEventsFor(revision.id);
      expect(afterRevise).toHaveLength(1);
      expect(afterRevise[0].message).toContain(revisionAssignmentId);

      // The sweep inspects the same assignment and must not append a second.
      await handleExecutionReclaim();
      await handleExecutionReclaim();

      const afterSweeps = await assignedEventsFor(revision.id);
      expect(afterSweeps).toHaveLength(1);
      expect(afterSweeps[0].id).toBe(afterRevise[0].id);
      // The exhausted original keeps its own single assignment history.
      expect((await assignedEventsFor(executionId)).length).toBeGreaterThan(0);
      void taskId;
    });

    it("creates exactly one fresh execution at attempt 1 and dispatches it", async () => {
      const { executionId, escalation } = await exhaustAndEscalate();
      expect((await getExecution(executionId))!.status).toBe("failed");

      const triggerCallsBefore = triggerMock.mock.calls.length;
      await resolveEscalation(escalation.id, "revise");

      const fresh = revisions("task-esc-1", executionId);
      expect(fresh).toHaveLength(1); // exactly one new execution
      expect(fresh[0].attempt).toBe(1); // fresh execution retry budget (counter reset)
      expect(fresh[0].triggerRunId).toBeTruthy(); // dispatched via the existing flow
      expect(triggerMock.mock.calls.length).toBe(triggerCallsBefore + 1);

      // The canonical id is reserved on the escalation and is the execution's id.
      const reloaded = await reload(escalation.id);
      expect(reloaded.revisionExecutionId).toBe(fresh[0].id);
      expect(reloaded.revisionExecutionId).toBe(
        revisionExecutionIdFor(escalation.id),
      );

      // The task is reopened to active by revise.
      expect(
        (await getDevHqAdapters().taskRepository.getTask("task-esc-1"))?.status,
      ).toBe("active");
    });

    it("is idempotent: repeated revise never authorizes a second execution", async () => {
      const { escalation } = await exhaustAndEscalate();

      await resolveEscalation(escalation.id, "revise");
      const executionsAfterFirst = executionsForTask("task-esc-1").length;
      const callsAfterFirst = triggerMock.mock.calls.length;

      await resolveEscalation(escalation.id, "revise");
      await resolveEscalation(escalation.id, "revise");

      expect(executionsForTask("task-esc-1").length).toBe(executionsAfterFirst);
      expect(triggerMock.mock.calls.length).toBe(callsAfterFirst);
    });

    it("gives concurrent revise requests one execution, one assignment, one run", async () => {
      const { executionId, escalation } = await exhaustAndEscalate();
      const assignmentsBefore = getDevHqStore().agentAssignments.size;
      const triggerCallsBefore = triggerMock.mock.calls.length;

      // Four simultaneous founder revise requests, interleaving at every await.
      await Promise.all(
        [1, 2, 3, 4].map(() => resolveEscalation(escalation.id, "revise")),
      );

      const fresh = revisions("task-esc-1", executionId);
      expect(fresh).toHaveLength(1);
      expect(fresh[0].id).toBe((await reload(escalation.id)).revisionExecutionId);
      expect(getDevHqStore().agentAssignments.size).toBe(assignmentsBefore + 1);
      // One logical Trigger run: concurrent triggers share the assignment key.
      expect(
        new Set(
          triggerMock.mock.calls
            .slice(triggerCallsBefore)
            .map(([, , options]) => options?.idempotencyKey),
        ).size,
      ).toBeLessThanOrEqual(1);
      expect(fresh[0].triggerRunId).toBeTruthy();
    });

    it("recovers when execution creation fails after the id was reserved", async () => {
      const { executionId, escalation } = await exhaustAndEscalate();

      failNext.ensureExecution = true;
      await expect(resolveEscalation(escalation.id, "revise")).rejects.toThrow(
        "injected failure during execution creation",
      );

      // The id is reserved but the execution is missing — the exact state the
      // marker-first design could never recover from.
      const reserved = (await reload(escalation.id)).revisionExecutionId!;
      expect(reserved).toBeTruthy();
      expect(await getExecution(reserved)).toBeNull();
      expect(revisions("task-esc-1", executionId)).toHaveLength(0);

      // A replay notices the miss and recreates at the *same* id.
      await resolveEscalation(escalation.id, "revise");
      const fresh = revisions("task-esc-1", executionId);
      expect(fresh).toHaveLength(1);
      expect(fresh[0].id).toBe(reserved);
      expect(fresh[0].attempt).toBe(1);
      expect(fresh[0].triggerRunId).toBeTruthy();
      expect((await reload(escalation.id)).revisionExecutionId).toBe(reserved);
    });

    it("recovers when assignment fails after the execution exists", async () => {
      const { executionId, escalation } = await exhaustAndEscalate();

      failNext.ensureAssignment = true;
      await expect(resolveEscalation(escalation.id, "revise")).rejects.toThrow(
        "injected failure during assignment",
      );

      const reserved = (await reload(escalation.id)).revisionExecutionId!;
      const created = (await getExecution(reserved))!;
      expect(created.status).toBe("queued");
      expect(created.assignmentId).toBeNull(); // no assignment yet

      await resolveEscalation(escalation.id, "revise");
      const fresh = revisions("task-esc-1", executionId);
      expect(fresh).toHaveLength(1); // still exactly one
      expect(fresh[0].id).toBe(reserved);
      expect(fresh[0].assignmentId).toBeTruthy();
      expect(fresh[0].triggerRunId).toBeTruthy();
    });

    it("recovers a failed dispatch on replay, reusing the same assignment", async () => {
      const { executionId, escalation } = await exhaustAndEscalate();

      triggerMock.mockRejectedValueOnce(new Error("trigger unavailable"));
      await expect(resolveEscalation(escalation.id, "revise")).rejects.toThrow(
        "trigger unavailable",
      );

      const reserved = (await reload(escalation.id)).revisionExecutionId!;
      const created = (await getExecution(reserved))!;
      expect(created.status).toBe("queued");
      const assignmentId = created.assignmentId!;
      expect(getAssignment(assignmentId)?.triggerRunId).toBeNull();

      await resolveEscalation(escalation.id, "revise");
      const fresh = revisions("task-esc-1", executionId);
      expect(fresh).toHaveLength(1);
      expect(fresh[0].id).toBe(reserved);
      // Same assignment redispatched: no new attempt, no retry consumed.
      expect(fresh[0].assignmentId).toBe(assignmentId);
      expect(fresh[0].attempt).toBe(1);
      expect(getAssignment(assignmentId)?.triggerRunId).toBeTruthy();
    });

    it("recovers a failed dispatch via the queued-dispatch sweep", async () => {
      const { executionId, escalation } = await exhaustAndEscalate();

      triggerMock.mockRejectedValueOnce(new Error("trigger unavailable"));
      await expect(resolveEscalation(escalation.id, "revise")).rejects.toThrow(
        "trigger unavailable",
      );
      const reserved = (await reload(escalation.id)).revisionExecutionId!;
      const assignmentId = (await getExecution(reserved))!.assignmentId!;

      // The existing sweep already covers queued executions whose current
      // assignment was never dispatched — no revise-specific code needed.
      await handleExecutionReclaim(FAR_FUTURE);

      expect(getAssignment(assignmentId)?.triggerRunId).toBeTruthy();
      expect(revisions("task-esc-1", executionId)).toHaveLength(1);
      expect((await getExecution(reserved))!.assignmentId).toBe(assignmentId);
    });

    it("reserves an assignable execution when no agent is free", async () => {
      const { executionId, escalation } = await exhaustAndEscalate();
      // Occupy the whole pool: assignment must decline without side effects.
      for (const agent of [...getDevHqStore().agents.values()]) {
        saveAgent({ ...agent, availability: "busy" });
      }

      const triggerCallsBefore = triggerMock.mock.calls.length;
      await resolveEscalation(escalation.id, "revise"); // returns, does not throw

      const reserved = (await reload(escalation.id)).revisionExecutionId!;
      const created = (await getExecution(reserved))!;
      expect(created.status).toBe("queued");
      expect(created.agentId).toBeNull();
      expect(created.assignmentId).toBeNull();
      expect(triggerMock.mock.calls.length).toBe(triggerCallsBefore);

      // Freeing the pool and replaying assigns and dispatches the same execution.
      for (const agent of [...getDevHqStore().agents.values()]) {
        saveAgent({ ...agent, availability: "available" });
      }
      await resolveEscalation(escalation.id, "revise");

      const fresh = revisions("task-esc-1", executionId);
      expect(fresh).toHaveLength(1);
      expect(fresh[0].id).toBe(reserved);
      expect(fresh[0].triggerRunId).toBeTruthy();
    });

    it("does not resurrect a canonical revision that already terminated", async () => {
      const { executionId, escalation } = await exhaustAndEscalate();
      await resolveEscalation(escalation.id, "revise");
      const reserved = (await reload(escalation.id)).revisionExecutionId!;

      // Run the revision to success, then replay the resolution.
      const assignmentId = (await getExecution(reserved))!.assignmentId!;
      await handleExecutionRunning(reserved, assignmentId);
      await handleExecutionComplete({
        executionId: reserved,
        assignmentId,
        status: "succeeded",
        instructions: "do work",
      });
      expect((await getExecution(reserved))!.status).toBe("succeeded");

      const callsBefore = triggerMock.mock.calls.length;
      await resolveEscalation(escalation.id, "revise");

      expect(revisions("task-esc-1", executionId)).toHaveLength(1);
      expect((await getExecution(reserved))!.status).toBe("succeeded");
      expect(triggerMock.mock.calls.length).toBe(callsBefore);
      // The terminated revision is not re-assigned either.
      expect((await getExecution(reserved))!.assignmentId).toBe(assignmentId);
    });

    it("does not reopen a task whose canonical revision already terminated", async () => {
      const { escalation } = await exhaustAndEscalate();
      await resolveEscalation(escalation.id, "revise");
      const reserved = (await reload(escalation.id)).revisionExecutionId!;

      // Drive the revision itself to retry exhaustion: that raises a *new*
      // escalation and moves the task to needs_revision.
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        const asgn = (await getExecution(reserved))!.assignmentId!;
        await handleExecutionRunning(reserved, asgn);
        await handleExecutionComplete({
          executionId: reserved,
          assignmentId: asgn,
          status: "failed",
          instructions: "fail",
        });
      }
      expect((await getExecution(reserved))!.status).toBe("failed");
      expect(
        (await getDevHqAdapters().taskRepository.getTask("task-esc-1"))?.status,
      ).toBe("needs_revision");

      // Replaying the *old* revise must not drag the task back to active behind
      // the newer escalation's back.
      await resolveEscalation(escalation.id, "revise");

      expect(
        (await getDevHqAdapters().taskRepository.getTask("task-esc-1"))?.status,
      ).toBe("needs_revision");
    });

    // --- authoritative post-dispatch state (Codex: stale snapshot) ---
    //
    // ensureDispatchForAssignment documents that the worker may deliver its
    // running/terminal callbacks while tasks.trigger() is still in flight. A
    // pre-dispatch snapshot can therefore read "queued" for an execution that
    // has already terminated. The task status must follow the freshly persisted
    // execution, never that snapshot.
    describe("post-dispatch authoritative state", () => {
      /** Run `drive` inside tasks.trigger(), before it returns. */
      function triggerDrives(drive: () => Promise<void>) {
        triggerMock.mockImplementationOnce(async () => {
          await drive();
          return { id: "run-inflight" };
        });
      }

      async function currentAssignment(executionId: string) {
        return (await getExecution(executionId))!.assignmentId!;
      }

      async function taskStatus() {
        return (await getDevHqAdapters().taskRepository.getTask("task-esc-1"))
          ?.status;
      }

      /**
       * Burn the canonical revision's whole retry budget, so it ends terminally
       * failed and its own exhaustion escalation moves the task to
       * needs_revision.
       */
      async function driveToTerminalFailure(executionId: string) {
        for (let attempt = 1; attempt <= 3; attempt += 1) {
          const asgn = await currentAssignment(executionId);
          await handleExecutionRunning(executionId, asgn);
          await handleExecutionComplete({
            executionId,
            assignmentId: asgn,
            status: "failed",
            instructions: "fail",
          });
        }
      }

      it("does not activate the task when the revision succeeds mid-dispatch", async () => {
        const { escalation } = await exhaustAndEscalate();
        const canonical = revisionExecutionIdFor(escalation.id);
        expect(await taskStatus()).toBe("needs_revision");

        triggerDrives(async () => {
          const asgn = await currentAssignment(canonical);
          await handleExecutionRunning(canonical, asgn);
          await handleExecutionComplete({
            executionId: canonical,
            assignmentId: asgn,
            status: "succeeded",
            instructions: "do work",
          });
        });

        await resolveEscalation(escalation.id, "revise");

        expect((await getExecution(canonical))!.status).toBe("succeeded");
        expect(await taskStatus()).not.toBe("active");
        expect(await taskStatus()).toBe("needs_revision");
      });

      it("does not activate the task when the revision fails mid-dispatch", async () => {
        const { escalation } = await exhaustAndEscalate();
        const canonical = revisionExecutionIdFor(escalation.id);

        // Burn the whole retry budget inside the in-flight trigger, so the
        // revision is terminally failed by the time dispatch returns.
        triggerDrives(() => driveToTerminalFailure(canonical));

        await resolveEscalation(escalation.id, "revise");

        expect((await getExecution(canonical))!.status).toBe("failed");
        expect(await taskStatus()).not.toBe("active");
        // The revision's own exhaustion escalation owns the task state now.
        expect(await taskStatus()).toBe("needs_revision");
      });

      it("does not activate the task when the revision terminates while evidence is pending", async () => {
        const { escalation } = await exhaustAndEscalate();
        const canonical = revisionExecutionIdFor(escalation.id);
        const adapters = getDevHqAdapters();
        const original = adapters.evidenceStore.addEvidence.bind(
          adapters.evidenceStore,
        );

        // Terminate the revision *after* dispatch, during the descriptive
        // evidence write — the window after the last snapshot was taken.
        vi.spyOn(adapters.evidenceStore, "addEvidence").mockImplementation(
          async (input) => {
            if (input.uri === `escalation:${escalation.id}:revise-dispatch`) {
              const asgn = await currentAssignment(canonical);
              await handleExecutionRunning(canonical, asgn);
              await handleExecutionComplete({
                executionId: canonical,
                assignmentId: asgn,
                status: "succeeded",
                instructions: "do work",
              });
            }
            return original(input);
          },
        );

        await resolveEscalation(escalation.id, "revise");

        expect((await getExecution(canonical))!.status).toBe("succeeded");
        expect(await taskStatus()).not.toBe("active");
      });

      it("treats cancelled as terminal", async () => {
        const { escalation } = await exhaustAndEscalate();
        const canonical = revisionExecutionIdFor(escalation.id);

        triggerDrives(async () => {
          await cancelExecution(canonical);
        });

        await resolveEscalation(escalation.id, "revise");

        expect((await getExecution(canonical))!.status).toBe("cancelled");
        expect(await taskStatus()).not.toBe("active");
        expect(await taskStatus()).toBe("needs_revision");
      });

      it("treats running as live and activates the task", async () => {
        const { escalation } = await exhaustAndEscalate();
        const canonical = revisionExecutionIdFor(escalation.id);

        triggerDrives(async () => {
          await handleExecutionRunning(
            canonical,
            await currentAssignment(canonical),
          );
        });

        await resolveEscalation(escalation.id, "revise");

        expect((await getExecution(canonical))!.status).toBe("running");
        expect(await taskStatus()).toBe("active");
      });

      it("leaves a queued revision live and activates the task", async () => {
        const { escalation } = await exhaustAndEscalate();
        const canonical = revisionExecutionIdFor(escalation.id);

        await resolveEscalation(escalation.id, "revise");

        expect((await getExecution(canonical))!.status).toBe("queued");
        expect(await taskStatus()).toBe("active");
      });

      // The activation decision must be re-validated *at the moment it commits*.
      // A fresh read followed by an unguarded write still loses: the revision can
      // terminate, and a newer escalation can claim the task, in the gap between
      // the two.
      it("does not overwrite needs_revision when the revision terminates before activation commits", async () => {
        const { escalation } = await exhaustAndEscalate();
        const canonical = revisionExecutionIdFor(escalation.id);
        const adapters = getDevHqAdapters();
        const originalGetTask = adapters.taskRepository.getTask.bind(
          adapters.taskRepository,
        );
        let armed = false;
        let interfered = false;

        // Arm once the revision has been dispatched — it is queued and live, so
        // resolveEscalation is on its way to activating the task.
        triggerDrives(async () => {
          armed = true;
        });

        // Interfere inside the read that precedes the task-status write: the
        // caller receives the pre-interference (live) reading, and only then does
        // the world move on underneath it.
        vi.spyOn(adapters.taskRepository, "getTask").mockImplementation(
          async (id: string) => {
            const task = await originalGetTask(id);
            if (armed && !interfered && id === "task-esc-1") {
              interfered = true;
              await driveToTerminalFailure(canonical);
            }
            return task;
          },
        );

        await resolveEscalation(escalation.id, "revise");

        expect(interfered).toBe(true); // the race window was actually exercised
        expect((await getExecution(canonical))!.status).toBe("failed");
        // The newer escalation owns the task now; the in-flight activation must
        // not clobber it.
        expect(await taskStatus()).toBe("needs_revision");
        expect(await taskStatus()).not.toBe("active");
      });

      it("still activates for a live revision when nothing competes", async () => {
        const { escalation } = await exhaustAndEscalate();
        const canonical = revisionExecutionIdFor(escalation.id);
        expect(await taskStatus()).toBe("needs_revision");

        await resolveEscalation(escalation.id, "revise");

        // queued + no competing transition -> the guarded write commits.
        expect((await getExecution(canonical))!.status).toBe("queued");
        expect(await taskStatus()).toBe("active");
      });

      it("refuses a canonical-id collision without assigning, dispatching, or touching the task", async () => {
        const { escalation } = await exhaustAndEscalate();
        const canonical = revisionExecutionIdFor(escalation.id);
        seedTask("task-other");
        // Squat the canonical id with another task's execution.
        await ensureExecution({ executionId: canonical, taskId: "task-other" });

        const assignmentsBefore = getDevHqStore().agentAssignments.size;
        const triggerCallsBefore = triggerMock.mock.calls.length;
        const statusBefore = await taskStatus();
        expect(statusBefore).toBe("needs_revision");

        await expect(resolveEscalation(escalation.id, "revise")).rejects.toThrow(
          `Execution ${canonical} belongs to task task-other, not task-esc-1`,
        );

        expect(getDevHqStore().agentAssignments.size).toBe(assignmentsBefore);
        expect(triggerMock.mock.calls.length).toBe(triggerCallsBefore);
        expect(await taskStatus()).toBe(statusBefore);
        expect((await getExecution(canonical))!.taskId).toBe("task-other");
      });
    });

    it("records revise evidence after the execution exists, never as a gate", async () => {
      const { escalation } = await exhaustAndEscalate();
      await resolveEscalation(escalation.id, "revise");
      await resolveEscalation(escalation.id, "revise");

      const evidence = await getDevHqAdapters().evidenceStore.listForTask(
        "task-esc-1",
      );
      const marker = evidence.filter(
        (entry) => entry.uri === `escalation:${escalation.id}:revise-dispatch`,
      );
      expect(marker).toHaveLength(1); // written once, deduped
      // Attributed to real, already-created state rather than a pre-commitment.
      expect(marker[0].executionId).toBe(
        (await reload(escalation.id)).revisionExecutionId,
      );
    });

    it("still records evidence when the first dispatch failed", async () => {
      const { escalation } = await exhaustAndEscalate();

      triggerMock.mockRejectedValueOnce(new Error("trigger unavailable"));
      await expect(resolveEscalation(escalation.id, "revise")).rejects.toThrow(
        "trigger unavailable",
      );
      await resolveEscalation(escalation.id, "revise"); // recovery replay

      const evidence = await getDevHqAdapters().evidenceStore.listForTask(
        "task-esc-1",
      );
      expect(
        evidence.filter(
          (entry) => entry.uri === `escalation:${escalation.id}:revise-dispatch`,
        ),
      ).toHaveLength(1);
    });

    it("emits exactly one assignment event for the revision execution", async () => {
      const { escalation } = await exhaustAndEscalate();
      await resolveEscalation(escalation.id, "revise");
      const reserved = (await reload(escalation.id)).revisionExecutionId!;
      await resolveEscalation(escalation.id, "revise"); // replay must not duplicate

      const events = await getDevHqAdapters().eventLogger.listRecent({
        entityType: "execution",
        entityId: reserved,
        limit: 50,
      });
      expect(
        events.filter((event) => event.type === EXECUTION_EVENT_TYPE.assigned),
      ).toHaveLength(1);
    });
  });

  // --- Terminal-failure reconciliation (Grok/Codex findings) ---
  // Integration tests through the actual completion and reclaim service paths, not
  // by calling raiseRetryExhaustionEscalation directly.
  describe("terminal-failure reconciliation", () => {
    async function driveToThirdAttemptRunning(taskId: string) {
      const dispatched = await dispatchAgentExecution({
        taskId,
        requiredCapabilities: ["validation"],
        instructions: "fail",
      });
      const executionId = dispatched.executionId!;
      // Attempts 1 and 2 fail and re-queue.
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        const asgn = (await getExecution(executionId))!.assignmentId!;
        await handleExecutionRunning(executionId, asgn);
        await handleExecutionComplete({
          executionId,
          assignmentId: asgn,
          status: "failed",
          instructions: "fail",
        });
      }
      // Attempt 3 is running (final attempt of the budget).
      const asgn3 = (await getExecution(executionId))!.assignmentId!;
      await handleExecutionRunning(executionId, asgn3);
      return { executionId, asgn3 };
    }

    it("reconciles a terminal failure whose escalation was interrupted, idempotently", async () => {
      const { executionId, asgn3 } = await driveToThirdAttemptRunning(
        seedTask().id,
      );
      const adapters = getDevHqAdapters();

      // Inject a failure after the terminal transition but before escalation
      // creation: fail the first createEscalation, then delegate to the real one.
      const original = adapters.escalationStore.createEscalation.bind(
        adapters.escalationStore,
      );
      let createCalls = 0;
      const spy = vi
        .spyOn(adapters.escalationStore, "createEscalation")
        .mockImplementation(async (arg) => {
          createCalls += 1;
          if (createCalls === 1) {
            throw new Error("injected failure before escalation creation");
          }
          return original(arg);
        });

      // The third completion transitions the execution to "failed", then throws.
      await expect(
        handleExecutionComplete({
          executionId,
          assignmentId: asgn3,
          status: "failed",
          instructions: "fail",
        }),
      ).rejects.toThrow("injected failure");

      // Post-injection: execution is terminal and agent/assignment are released
      // (they happen atomically inside releaseExecution before the terminal
      // transition), but the escalation and task update are missing.
      const failed = (await getExecution(executionId))!;
      expect(failed.status).toBe("failed");
      expect(failed.attempt).toBe(3);
      expect(getAgent(failed.agentId!)?.availability).toBe("available");
      expect(getAssignment(asgn3)?.status).toBe("released");
      expect(
        await adapters.escalationStore.findOpenByExecution(executionId),
      ).toBeNull();
      expect(
        (await adapters.taskRepository.getTask("task-esc-1"))?.status,
      ).not.toBe("needs_revision");

      // Retry the SAME completion callback. It must NOT early-exit merely because
      // the execution is terminal; it must reconcile the missing side effects.
      const retry = await handleExecutionComplete({
        executionId,
        assignmentId: asgn3,
        status: "failed",
        instructions: "fail",
      });
      expect(retry.retried).toBe(false);

      // Everything reconciled: escalation, task status, event, evidence,
      // assignment release, and agent availability.
      expect(
        await adapters.escalationStore.findOpenByExecution(executionId),
      ).not.toBeNull();
      expect(
        (await adapters.taskRepository.getTask("task-esc-1"))?.status,
      ).toBe("needs_revision");
      expect(getAgent(failed.agentId!)?.availability).toBe("available");
      expect(getAssignment(asgn3)?.status).toBe("released");

      const execEvents = await adapters.eventLogger.listRecent({
        entityType: "execution",
        entityId: executionId,
        limit: 100,
      });
      expect(
        execEvents.filter((e) => e.type === EXECUTION_EVENT_TYPE.exhausted),
      ).toHaveLength(1);
      const escEvents = await adapters.eventLogger.listRecent({
        entityType: "task",
        entityId: "task-esc-1",
        limit: 100,
      });
      expect(
        escEvents.filter((e) => e.type === ESCALATION_EVENT_TYPE.raised),
      ).toHaveLength(1);
      const evidence =
        await adapters.evidenceStore.listForExecution(executionId);
      expect(
        evidence.filter((e) => e.label === "Execution attempt 3: failed"),
      ).toHaveLength(1);

      // Repeated retries remain idempotent — no duplicate escalation/event/evidence.
      await handleExecutionComplete({
        executionId,
        assignmentId: asgn3,
        status: "failed",
        instructions: "fail",
      });
      await handleExecutionComplete({
        executionId,
        assignmentId: asgn3,
        status: "failed",
        instructions: "fail",
      });
      expect(await adapters.escalationStore.listOpen()).toHaveLength(1);
      expect(
        (
          await adapters.eventLogger.listRecent({
            entityType: "task",
            entityId: "task-esc-1",
            limit: 100,
          })
        ).filter((e) => e.type === ESCALATION_EVENT_TYPE.raised),
      ).toHaveLength(1);
      expect(
        (
          await adapters.eventLogger.listRecent({
            entityType: "execution",
            entityId: executionId,
            limit: 100,
          })
        ).filter((e) => e.type === EXECUTION_EVENT_TYPE.exhausted),
      ).toHaveLength(1);
      expect(
        (await adapters.evidenceStore.listForExecution(executionId)).filter(
          (e) => e.label === "Execution attempt 3: failed",
        ),
      ).toHaveLength(1);

      spy.mockRestore();
    });

    it("self-heals a reclaim-exhausted escalation on the next sweep", async () => {
      const { executionId } = await driveToThirdAttemptRunning(seedTask().id);
      const adapters = getDevHqAdapters();

      // Inject a failure in escalation creation during the reclaim sweep.
      const original = adapters.escalationStore.createEscalation.bind(
        adapters.escalationStore,
      );
      let createCalls = 0;
      const spy = vi
        .spyOn(adapters.escalationStore, "createEscalation")
        .mockImplementation(async (arg) => {
          createCalls += 1;
          if (createCalls === 1) {
            throw new Error("injected failure before escalation creation");
          }
          return original(arg);
        });

      // The sweep reclaims the running attempt 3, exhausting it to "failed", then
      // fails while raising the escalation.
      await expect(handleExecutionReclaim(FAR_FUTURE)).rejects.toThrow(
        "injected failure",
      );

      const failed = (await getExecution(executionId))!;
      expect(failed.status).toBe("failed");
      expect(failed.attempt).toBe(3);
      expect(
        await adapters.escalationStore.findOpenByExecution(executionId),
      ).toBeNull();
      expect(
        (await adapters.taskRepository.getTask("task-esc-1"))?.status,
      ).not.toBe("needs_revision");

      // The next sweep reclaims nothing (the execution is terminal) but the
      // self-healing pass raises the missing escalation.
      const result = await handleExecutionReclaim(FAR_FUTURE);
      expect(result.reclaimed).toBe(0);
      expect(
        await adapters.escalationStore.findOpenByExecution(executionId),
      ).not.toBeNull();
      expect(
        (await adapters.taskRepository.getTask("task-esc-1"))?.status,
      ).toBe("needs_revision");

      // Idempotent across further sweeps.
      await handleExecutionReclaim(FAR_FUTURE);
      expect(await adapters.escalationStore.listOpen()).toHaveLength(1);
      expect(
        (
          await adapters.eventLogger.listRecent({
            entityType: "task",
            entityId: "task-esc-1",
            limit: 100,
          })
        ).filter((e) => e.type === ESCALATION_EVENT_TYPE.raised),
      ).toHaveLength(1);

      spy.mockRestore();
    });

    it("emits one reclaimed, exhausted, and raised event on reclaim exhaustion", async () => {
      const { executionId } = await driveToThirdAttemptRunning(seedTask().id);
      const adapters = getDevHqAdapters();

      // The sweep reclaims the running attempt 3, exhausting it to "failed".
      await handleExecutionReclaim(FAR_FUTURE);

      async function execEventTypes() {
        return (
          await adapters.eventLogger.listRecent({
            entityType: "execution",
            entityId: executionId,
            limit: 100,
          })
        ).map((e) => e.type);
      }
      async function raisedCount() {
        return (
          await adapters.eventLogger.listRecent({
            entityType: "task",
            entityId: "task-esc-1",
            limit: 100,
          })
        ).filter((e) => e.type === ESCALATION_EVENT_TYPE.raised).length;
      }

      let types = await execEventTypes();
      expect(types.filter((t) => t === EXECUTION_EVENT_TYPE.reclaimed)).toHaveLength(1);
      expect(types.filter((t) => t === EXECUTION_EVENT_TYPE.exhausted)).toHaveLength(1);
      expect(await raisedCount()).toBe(1);

      // Repeated reconciliation does not duplicate any of them.
      await handleExecutionReclaim(FAR_FUTURE);
      await handleExecutionReclaim(FAR_FUTURE);
      types = await execEventTypes();
      expect(types.filter((t) => t === EXECUTION_EVENT_TYPE.reclaimed)).toHaveLength(1);
      expect(types.filter((t) => t === EXECUTION_EVENT_TYPE.exhausted)).toHaveLength(1);
      expect(await raisedCount()).toBe(1);
    });
  });
});
