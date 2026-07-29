// NBF-2 (F-3). The escalation half of the ARCH-02 coordination records its
// refusals.
//
// ARCH-02 made both `Task.status` orchestrators write through
// `updateTaskStatusIf`. The founder-request side then recorded a
// `TASK_STATUS_REFUSED_EVENT_TYPE` entry when its precondition refused. The
// escalation side discarded the `Task | null` from `updateTaskStatusIf` — in
// `ensureTaskStatus` and again in `activateTaskForLiveRevision` — and recorded
// nothing.
//
// The reasoning is already written down, on the constant itself, in terms that
// never named a flow: "an unrecorded divergence is indistinguishable from one
// that never happened." It applies identically to both sides.
//
// Falsifiable claim under test: when an escalation lifecycle transition's
// conditional `Task.status` write is refused, exactly one
// `task.status_write_refused` event is recorded against the task, naming the
// escalation, the status it wanted, and the status the task actually holds.
//
// Null arm (STD-CTRL-001 rule 2): from an identical starting state, a transition
// whose write is APPLIED records no such event — so a suite satisfied by a
// logger that fires unconditionally cannot pass.

import { beforeEach, describe, expect, it, vi } from "vitest";

const { triggerMock } = vi.hoisted(() => ({
  triggerMock: vi.fn(async () => ({ id: "run-refusal-1" })),
}));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: { trigger: triggerMock },
}));

import { getDevHqAdapters, resetDevHqAdapters } from "@/lib/dev-hq/adapters";
import { TASK_STATUS_REFUSED_EVENT_TYPE } from "@/lib/dev-hq/constants";
import {
  raiseRetryExhaustionEscalation,
  resolveEscalation,
} from "@/lib/dev-hq/escalation-service";
import { resetDevHqStore, saveTask } from "@/lib/dev-hq/store";
import type { Escalation, Execution, Task } from "@/types/domain";

const TS = "2026-07-29T09:00:00.000Z";
const TASK_ID = "task-refusal";

function seedTask(): Task {
  return saveTask({
    id: TASK_ID,
    projectId: "proj-x",
    workflowId: null,
    title: "Work under two escalations",
    description: "Do the work.",
    status: "active",
    priority: "High",
    assigneeAgentId: null,
    claimedAt: null,
    createdAt: TS,
    updatedAt: TS,
    dueAt: null,
  });
}

function exhaustedExecution(id: string): Execution {
  return {
    id,
    taskId: TASK_ID,
    workflowId: null,
    agentId: "agent-supervisor",
    status: "failed",
    triggerRunId: null,
    startedAt: null,
    completedAt: TS,
    createdAt: TS,
    assignmentId: null,
    attempt: 3,
  };
}

function raiseOn(executionId: string): Promise<Escalation> {
  return raiseRetryExhaustionEscalation(exhaustedExecution(executionId));
}

async function statusOf(): Promise<Task["status"] | undefined> {
  return (await getDevHqAdapters().taskRepository.getTask(TASK_ID))?.status;
}

/** Every recorded refusal on the task, newest last, as plain messages. */
async function refusals(): Promise<string[]> {
  const events = await getDevHqAdapters().eventLogger.listRecent({
    entityType: "task",
    limit: 200,
  });
  return events
    .filter(
      (event) =>
        event.type === TASK_STATUS_REFUSED_EVENT_TYPE &&
        event.entityId === TASK_ID,
    )
    .map((event) => event.message);
}

