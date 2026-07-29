// P0-1 and P0-16. The Founder's authority, bound to the act it authorises.
//
// Falsifiable claims under test:
//
//   P0-1  A finalization of a founder-gated workflow is refused unless it names
//         an approval whose `executionId` and `taskId` are this run's own, and
//         whose recorded decision does not contradict the outcome being written.
//         Named consequence: execution A was finalized using approval B.
//
//   P0-16 A gate registration is refused unless the approval it names is this
//         execution's own. Named consequence: run A's gate opened citing
//         approval B, so deciding B advanced B's execution while A stayed parked
//         at a gate no decision could open.
//
// Every refusal case is paired with a null arm (rule 2 of STD-CTRL-001) that runs
// from the identical starting state and MUST succeed, so a suite that simply
// stopped finalising anything cannot pass.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { triggerMock } = vi.hoisted(() => ({
  triggerMock: vi.fn(async (...args: [string, unknown, unknown?]) => ({
    id:
      args[0] === "founder-request-continuation"
        ? "run-continuation-1"
        : "run-test-1",
  })),
}));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: { trigger: triggerMock },
}));

import { POST as approvalGateRoute } from "@/app/api/dev-hq/internal/approval-gate/route";
import { POST as finalizeRoute } from "@/app/api/dev-hq/internal/finalize/route";
import { getDevHqAdapters, resetDevHqAdapters } from "@/lib/dev-hq/adapters";
import { DEV_HQ_INTERNAL_TOKEN_HEADER } from "@/lib/dev-hq/internal-guard";
import {
  ApprovalAuthorityError,
  approveFounderRequest,
  createFounderRequest,
  finalizeWorkflowOutcome,
  registerApprovalGate,
  runExecutiveReview,
} from "@/lib/dev-hq/founder-request-service";
import { resetDevHqStore } from "@/lib/dev-hq/store";
import type { Approval, Task, WorkflowRunRecord } from "@/types/domain";

interface Seeded {
  executionId: string;
  taskId: string;
  approvalId: string;
}

/** A founder request driven to, but not through, its approval gate. */
async function seedAtGate(title: string): Promise<Seeded> {
  const created = await createFounderRequest({
    title,
    description: `Deliver ${title} through the founder request workflow.`,
    priority: "High",
  });
  const review = await runExecutiveReview(created.execution.id);
  expect(review.approvalId).toBeTruthy();
  await registerApprovalGate({
    executionId: created.execution.id,
    approvalId: review.approvalId!,
  });
  return {
    executionId: created.execution.id,
    taskId: created.task.id,
    approvalId: review.approvalId!,
  };
}

/** The same request, stopped one step earlier: approval created, gate not registered. */
async function seedBeforeGate(title: string): Promise<Seeded> {
  const created = await createFounderRequest({
    title,
    description: `Deliver ${title} through the founder request workflow.`,
    priority: "High",
  });
  const review = await runExecutiveReview(created.execution.id);
  return {
    executionId: created.execution.id,
    taskId: created.task.id,
    approvalId: review.approvalId!,
  };
}

async function runOf(executionId: string): Promise<WorkflowRunRecord | null> {
  return getDevHqAdapters().workflowRunRepository.getRun(executionId);
}

async function approvalOf(approvalId: string): Promise<Approval | null> {
  return getDevHqAdapters().approvalManager.getApproval(approvalId);
}

async function statusOf(taskId: string): Promise<Task["status"] | undefined> {
  return (await getDevHqAdapters().taskRepository.getTask(taskId))?.status;
}

/**
 * Runs a call that must be refused and renders the outcome as one string.
 *
 * `rejects.toThrow` drops the assertion's own message when the promise resolves
 * instead of rejecting — and a promise resolving is precisely the failure this
 * suite exists to report, so the red transcript would arrive without naming the
 * defect it found. Rendering the outcome first keeps the diagnostic attached to
 * it, and folds the error's class into the comparison so an unbound act refused
 * by accident downstream is not mistaken for one refused on purpose here.
 */
