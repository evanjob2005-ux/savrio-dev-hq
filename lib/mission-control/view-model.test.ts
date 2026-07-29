import { describe, expect, it } from "vitest";

import { MISSION_CONTROL_PLACEHOLDERS } from "@/data/placeholders/mission-control";
import { COLORS } from "@/lib/theme";
import {
  buildCommandCenterModel,
  buildStageProgress,
} from "@/lib/mission-control/view-model";
import type { DevHqState } from "@/lib/dev-hq/types";
import type {
  Approval,
  Event,
  Execution,
  Project,
  Task,
  Workflow,
  WorkflowRunRecord,
} from "@/types/domain";

/**
 * UI-03 — `view-model.ts` derives the entire founder-facing screen and had no
 * direct test. Everything it produces was covered only incidentally, through
 * components that render it.
 *
 * The cases below are chosen by consequence, not by line count. In order:
 *
 *  1. `actionable`, which decides whether the Approve and Reject buttons work at
 *     all, and whose four branches are the least obvious code in the file.
 *  2. `buildStageProgress` for a failed run, which must not claim progress
 *     through stages it has no record of.
 *  3. `runOutcome`, which is the sentence the founder reads about a finished
 *     run — a validation rejection and an approval both land on stage
 *     `completed` and must not read alike.
 *  4. The work buckets, where a task can be counted twice or vanish.
 *  5. The audit trail, which must show an absent record as absent.
 *  6. The executive summary's status precedence, which is the page's headline.
 *
 * The empty-state case at the top is the null arm for all of it: a model that
 * silently returned nothing would satisfy most "does not contain" assertions
 * below, and this fixes what nothing actually looks like.
 */

// ---- Fixtures ----------------------------------------------------------------

const T = "2026-07-29T09:00:00.000Z";

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: "prj-1",
    name: "Dev HQ",
    slug: "dev-hq",
    description: "Fixture project.",
    repository: "savrio-dev-hq",
    defaultBranch: "main",
    status: "active",
    ownerId: "usr-founder",
    createdAt: T,
    updatedAt: T,
    ...overrides,
  };
}

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: "tsk-1",
    projectId: "prj-1",
    workflowId: "wf-1",
    title: "Ship the onboarding revision",
    description: "Fixture task.",
    status: "active",
    priority: "Medium",
    assigneeAgentId: null,
    claimedAt: null,
    createdAt: T,
    updatedAt: T,
    dueAt: null,
    ...overrides,
  };
}

function run(overrides: Partial<WorkflowRunRecord> = {}): WorkflowRunRecord {
  return {
    executionId: "exe-1",
    taskId: "tsk-1",
    projectId: "prj-1",
    workflowId: "wf-1",
    stage: "executive_review",
    triggerRunId: null,
    continuationRunId: null,
    runLineage: [],
    reviewSummary: null,
    decision: null,
    continuation: "not_attempted",
    continuationDetail: null,
    rejectionKind: null,
    updatedAt: T,
    ...overrides,
  };
}

function approval(overrides: Partial<Approval> = {}): Approval {
  return {
    id: "apr-1",
    taskId: "tsk-1",
    executionId: "exe-1",
    title: "Ship the onboarding revision",
    summary: "Validation passed; awaiting the Founder decision.",
    status: "pending",
    requestedByAgentId: "agent-executive-orchestrator",
    decidedByUserId: null,
    requestedAt: T,
    decidedAt: null,
    decision: null,
    continuation: "not_attempted",
    ...overrides,
  };
}

function execution(overrides: Partial<Execution> = {}): Execution {
  return {
    id: "exe-1",
    taskId: "tsk-1",
    workflowId: "wf-1",
    agentId: null,
    status: "running",
    triggerRunId: null,
    startedAt: T,
    completedAt: null,
    createdAt: T,
    ...overrides,
  };
}

function event(overrides: Partial<Event> = {}): Event {
  return {
    id: "evt-1",
    type: "execution.updated",
    entityType: "execution",
    entityId: "exe-1",
    message: "Execution updated.",
    actorId: "agent-executive-orchestrator",
    actorLabel: "Executive Orchestrator",
    timestamp: T,
    ...overrides,
  };
}