describe("escalation task-status refusals reach the timeline (NBF-2)", () => {
  beforeEach(() => {
    resetDevHqStore();
    resetDevHqAdapters();
    triggerMock.mockClear();
    seedTask();
  });

  /**
   * The refusal `ensureResolvedTaskStatus` produces, reached exactly as P0-3
   * documents it: E1 and E2 are both open, and E1's accept is refused because
   * E2's decision is still outstanding.
   *
   * The refusal is correct. What was missing is any record of it: the escalation
   * reads `resolved: accept` while the task does not say `completed`, and
   * nothing anywhere says why.
   */
  it("records the refusal when a resolution cannot take the task", async () => {
    const first = await raiseOn("exec-refused-1");
    await raiseOn("exec-refused-2"); // still open, so it holds the task

    await resolveEscalation(first.id, "accept");

    expect(await statusOf()).toBe("needs_revision");
    const recorded = await refusals();
    expect(
      recorded,
      `escalation ${first.id} resolved "accept" while task ${TASK_ID} stayed "needs_revision", and the divergence left no record at all — it is indistinguishable from one that never happened (NBF-2)`,
    ).toHaveLength(1);
    expect(recorded[0]).toContain(first.id);
    expect(recorded[0]).toContain('to "completed"');
    expect(recorded[0]).toContain('now reads "needs_revision"');
  });

  /**
   * The refusal `activateTaskForLiveRevision` produces — the other discarded
   * return value, on the other transition. A superseded `revise` replay is
   * refused by the recency check (P0-3), and recorded nothing.
   */
  it("records the refusal when a superseded revise cannot reopen the task", async () => {
    const first = await raiseOn("exec-revise-1");
    const second = await raiseOn("exec-revise-2");

    // E1 revises. E2 is still open, so nothing is applied yet.
    await resolveEscalation(first.id, "revise");
    // E2 abandons: nothing is outstanding, so the task becomes rejected and E2
    // is now the newest decision on it.
    await resolveEscalation(second.id, "abandon");
    expect(await statusOf()).toBe("rejected");

    const before = await refusals();
    // E1's request is retried — a duplicate POST, a client retry, a
    // reconciliation. Correctly refused; previously in silence.
    await resolveEscalation(first.id, "revise");

    expect(
      await statusOf(),
      "a superseded revise reopened an abandoned task; that is P0-3, not NBF-2",
    ).toBe("rejected");
    const added = (await refusals()).filter(
      (message) => !before.includes(message),
    );
    expect(
      added,
      `a superseded revise of escalation ${first.id} was refused and left no record; the task reads "rejected" while the escalation reads "resolved: revise" and nothing says which decision won (NBF-2)`,
    ).toHaveLength(1);
    expect(added[0]).toContain(first.id);
    expect(added[0]).toContain('to "active"');
    expect(added[0]).toContain("superseded");
  });

  /**
   * One entry per (escalation, intended status). A replayed refusal is the same
   * refusal, not a second one — the same rule the founder-request side's dedupe
   * key states.
   */
  it("records one entry however many times the same refusal replays", async () => {
    const first = await raiseOn("exec-dedupe-1");
    await raiseOn("exec-dedupe-2");

    await resolveEscalation(first.id, "accept");
    await resolveEscalation(first.id, "accept");
    await resolveEscalation(first.id, "accept");

    expect(await refusals()).toHaveLength(1);
  });

  // --- null arm (STD-CTRL-001 rule 2) ---------------------------------------

  /**
   * NULL ARM 1. Identical starting state and identical call, differing only in
   * that no second escalation holds the task — so the write is APPLIED. It must
   * record nothing, or the assertions above are satisfied by a logger that fires
   * on every transition regardless of outcome.
   */
  it("null arm: an applied resolution records no refusal", async () => {
    const only = await raiseOn("exec-applied-1");

    await resolveEscalation(only.id, "accept");

    expect(await statusOf()).toBe("completed");
    expect(
      await refusals(),
      "a refusal was recorded for a task-status write that actually landed; the record does not measure refusal",
    ).toEqual([]);
  });

  /**
   * NULL ARM 2. The same shape for the other transition: a `revise` that is the
   * newest decision reopens the task, and records no refusal.
   */
  it("null arm: an applied revise reopens the task and records no refusal", async () => {
    const only = await raiseOn("exec-applied-2");
    expect(await statusOf()).toBe("needs_revision");

    await resolveEscalation(only.id, "revise");

    expect(await statusOf()).toBe("active");
    expect(await refusals()).toEqual([]);
  });

  /**
   * NULL ARM 3. A raise whose `needs_revision` write lands normally. This is the
   * `ensureEscalatedTaskStatus` path, the third caller of the changed helper,
   * and it runs on every escalation the system raises — so a spurious entry here
   * would put a false divergence on every timeline in the product.
   */
  it("null arm: raising an escalation records no refusal", async () => {
    await raiseOn("exec-applied-3");

    expect(await statusOf()).toBe("needs_revision");
    expect(await refusals()).toEqual([]);
  });
});