async function refusalOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
    return "NOT REFUSED — the call completed successfully";
  } catch (error) {
    if (error instanceof ApprovalAuthorityError) {
      return `ApprovalAuthorityError: ${error.message}`;
    }
    if (error instanceof Error) {
      return `${error.name}: ${error.message}`;
    }
    return `non-Error: ${String(error)}`;
  }
}

/**
 * The real internal guard runs on these routes, so every callback below carries a
 * valid token. The authority under test is the founder's, not the worker's: a
 * request stopped at the guard proves nothing about what an *authenticated*
 * worker is allowed to finalize.
 */
const INTERNAL_TOKEN = "test-internal-token";

/** The guard's own refusals. Never an answer about founder authority. */
const GUARD_REJECTIONS = new Map([
  [401, "the internal token was missing or wrong"],
  [403, "the route is disabled in production"],
  [503, "DEV_HQ_INTERNAL_TOKEN is not configured"],
]);

function jsonRequest(path: string, body: unknown): Request {
  return new Request(`http://dev-hq.test${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      [DEV_HQ_INTERNAL_TOKEN_HEADER]: INTERNAL_TOKEN,
    },
    body: JSON.stringify(body),
  });
}

/**
 * Posts an internal callback and proves it got *past* the guard before any
 * assertion is made about what came back.
 *
 * Without this, a suite whose token stopped being configured would answer every
 * request with 503 — and a 503 is a refusal, so an assertion phrased as "the
 * mismatched approval is refused" could be satisfied by a boundary that never
 * evaluated the approval at all. The status codes this suite asserts (200, 400,
 * 409) are each distinct from every guard rejection, so no assertion here can be
 * satisfied by one; this check makes that a stated property of the harness
 * rather than a coincidence of the numbers, and names the cause when it breaks.
 */
async function postInternal(
  handler: (request: Request) => Promise<Response>,
  path: string,
  body: unknown,
): Promise<Response> {
  const response = await handler(jsonRequest(path, body));
  expect(
    GUARD_REJECTIONS.get(response.status) ?? "reached the route",
    `the request was stopped at the internal guard (${response.status}) and never ` +
      "reached the authority logic, so nothing below measures what it claims to",
  ).toBe("reached the route");
  return response;
}

beforeEach(() => {
  vi.stubEnv("DEV_HQ_INTERNAL_TOKEN", INTERNAL_TOKEN);
  resetDevHqStore();
  resetDevHqAdapters();
  triggerMock.mockClear();
});

// The stub writes to the worker's real `process.env`, which outlives this file.
// Cleared so a suite that runs after this one in the same worker cannot inherit
// a configured internal token from it.
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("P0-1: finalization is bound to the approval it is written under", () => {
  // --- null arm. Identical starting state — two requests at their gates — with
  // each execution finalized under its own approval.
  it("null arm: each execution finalizes under its own approval", async () => {
    const a = await seedAtGate("Execution A");
    const b = await seedAtGate("Execution B");

    const finalizedA = await finalizeWorkflowOutcome({
      executionId: a.executionId,
      decision: "approved",
      approvalId: a.approvalId,
    });
    const finalizedB = await finalizeWorkflowOutcome({
      executionId: b.executionId,
      decision: "rejected",
      rejectionKind: "founder",
      approvalId: b.approvalId,
    });

    expect(
      finalizedA.stage,
      "the legitimate finalization must still complete — a binding that refuses " +
        "everything is not a binding",
    ).toBe("completed");
    expect(finalizedA.decision).toBe("approved");
    expect(await statusOf(a.taskId)).toBe("completed");
    expect((await approvalOf(a.approvalId))?.status).toBe("approved");

    expect(finalizedB.stage).toBe("completed");
    expect(finalizedB.rejectionKind).toBe("founder");
    expect(await statusOf(b.taskId)).toBe("rejected");
    expect((await approvalOf(b.approvalId))?.status).toBe("rejected");
  });

  it("refuses to finalize execution A using approval B", async () => {
    const a = await seedAtGate("Execution A");
    const b = await seedAtGate("Execution B");

    expect(
      await refusalOf(
        finalizeWorkflowOutcome({
          executionId: a.executionId,
          decision: "approved",
          approvalId: b.approvalId,
        }),
      ),
      "execution A was finalized using approval B: the outcome was written and " +
        "attributed to the founder on the strength of an approval belonging to a " +
        "different execution entirely (P0-1)",
    ).toBe(
      `ApprovalAuthorityError: Approval ${b.approvalId} belongs to execution ${b.executionId}, not execution ${a.executionId}.`,
    );

    // Refused before anything was written, on either side.
    expect((await runOf(a.executionId))?.stage).toBe(
      "founder_approval_required",
    );
    expect((await runOf(a.executionId))?.decision).toBeNull();
    expect(await statusOf(a.taskId)).toBe("active");
    expect((await approvalOf(a.approvalId))?.status).toBe("pending");

    // And B, whose approval was borrowed, is untouched: its own decision is
    // still the founder's to make.
    expect((await approvalOf(b.approvalId))?.status).toBe("pending");
    expect((await approvalOf(b.approvalId))?.decision).toBeNull();
    expect((await runOf(b.executionId))?.stage).toBe(
      "founder_approval_required",
    );
  });

  it("refuses an approval that names this execution but a different task", async () => {
    const a = await seedAtGate("Execution A");
    const b = await seedAtGate("Execution B");

    // Half-linked: the execution matches, the task does not. Checking only the
    // execution would accept this, and the outcome is written onto the task.
    const crossed = await getDevHqAdapters().approvalManager.createApproval({
      taskId: b.taskId,
      executionId: a.executionId,
      title: "Founder approval - crossed",
      summary: "Points at A's execution and B's task.",
      requestedByAgentId: "agent-executive-orchestrator",
    });

    expect(
      await refusalOf(
        finalizeWorkflowOutcome({
          executionId: a.executionId,
          decision: "approved",
          approvalId: crossed.id,
        }),
      ),
      "an approval carrying another task's id finalized this run and wrote the " +
        "outcome onto a task it was never raised against (P0-1)",
    ).toBe(
      `ApprovalAuthorityError: Approval ${crossed.id} belongs to task ${b.taskId}, ` +
        `not task ${a.taskId} which execution ${a.executionId} carries.`,
    );

    expect(await statusOf(a.taskId)).toBe("active");
    expect(await statusOf(b.taskId)).toBe("active");
  });

  it("refuses an outcome that contradicts the recorded decision", async () => {
    const a = await seedAtGate("Execution A");
    await approveFounderRequest(a.approvalId);
    expect((await approvalOf(a.approvalId))?.decision).toBe("approved");

    expect(
      await refusalOf(
        finalizeWorkflowOutcome({
          executionId: a.executionId,
          decision: "rejected",
          rejectionKind: "founder",
          approvalId: a.approvalId,
        }),
      ),
      "an approval recording an approved decision was used to write a rejected " +
        "outcome: the record and the outcome say opposite things about what the " +
        "founder chose (P0-1)",
    ).toBe(
      `ApprovalAuthorityError: Approval ${a.approvalId} records a approved decision ` +
        `and cannot finalize execution ${a.executionId} as rejected.`,
    );

    // The recorded decision stands, and nothing was half-written from the
    // contradiction.
    expect((await approvalOf(a.approvalId))?.decision).toBe("approved");
    expect((await approvalOf(a.approvalId))?.status).toBe("pending");
    expect((await runOf(a.executionId))?.stage).toBe(
      "founder_approval_required",
    );
    expect(await statusOf(a.taskId)).toBe("active");
  });

  it("null arm: the same recorded decision finalizes normally", async () => {
    // Identical starting state to the case above, differing only in which
    // outcome is written.
    const a = await seedAtGate("Execution A");
    await approveFounderRequest(a.approvalId);

    const finalized = await finalizeWorkflowOutcome({
      executionId: a.executionId,
      decision: "approved",
      approvalId: a.approvalId,
    });

    expect(finalized.stage).toBe("completed");
    expect((await approvalOf(a.approvalId))?.status).toBe("approved");
    expect(await statusOf(a.taskId)).toBe("completed");
  });

  it("refuses to finalize a gated workflow with no approval identity at all", async () => {
    const a = await seedAtGate("Execution A");

    expect(
      await refusalOf(
        finalizeWorkflowOutcome({
          executionId: a.executionId,
          decision: "approved",
        }),
      ),
      "a workflow waiting at the founder's gate was finalized as approved with " +
        "no approval named: the timeline attributes the decision to Evan with " +
        "nothing behind it (P0-1)",
    ).toBe(
      `ApprovalAuthorityError: Execution ${a.executionId} is awaiting a founder ` +
        `decision and cannot be finalized without the approval that carries it.`,
    );

    expect((await runOf(a.executionId))?.stage).toBe(
      "founder_approval_required",
    );
    expect(await statusOf(a.taskId)).toBe("active");
  });

  it("refuses the same when the approval exists but the gate stage has not landed", async () => {
    // The retry window `runExecutiveReview` explicitly handles: the approval was
    // created, the gate registration did not land. Reading the stage alone would
    // find nothing and let this finalize unauthorised.
    const a = await seedBeforeGate("Execution A");
    expect((await runOf(a.executionId))?.stage).toBe("executive_review");
    expect(await approvalOf(a.approvalId)).not.toBeNull();

    expect(
      await refusalOf(
        finalizeWorkflowOutcome({
          executionId: a.executionId,
          decision: "approved",
        }),
      ),
      "a founder approval was already outstanding for this execution and the " +
        "workflow finalized without it, because the gate stage had not been " +
        "written yet (P0-1)",
    ).toContain("is awaiting a founder decision");

    expect(await statusOf(a.taskId)).toBe("active");
  });

  it("null arm: a validation rejection still finalizes with no approval", async () => {
    // The one legitimate approval-free finalization. It must be untouched, or
    // the rule above has simply broken the path it was not aiming at.
    const created = await createFounderRequest({
      title: "No",
      description: "Too short.",
      priority: "Low",
    });

    const review = await runExecutiveReview(created.execution.id);

    expect(review.passed).toBe(false);
    expect(review.approvalId).toBeNull();
    const run = await runOf(created.execution.id);
    expect(
      run?.stage,
      "the validation rejection claims no founder authority and must still be " +
        "able to finalise without an approval",
    ).toBe("completed");
    expect(run?.rejectionKind).toBe("validation");
    expect(await statusOf(created.task.id)).toBe("needs_revision");
  });

  it("refuses a cross-linked finalization against an already-completed run", async () => {
    const a = await seedAtGate("Execution A");
    const b = await seedAtGate("Execution B");
    await finalizeWorkflowOutcome({
      executionId: a.executionId,
      decision: "approved",
      approvalId: a.approvalId,
    });

    // Behind the terminal early return, this was answered with A's completed
    // record — a 200 and a finished workflow, reported for an act nobody
    // authorised.
    expect(
      await refusalOf(
        finalizeWorkflowOutcome({
          executionId: a.executionId,
          decision: "rejected",
          rejectionKind: "founder",
          approvalId: b.approvalId,
        }),
      ),
      "an unbound finalization against a completed run was answered with that " +
        "run's success record instead of being refused (P0-1)",
    ).toContain(
      `Approval ${b.approvalId} belongs to execution ${b.executionId}`,
    );
  });

  it("null arm: a re-delivered legitimate finalization is still idempotent", async () => {
    // Identical starting state to the case above. Moving the binding ahead of
    // the terminal early return must not cost the re-delivery convergence.
    const a = await seedAtGate("Execution A");
    const first = await finalizeWorkflowOutcome({
      executionId: a.executionId,
      decision: "approved",
      approvalId: a.approvalId,
    });

    const again = await finalizeWorkflowOutcome({
      executionId: a.executionId,
      decision: "approved",
      approvalId: a.approvalId,
    });

    expect(again).toEqual(first);
  });

  it("refuses an unresolvable approval id as an authority failure, not an incident", async () => {
    const a = await seedAtGate("Execution A");

    // This one discriminates on the *class* of the refusal, not on whether one
    // happened. Unbound, the call still ended in an error — but an incidental
    // one, thrown three writes later by the adapter that could not find the
    // record to update. That reads as the server having broken (500) rather than
    // the act having been refused (409), and it is answered by retrying.
    // Rule 5: could-not-evaluate is its own outcome and says so.
    expect(
      await refusalOf(
        finalizeWorkflowOutcome({
          executionId: a.executionId,
          decision: "approved",
          approvalId: "appr-does-not-exist",
        }),
      ),
      "an approval that could not be read was answered as a server fault rather " +
        "than a refusal, so an unbound finalization is retried as if it might " +
        "one day succeed (P0-1, STD-CTRL-001 rule 5)",
    ).toBe(
      "ApprovalAuthorityError: Approval not found: appr-does-not-exist. " +
        `Execution ${a.executionId} cannot act on an approval that does not exist.`,
    );

    expect((await runOf(a.executionId))?.stage).toBe(
      "founder_approval_required",
    );
  });
});

describe("P0-1 at the HTTP boundary", () => {
  it("null arm: the continuation's own finalize callback succeeds", async () => {
    const a = await seedAtGate("Execution A");
    await approveFounderRequest(a.approvalId);

    const response = await postInternal(
      finalizeRoute,
      "/api/dev-hq/internal/finalize",
      {
        executionId: a.executionId,
        decision: "approved",
        rejectionKind: null,
        approvalId: a.approvalId,
      },
    );

    expect(
      response.status,
      "the legitimate continuation callback must still succeed — and because a " +
        "guard rejection could never be 200, this arm also proves the boundary " +
        "is open for the refusal arms below",
    ).toBe(200);
    expect(await statusOf(a.taskId)).toBe("completed");
  });

  it("answers a cross-linked callback with 409, not 200 and not 500", async () => {
    const a = await seedAtGate("Execution A");
    const b = await seedAtGate("Execution B");

    const response = await postInternal(
      finalizeRoute,
      "/api/dev-hq/internal/finalize",
      {
        executionId: a.executionId,
        decision: "approved",
        rejectionKind: null,
        approvalId: b.approvalId,
      },
    );

    expect(
      response.status,
      "the finalize callback accepted an approval from another execution (P0-1)",
    ).toBe(409);
    // Bound to the reason, not just the number: only the authority check can
    // produce this sentence, so the refusal cannot be one that happened for some
    // other reason and got counted here.
    expect((await response.json()).error).toContain(
      `belongs to execution ${b.executionId}`,
    );
    expect(await statusOf(a.taskId)).toBe("active");
  });

  it("rejects a finalize callback that names no approval", async () => {
    const a = await seedAtGate("Execution A");

    const response = await postInternal(
      finalizeRoute,
      "/api/dev-hq/internal/finalize",
      {
        executionId: a.executionId,
        decision: "approved",
        rejectionKind: null,
      },
    );

    expect(
      response.status,
      "approvalId is optional on the finalize route, so an outcome can be " +
        "written over HTTP with no approval identity at all (P0-1)",
    ).toBe(400);
    expect((await response.json()).error).toContain("approvalId");
    expect(await statusOf(a.taskId)).toBe("active");
  });

  it("rejects a decision value that is neither approved nor rejected", async () => {
    const a = await seedAtGate("Execution A");

    const response = await postInternal(
      finalizeRoute,
      "/api/dev-hq/internal/finalize",
      {
        executionId: a.executionId,
        decision: "banana",
        rejectionKind: null,
        approvalId: a.approvalId,
      },
    );

    expect(
      response.status,
      "an unrecognised decision was cast rather than checked, and fell through " +
        "to the rejected branch — writing an outcome nobody chose (P0-1)",
    ).toBe(400);
    expect(await statusOf(a.taskId)).toBe("active");
  });
});

describe("P0-16: gate registration is bound to the execution it opens", () => {
  it("null arm: an execution's own approval opens its gate", async () => {
    const created = await createFounderRequest({
      title: "Execution A",
      description: "Deliver Execution A through the founder request workflow.",
      priority: "High",
    });
    const review = await runExecutiveReview(created.execution.id);

    const approval = await registerApprovalGate({
      executionId: created.execution.id,
      approvalId: review.approvalId!,
    });

    expect(approval.id).toBe(review.approvalId);
    expect((await runOf(created.execution.id))?.stage).toBe(
      "founder_approval_required",
    );
  });

  it("refuses to open execution A's gate with approval B", async () => {
    const b = await seedAtGate("Execution B");
    const a = await seedBeforeGate("Execution A");

    expect(
      await refusalOf(
        registerApprovalGate({
          executionId: a.executionId,
          approvalId: b.approvalId,
        }),
      ),
      "execution A's gate was opened citing approval B: A advanced to " +
        "founder_approval_required while the approval the founder would act on " +
        "carries execution B, so deciding it advances B and leaves A parked at a " +
        "gate no decision can open (P0-16)",
    ).toBe(
      `ApprovalAuthorityError: Approval ${b.approvalId} belongs to execution ${b.executionId}, not execution ${a.executionId}.`,
    );

    expect(
      (await runOf(a.executionId))?.stage,
      "the stage advanced on the strength of another execution's approval",
    ).toBe("executive_review");
  });

  it("refuses an approval that names this execution but a different task", async () => {
    const a = await seedBeforeGate("Execution A");
    const b = await seedBeforeGate("Execution B");

    const crossed = await getDevHqAdapters().approvalManager.createApproval({
      taskId: b.taskId,
      executionId: a.executionId,
      title: "Founder approval - crossed",
      summary: "Points at A's execution and B's task.",
      requestedByAgentId: "agent-executive-orchestrator",
    });

    expect(
      await refusalOf(
        registerApprovalGate({
          executionId: a.executionId,
          approvalId: crossed.id,
        }),
      ),
      "a gate was opened on an approval raised against another task (P0-16)",
    ).toContain(
      `Approval ${crossed.id} belongs to task ${b.taskId}, not task ${a.taskId}`,
    );

    expect((await runOf(a.executionId))?.stage).toBe("executive_review");
  });

  it("refuses a cross-linked registration against a completed run", async () => {
    const a = await seedAtGate("Execution A");
    const b = await seedAtGate("Execution B");
    await finalizeWorkflowOutcome({
      executionId: a.executionId,
      decision: "approved",
      approvalId: a.approvalId,
    });

    expect(
      await refusalOf(
        registerApprovalGate({
          executionId: a.executionId,
          approvalId: b.approvalId,
        }),
      ),
      "a cross-linked registration against a completed run was answered with " +
        "the foreign approval record instead of being refused (P0-16)",
    ).toContain(`Approval ${b.approvalId} belongs to execution ${b.executionId}`);
  });

  it("null arm: re-registering an execution's own gate stays idempotent", async () => {
    const a = await seedAtGate("Execution A");

    const again = await registerApprovalGate({
      executionId: a.executionId,
      approvalId: a.approvalId,
    });

    expect(again.id).toBe(a.approvalId);
    expect((await runOf(a.executionId))?.stage).toBe(
      "founder_approval_required",
    );

    const events = await getDevHqAdapters().eventLogger.listRecent({
      limit: 200,
    });
    expect(
      events.filter(
        (event) =>
          event.type === "approval.requested" && event.entityId === a.approvalId,
      ),
    ).toHaveLength(1);
  });

  it("answers a cross-linked gate callback with 409", async () => {
    const b = await seedAtGate("Execution B");
    const a = await seedBeforeGate("Execution A");

    const response = await postInternal(
      approvalGateRoute,
      "/api/dev-hq/internal/approval-gate",
      {
        executionId: a.executionId,
        approvalId: b.approvalId,
      },
    );

    expect(
      response.status,
      "the approval-gate callback accepted an approval from another execution " +
        "(P0-16)",
    ).toBe(409);
    expect((await response.json()).error).toContain(
      `belongs to execution ${b.executionId}`,
    );
    expect((await runOf(a.executionId))?.stage).toBe("executive_review");
  });
});