const WORKFLOW: Workflow = {
  id: "wf-1",
  projectId: "prj-1",
  name: "Founder request",
  version: "1.0.0",
  status: "active",
  createdAt: T,
  updatedAt: T,
  stages: [
    { id: "st-0", name: "Request received", order: 0, requiresApproval: false },
    { id: "st-1", name: "Executive review", order: 1, requiresApproval: false },
    { id: "st-2", name: "Founder approval", order: 2, requiresApproval: true },
    { id: "st-3", name: "Decision recorded", order: 3, requiresApproval: false },
    { id: "st-4", name: "Completed", order: 4, requiresApproval: false },
  ],
};

function state(overrides: Partial<DevHqState> = {}): DevHqState {
  return {
    projects: [],
    tasks: [],
    approvals: [],
    events: [],
    workflows: [],
    executions: [],
    workflowRuns: [],
    agents: [],
    evidence: [],
    escalations: [],
    reviews: [],
    reviewFindings: [],
    overview: MISSION_CONTROL_PLACEHOLDERS.overview,
    processStart: { id: "proc-fixture", startedAt: T },
    ...overrides,
  };
}

/** The single pending approval in a model, for the `actionable` cases. */
function onlyApproval(s: DevHqState) {
  const model = buildCommandCenterModel(s);
  expect(model.approvals, "the fixture produced no approval to assert on").toHaveLength(1);
  return model.approvals[0];
}

const bucket = (s: DevHqState, id: string) => {
  const found = buildCommandCenterModel(s).buckets.find((b) => b.id === id);
  expect(found, `no bucket "${id}"`).toBeDefined();
  return found!;
};

const taskIdsIn = (s: DevHqState, id: string) => bucket(s, id).tasks.map((t) => t.id);

// ---- Null arm ----------------------------------------------------------------

describe("NULL ARM: an empty snapshot derives an empty model", () => {
  // Most assertions below are of the form "X is not in Y". A model that returned
  // nothing at all would satisfy them. This pins what "nothing" is, so the cases
  // that follow are measuring a populated model rather than an absent one.
  it("returns zeroed counts and no rows rather than placeholders", () => {
    const model = buildCommandCenterModel(state());

    expect(model.counts).toEqual({
      projects: 0,
      activeProjects: 0,
      tasks: 0,
      executions: 0,
      runs: 0,
      events: 0,
      pendingApprovals: 0,
    });
    expect(model.approvals).toEqual([]);
    expect(model.auditRecords).toEqual([]);
    expect(model.participants).toEqual([]);
    expect(model.projects).toEqual([]);
    expect(model.attentionCount).toBe(0);
    expect(model.executive.status.label).toBe("Idle · no runs yet");
    // The buckets are the fixed vocabulary of the work board and are always
    // present; they are simply empty.
    expect(model.buckets.every((b) => b.tasks.length === 0)).toBe(true);
  });

  it("derives a populated model from the same builder, so the case above is not vacuous", () => {
    const model = buildCommandCenterModel(
      state({
        projects: [project()],
        tasks: [task()],
        workflowRuns: [run()],
        approvals: [approval()],
        events: [event()],
        executions: [execution()],
      }),
    );

    expect(model.counts.projects).toBe(1);
    expect(model.counts.runs).toBe(1);
    expect(model.counts.events).toBe(1);
    expect(model.participants.length).toBeGreaterThan(0);
  });
});

// ---- 1. actionable -----------------------------------------------------------

describe("approvals · actionable decides whether the founder can act", () => {
  it("is actionable while the gate is open and nothing has been confirmed", () => {
    const item = onlyApproval(
      state({
        tasks: [task()],
        projects: [project()],
        approvals: [approval()],
        workflowRuns: [run({ stage: "founder_approval_required" })],
      }),
    );

    expect(item.actionable).toBe(true);
    expect(item.task?.id).toBe("tsk-1");
    expect(item.project?.id).toBe("prj-1");
  });

  it("is not actionable once a decision has been confirmed at an open gate", () => {
    // The buttons would otherwise re-post a decision the workflow has already
    // advanced on.
    const item = onlyApproval(
      state({
        tasks: [task()],
        approvals: [approval({ decision: "approved", continuation: "confirmed" })],
        workflowRuns: [run({ stage: "founder_approval_required" })],
      }),
    );

    expect(item.actionable).toBe(false);
  });

  it("stays actionable when a decision was recorded but the continuation is unconfirmed", () => {
    // The single most consequential branch here: nobody knows whether the
    // continuation started, so the founder must be able to retry. Locking this
    // out strands the request with no way forward from the UI.
    const item = onlyApproval(
      state({
        tasks: [task()],
        approvals: [approval({ decision: "approved", continuation: "unconfirmed" })],
        workflowRuns: [run({ stage: "founder_approval_required" })],
      }),
    );

    expect(item.actionable).toBe(true);
  });

  it("is actionable on a failed run only when a confirmed decision is already recorded", () => {
    const withDecision = onlyApproval(
      state({
        tasks: [task()],
        approvals: [approval({ decision: "approved", continuation: "confirmed" })],
        workflowRuns: [run({ stage: "failed" })],
      }),
    );
    expect(withDecision.actionable).toBe(true);

    const withoutDecision = onlyApproval(
      state({
        tasks: [task()],
        approvals: [approval()],
        workflowRuns: [run({ stage: "failed" })],
      }),
    );
    expect(
      withoutDecision.actionable,
      "a failed run with no recorded decision was offered as actionable",
    ).toBe(false);
  });

  it("is not actionable while the run is still in executive review", () => {
    const item = onlyApproval(
      state({
        tasks: [task()],
        approvals: [approval()],
        workflowRuns: [run({ stage: "executive_review" })],
      }),
    );

    expect(item.actionable).toBe(false);
  });

  it("is not actionable when no run backs the approval at all", () => {
    const item = onlyApproval(state({ tasks: [task()], approvals: [approval()] }));

    expect(item.run).toBeNull();
    expect(item.actionable).toBe(false);
  });

  it("surfaces only pending approvals, and counts exactly those", () => {
    const model = buildCommandCenterModel(
      state({
        tasks: [task()],
        approvals: [
          approval({ id: "apr-pending" }),
          approval({ id: "apr-approved", status: "approved" }),
          approval({ id: "apr-rejected", status: "rejected" }),
          approval({ id: "apr-escalated", status: "escalated" }),
        ],
      }),
    );

    expect(model.approvals.map((a) => a.approval.id)).toEqual(["apr-pending"]);
    expect(model.counts.pendingApprovals).toBe(1);
  });
});

// ---- 2. Stage progress -------------------------------------------------------

describe("buildStageProgress reports only what the run records", () => {
  it("marks every stage unknown and claims no progress for a failed run", () => {
    // A technical failure does not record which stage it failed in. Showing it
    // at 0% with unknown stages is the honest answer; showing it partway along
    // the track would be invented.
    const progress = buildStageProgress(run({ stage: "failed" }), WORKFLOW);

    expect(progress).not.toBeNull();
    expect(progress!.currentIndex).toBe(-1);
    expect(progress!.percent).toBe(0);
    expect(new Set(progress!.stages.map((s) => s.state))).toEqual(new Set(["unknown"]));
    expect(progress!.outcome).toBe("failed");
    expect(progress!.terminal).toBe(true);
  });

  it("returns null when the workflow definition is missing", () => {
    // The caller renders an honest gap rather than a fabricated track.
    expect(buildStageProgress(run(), null)).toBeNull();
    expect(buildStageProgress(run(), { ...WORKFLOW, stages: [] })).toBeNull();
  });

  it("marks the final stage complete, not current, at 100%", () => {
    const progress = buildStageProgress(run({ stage: "completed" }), WORKFLOW)!;

    expect(progress.percent).toBe(100);
    expect(progress.stages[4].state).toBe("complete");
    expect(progress.stages.some((s) => s.state === "current")).toBe(false);
  });

  it("splits the track around the current stage", () => {
    const progress = buildStageProgress(
      run({ stage: "founder_approval_required" }),
      WORKFLOW,
    )!;

    expect(progress.stages.map((s) => s.state)).toEqual([
      "complete",
      "complete",
      "current",
      "pending",
      "pending",
    ]);
    expect(progress.currentIndex).toBe(2);
    expect(progress.percent).toBe(50);
    expect(progress.terminal).toBe(false);
  });

  it("sorts the declared stages by order rather than trusting array position", () => {
    const shuffled: Workflow = {
      ...WORKFLOW,
      stages: [...WORKFLOW.stages].reverse(),
    };
    const progress = buildStageProgress(run({ stage: "executive_review" }), shuffled)!;

    expect(progress.stages.map((s) => s.order)).toEqual([0, 1, 2, 3, 4]);
    expect(progress.stages[1].state).toBe("current");
  });
});

// ---- 3. Outcome wording ------------------------------------------------------

describe("run outcome distinguishes the endings that look alike", () => {
  const outcomeOf = (overrides: Partial<WorkflowRunRecord>) =>
    buildStageProgress(run(overrides), WORKFLOW)!;

  it("reads a validation rejection as needing revision, not as approved", () => {
    // Both land on stage `completed`. Conflating them tells the founder a
    // request that failed validation was approved and shipped.
    const progress = outcomeOf({ stage: "completed", rejectionKind: "validation" });

    expect(progress.outcome).toBe("needs_revision");
    expect(progress.status.label).toBe("Validation rejected · needs revision");
    expect(progress.status.color).toBe(COLORS.warn);
  });

  it("reads a founder rejection at stage completed as rejected", () => {
    const progress = outcomeOf({ stage: "completed", decision: "rejected" });

    expect(progress.outcome).toBe("rejected");
    expect(progress.status.label).toBe("Rejected by founder");
  });

  it("reads an approved completion as completed", () => {
    const progress = outcomeOf({ stage: "completed", decision: "approved" });

    expect(progress.outcome).toBe("completed");
    expect(progress.status.label).toBe("Approved and completed");
    expect(progress.status.color).toBe(COLORS.ok);
  });

  it("prefers the validation rejection over the recorded decision", () => {
    // A validation rejection carries `decision: "rejected"` too. The kind is the
    // more specific fact and must win, or "revise and resubmit" is reported as
    // "the founder said no".
    const progress = outcomeOf({
      stage: "completed",
      decision: "rejected",
      rejectionKind: "validation",
    });

    expect(progress.outcome).toBe("needs_revision");
  });

  it("reads an open approval gate as awaiting the founder", () => {
    expect(outcomeOf({ stage: "founder_approval_required" }).outcome).toBe(
      "awaiting_approval",
    );
  });
});

// ---- 4. Work buckets ---------------------------------------------------------

describe("work buckets place each task exactly once", () => {
  const failedFixture = () =>
    state({
      projects: [project()],
      tasks: [task({ id: "tsk-failed", status: "active" })],
      workflowRuns: [
        run({ executionId: "exe-failed", taskId: "tsk-failed", stage: "failed" }),
      ],
    });

  it("moves a task whose run failed out of its status bucket into Technical failure", () => {
    const s = failedFixture();

    expect(taskIdsIn(s, "failed")).toEqual(["tsk-failed"]);
    expect(
      taskIdsIn(s, "in-progress"),
      "a failed task is counted both as running and as failed",
    ).toEqual([]);
  });

  it("moves a task at the approval gate out of In progress into Awaiting approval", () => {
    const s = state({
      projects: [project()],
      tasks: [task({ id: "tsk-gate", status: "active" })],
      workflowRuns: [
        run({
          executionId: "exe-gate",
          taskId: "tsk-gate",
          stage: "founder_approval_required",
        }),
      ],
    });

    expect(taskIdsIn(s, "awaiting-approval")).toEqual(["tsk-gate"]);
    expect(taskIdsIn(s, "in-progress")).toEqual([]);
  });

  it("counts only the buckets that need the founder in attentionCount", () => {
    const s = state({
      projects: [project()],
      tasks: [
        task({ id: "tsk-gate", status: "active" }),
        task({ id: "tsk-blocked", status: "blocked" }),
        task({ id: "tsk-revise", status: "needs_revision" }),
        task({ id: "tsk-failed", status: "active" }),
        // Neither of these should raise attention.
        task({ id: "tsk-done", status: "completed" }),
        task({ id: "tsk-draft", status: "draft" }),
      ],
      workflowRuns: [
        run({
          executionId: "exe-gate",
          taskId: "tsk-gate",
          stage: "founder_approval_required",
        }),
        run({ executionId: "exe-failed", taskId: "tsk-failed", stage: "failed" }),
      ],
    });

    // gate + blocked + needs-revision + failed = 4.
    expect(buildCommandCenterModel(s).attentionCount).toBe(4);
  });

  it("keeps every task in exactly one bucket", () => {
    const s = state({
      projects: [project()],
      tasks: [
        task({ id: "tsk-gate", status: "active" }),
        task({ id: "tsk-failed", status: "active" }),
        task({ id: "tsk-blocked", status: "blocked" }),
        task({ id: "tsk-paused", status: "paused" }),
        task({ id: "tsk-rejected", status: "rejected" }),
        task({ id: "tsk-done", status: "completed" }),
        task({ id: "tsk-draft", status: "draft" }),
        task({ id: "tsk-archived", status: "archived" }),
      ],
      workflowRuns: [
        run({
          executionId: "exe-gate",
          taskId: "tsk-gate",
          stage: "founder_approval_required",
        }),
        run({ executionId: "exe-failed", taskId: "tsk-failed", stage: "failed" }),
      ],
    });

    const placements = new Map<string, string[]>();
    for (const b of buildCommandCenterModel(s).buckets) {
      for (const t of b.tasks) {
        placements.set(t.id, [...(placements.get(t.id) ?? []), b.id]);
      }
    }

    const duplicated = [...placements].filter(([, ids]) => ids.length > 1);
    expect(duplicated, `tasks counted in more than one bucket: ${JSON.stringify(duplicated)}`)
      .toEqual([]);

    // `archived` has no bucket, which is why this is stated rather than implied:
    // the work board deliberately does not show archived work.
    expect(placements.has("tsk-archived")).toBe(false);
    expect(placements.size).toBe(7);
  });
});

// ---- 5. Audit trail ----------------------------------------------------------

describe("audit records report absence as absence", () => {
  it("leaves execution and approval null when no such record exists", () => {
    const [record] = buildCommandCenterModel(
      state({ projects: [project()], tasks: [task()], workflowRuns: [run()] }),
    ).auditRecords;

    expect(record.execution).toBeNull();
    expect(record.approval).toBeNull();
    expect(record.taskTitle).toBe("Ship the onboarding revision");
    expect(record.projectName).toBe("Dev HQ");
    expect(record.triggerRunId).toBeNull();
  });

  it("reports an unknown task and project as null rather than inventing a label", () => {
    const [record] = buildCommandCenterModel(
      state({ workflowRuns: [run({ taskId: "tsk-missing", projectId: "prj-missing" })] }),
    ).auditRecords;

    expect(record.taskTitle).toBeNull();
    expect(record.projectName).toBeNull();
    expect(record.taskId).toBe("tsk-missing");
  });

  it("attaches the execution and approval belonging to the same execution id", () => {
    const [record] = buildCommandCenterModel(
      state({
        projects: [project()],
        tasks: [task()],
        workflowRuns: [run({ executionId: "exe-1" })],
        executions: [execution({ id: "exe-1" }), execution({ id: "exe-other" })],
        approvals: [
          approval({ id: "apr-other", executionId: "exe-other" }),
          approval({ id: "apr-mine", executionId: "exe-1" }),
        ],
      }),
    ).auditRecords;

    expect(record.execution?.id).toBe("exe-1");
    expect(record.approval?.id).toBe("apr-mine");
  });

  it("keeps decision and continuation as separate facts", () => {
    // A recorded decision whose continuation never confirmed must not read as a
    // completed approval; the audit row is where that distinction is visible.
    const [record] = buildCommandCenterModel(
      state({
        workflowRuns: [
          run({
            stage: "founder_approval_required",
            decision: "approved",
            continuation: "unconfirmed",
            continuationDetail: "No run id returned.",
          }),
        ],
      }),
    ).auditRecords;

    expect(record.decision).toBe("approved");
    expect(record.continuation).toBe("unconfirmed");
    expect(record.continuationDetail).toBe("No run id returned.");
    expect(record.status.label).toBe("Awaiting founder approval");
  });

  it("emits one record per run, in the order the runs arrive", () => {
    const records = buildCommandCenterModel(
      state({
        workflowRuns: [
          run({ executionId: "exe-a" }),
          run({ executionId: "exe-b" }),
          run({ executionId: "exe-c" }),
        ],
      }),
    ).auditRecords;

    expect(records.map((r) => r.executionId)).toEqual(["exe-a", "exe-b", "exe-c"]);
  });
});

// ---- 6. Executive summary ----------------------------------------------------

describe("executive summary headline and counts", () => {
  it("reports a failed run above everything else", () => {
    const model = buildCommandCenterModel(
      state({
        workflowRuns: [
          run({ executionId: "exe-1", stage: "failed" }),
          run({ executionId: "exe-2", stage: "founder_approval_required" }),
          run({ executionId: "exe-3", stage: "executive_review" }),
        ],
      }),
    );

    expect(model.executive.status.label).toBe("Attention · failed run recorded");
    expect(model.executive.status.color).toBe(COLORS.err);
    expect(model.executive.failed).toBe(1);
    expect(model.executive.awaitingFounder).toBe(1);
    expect(model.executive.inReview).toBe(1);
    expect(model.executive.runsTotal).toBe(3);
  });

  it("reports a waiting gate above a run still in review", () => {
    const model = buildCommandCenterModel(
      state({
        workflowRuns: [
          run({ executionId: "exe-1", stage: "founder_approval_required" }),
          run({ executionId: "exe-2", stage: "executive_review" }),
        ],
      }),
    );

    expect(model.executive.status.label).toBe("Waiting on founder decision");
  });

  it("counts a run as decided on a recorded decision or a completed stage", () => {
    const model = buildCommandCenterModel(
      state({
        workflowRuns: [
          run({ executionId: "exe-1", stage: "completed" }),
          run({ executionId: "exe-2", decision: "rejected" }),
          run({ executionId: "exe-3", stage: "executive_review" }),
        ],
      }),
    );

    expect(model.executive.decided).toBe(2);
  });

  it("takes the newest run timestamp regardless of array order", () => {
    const model = buildCommandCenterModel(
      state({
        workflowRuns: [
          run({ executionId: "exe-1", updatedAt: "2026-07-29T09:00:00.000Z" }),
          run({ executionId: "exe-2", updatedAt: "2026-07-29T11:00:00.000Z" }),
          run({ executionId: "exe-3", updatedAt: "2026-07-29T10:00:00.000Z" }),
        ],
      }),
    );

    expect(model.executive.lastActivityAt).toBe("2026-07-29T11:00:00.000Z");
  });

  it("counts dispatched runs by a recorded Trigger.dev run id", () => {
    const model = buildCommandCenterModel(
      state({
        workflowRuns: [
          run({ executionId: "exe-1", triggerRunId: "run_1" }),
          run({ executionId: "exe-2", triggerRunId: null }),
        ],
        executions: [
          execution({ id: "exe-1", status: "running" }),
          execution({ id: "exe-2", status: "queued" }),
        ],
      }),
    );

    expect(model.executive.dispatchedRuns).toBe(1);
    expect(model.executive.runningExecutions).toBe(1);
    expect(model.executive.queuedExecutions).toBe(1);
  });
});

// ---- 7. Project scoping and participants ------------------------------------

describe("project nodes scope work to their own project", () => {
  const twoProjects = () =>
    state({
      projects: [project({ id: "prj-1" }), project({ id: "prj-2", name: "Other" })],
      tasks: [
        task({ id: "tsk-1", projectId: "prj-1" }),
        task({ id: "tsk-2", projectId: "prj-2" }),
      ],
      executions: [
        execution({ id: "exe-1", taskId: "tsk-1", agentId: "agent-claude" }),
        execution({ id: "exe-2", taskId: "tsk-2" }),
      ],
      approvals: [
        approval({ id: "apr-1", taskId: "tsk-1", executionId: "exe-1" }),
        approval({ id: "apr-2", taskId: "tsk-2", executionId: "exe-2" }),
      ],
      workflowRuns: [
        run({ executionId: "exe-1", taskId: "tsk-1", projectId: "prj-1" }),
        run({ executionId: "exe-2", taskId: "tsk-2", projectId: "prj-2" }),
      ],
      events: [
        event({ id: "evt-1", entityId: "tsk-1" }),
        event({ id: "evt-2", entityId: "tsk-2" }),
      ],
      workflows: [WORKFLOW],
    });

  it("never leaks another project's tasks, runs, approvals, or events", () => {
    const [first, second] = buildCommandCenterModel(twoProjects()).projects;

    expect(first.tasks.map((t) => t.id)).toEqual(["tsk-1"]);
    expect(first.executions.map((e) => e.id)).toEqual(["exe-1"]);
    expect(first.approvals.map((a) => a.id)).toEqual(["apr-1"]);
    expect(first.runs.map((r) => r.executionId)).toEqual(["exe-1"]);
    expect(first.events.map((e) => e.id)).toEqual(["evt-1"]);
    expect(second.tasks.map((t) => t.id)).toEqual(["tsk-2"]);
  });

  it("raises attention on a pending approval, a failed run, or a blocked task", () => {
    const pending = buildCommandCenterModel(
      state({
        projects: [project()],
        tasks: [task()],
        approvals: [approval()],
      }),
    ).projects[0];
    expect(pending.needsAttention).toBe(true);

    const quiet = buildCommandCenterModel(
      state({
        projects: [project()],
        tasks: [task({ status: "completed" })],
      }),
    ).projects[0];
    expect(quiet.needsAttention).toBe(false);
  });

  it("falls back to the project's own status when no run backs it", () => {
    const node = buildCommandCenterModel(
      state({ projects: [project({ status: "paused" })] }),
    ).projects[0];

    expect(node.stageProgress).toBeNull();
    expect(node.headline.label).toBe("Project paused");
    expect(node.headline.color).toBe(COLORS.idle);
  });

  it("lists only agent ids actually recorded against the project's work", () => {
    const node = buildCommandCenterModel(twoProjects()).projects[0];

    expect(node.assignedAgentIds).toEqual(["agent-claude"]);
    expect(node.orchestratingAgentIds).toEqual(["agent-executive-orchestrator"]);
  });
});

describe("participants are derived from records, not invented", () => {
  it("collects each id's roles and ranks by recorded activity", () => {
    const model = buildCommandCenterModel(
      state({
        projects: [project({ ownerId: "user-evan" })],
        tasks: [task({ assigneeAgentId: "agent-claude" })],
        executions: [execution({ agentId: "agent-claude" })],
        approvals: [
          approval({
            requestedByAgentId: "agent-executive-orchestrator",
            decidedByUserId: "user-evan",
          }),
        ],
        events: [
          event({ id: "evt-1", actorId: "agent-executive-orchestrator" }),
          event({ id: "evt-2", actorId: "agent-executive-orchestrator" }),
          event({ id: "evt-3", actorId: "agent-claude", actorLabel: "Claude" }),
        ],
      }),
    );

    expect(model.participants.map((p) => p.id)).toEqual([
      "agent-executive-orchestrator",
      "agent-claude",
      "user-evan",
    ]);

    const exec = model.participants[0];
    expect(exec.label).toBe("Executive Orchestrator");
    expect(exec.eventCount).toBe(2);
    expect(exec.roles).toEqual(["Requests approvals", "Logs activity"]);

    const founder = model.participants[2];
    expect(founder.roles).toEqual(["Project owner", "Approval authority"]);
    expect(founder.eventCount).toBe(0);
    expect(
      founder.lastActiveAt,
      "a participant with no events was given a fabricated last-active time",
    ).toBeNull();
  });
});
