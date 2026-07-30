// MINOR-1 (F-2). `rejectionKind` bound to the authority that authorizes it.
//
// Falsifiable claim: a finalization that names a founder-decided approval is
// refused when it also claims `rejectionKind: "validation"`, and the task keeps
// the status it had.
//
// The defect it closes: `finalizeWorkflowOutcome` bound `decision` against the
// approval's recorded decision and bound `rejectionKind` against nothing. The
// founder never chooses a rejection kind — `decideFounderRequest` records only
// "approved" | "rejected" — but the internal finalize route accepts "validation"
// over HTTP. So a caller past the internal guard could POST
// {decision:"rejected", rejectionKind:"validation", approvalId} against a
// correctly-bound, founder-decided approval; every authority check passed,
// `taskStatusForOutcome` routed the task to `needs_revision` instead of
// `rejected`, and `approval.rejected` — "the founder's rejection took effect" —
// was still logged. The founder's decision honoured in name and inverted in
// effect.
//
// The red arm asserts that outcome directly: the task at `needs_revision` while
// the timeline says the rejection took effect.

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

import { POST as finalizeRoute } from "@/app/api/dev-hq/internal/finalize/route";
import { getDevHqAdapters, resetDevHqAdapters } from "@/lib/dev-hq/adapters";
import { DEV_HQ_INTERNAL_TOKEN_HEADER } from "@/lib/dev-hq/internal-guard";
import {
  createFounderRequest,
  registerApprovalGate,
  rejectFounderRequest,
  runExecutiveReview,
} from "@/lib/dev-hq/founder-request-service";
import { resetDevHqStore } from "@/lib/dev-hq/store";
import type { Task } from "@/types/domain";

const INTERNAL_TOKEN = "test-internal-token";

/** The guard's own refusals. Never an answer about founder authority. */
const GUARD_REJECTIONS = new Map([
  [401, "the internal token was missing or wrong"],
  [403, "the route is disabled in production"],
  [503, "DEV_HQ_INTERNAL_TOKEN is not configured"],
]);

interface Seeded {
  executionId: string;
  taskId: string;
  approvalId: string;
  taskStatusBefore: Task["status"];
}

/**
 * A founder request carried to its gate and then genuinely rejected by the
 * founder, so the approval records "rejected" and every authority check the
 * finalization performs will legitimately pass. This is the starting state both
 * arms run from; only the `rejectionKind` on the finalize call differs.
 */
async function seedFounderRejected(title: string): Promise<Seeded> {
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
  await rejectFounderRequest(review.approvalId!);

  const approval = await getDevHqAdapters().approvalManager.getApproval(
    review.approvalId!,
  );
  expect(
    approval?.decision,
    "the seed did not record the founder's rejection, so nothing below is measuring a founder-decided approval",
  ).toBe("rejected");

  const task = await getDevHqAdapters().taskRepository.getTask(created.task.id);
  return {
    executionId: created.execution.id,
    taskId: created.task.id,
    approvalId: review.approvalId!,
    taskStatusBefore: task!.status,
  };
}

async function statusOf(taskId: string): Promise<Task["status"] | undefined> {
  return (await getDevHqAdapters().taskRepository.getTask(taskId))?.status;
}

/** Whether the timeline claims the founder's rejection took effect. */
async function rejectionTookEffect(approvalId: string): Promise<string | null> {
  const events = await getDevHqAdapters().eventLogger.listRecent({
    entityType: "approval",
    limit: 200,
  });
  return (
    events.find(
      (event) =>
        event.type === "approval.rejected" && event.entityId === approvalId,
    )?.message ?? null
  );
}

async function postFinalize(body: unknown): Promise<Response> {
  const response = await finalizeRoute(
    new Request("http://dev-hq.test/api/dev-hq/internal/finalize", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        [DEV_HQ_INTERNAL_TOKEN_HEADER]: INTERNAL_TOKEN,
      },
      body: JSON.stringify(body),
    }),
  );
  // Proves the request reached the authority logic. A 401/403/503 is also a
  // refusal, so an assertion phrased as "the request is refused" could otherwise
  // be satisfied by a guard that never evaluated the approval at all.
  expect(
    GUARD_REJECTIONS.get(response.status) ?? "reached the route",
    `the request was stopped at the internal guard (${response.status}) and never reached the authority logic`,
  ).toBe("reached the route");
  return response;
}

beforeEach(() => {
  vi.stubEnv("DEV_HQ_INTERNAL_TOKEN", INTERNAL_TOKEN);
  resetDevHqStore();
  resetDevHqAdapters();
  triggerMock.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("rejectionKind is bound to the founder's authority (MINOR-1)", () => {
  it("refuses an approval-bound finalization that claims a validation rejection", async () => {
    const seeded = await seedFounderRejected("Validation kind smuggling");

    const response = await postFinalize({
      executionId: seeded.executionId,
      decision: "rejected",
      rejectionKind: "validation",
      approvalId: seeded.approvalId,
    });

    // Asserted together, and BEFORE the status code. The defect is not that a
    // predicate answered wrongly — it is the pair of records the founder would
    // be shown: the task in `needs_revision` while the timeline says their
    // rejection took effect. Rendering both in one comparison keeps both in the
    // failure diagnostic, rather than the first one aborting before the second
    // is read.
    expect(
      {
        taskStatus: await statusOf(seeded.taskId),
        rejectionTookEffect: await rejectionTookEffect(seeded.approvalId),
      },
      `a "validation" rejectionKind was smuggled in under the founder's approval for task ${seeded.taskId}: the founder chose to REJECT, the task was routed to needs_revision instead of rejected, and the timeline still records that the founder's rejection took effect (MINOR-1)`,
    ).toEqual({
      taskStatus: seeded.taskStatusBefore,
      rejectionTookEffect: null,
    });
    expect(response.status).toBe(409);
    expect(((await response.json()) as { error: string }).error).toMatch(
      /validation/,
    );
  });

  /**
   * NULL ARM 1. Identical starting state and identical request, differing only
   * in the one field under test: the founder's rejection kind. It must still
   * finalize, reach `rejected`, and record that the rejection took effect —
   * otherwise the arm above would be satisfied by a route that had simply
   * stopped finalizing rejections.
   */
  it("null arm: the same finalization as a founder rejection still takes effect", async () => {
    const seeded = await seedFounderRejected("Founder kind accepted");

    const response = await postFinalize({
      executionId: seeded.executionId,
      decision: "rejected",
      rejectionKind: "founder",
      approvalId: seeded.approvalId,
    });

    expect(response.status).toBe(200);
    expect(await statusOf(seeded.taskId)).toBe("rejected");
    expect(await rejectionTookEffect(seeded.approvalId)).toMatch(
      /rejection of .* took effect/,
    );
  });

  /**
   * NULL ARM 2. The same starting state with `rejectionKind` omitted entirely —
   * the shape the continuation task actually sends. The service defaults it to
   * "founder", so this is the live path and must be untouched.
   */
  it("null arm: an omitted rejectionKind still finalizes as a founder rejection", async () => {
    const seeded = await seedFounderRejected("Omitted kind");

    const response = await postFinalize({
      executionId: seeded.executionId,
      decision: "rejected",
      approvalId: seeded.approvalId,
    });

    expect(response.status).toBe(200);
    expect(await statusOf(seeded.taskId)).toBe("rejected");
    expect(await rejectionTookEffect(seeded.approvalId)).not.toBeNull();
  });

  /**
   * NULL ARM 3. The genuine producer of `rejectionKind: "validation"` is
   * `runExecutiveReview`, which finalizes from `executive_review` before any
   * founder gate exists and passes no approvalId. It must keep routing its task
   * to `needs_revision` — the refusal binds founder authority, and validation
   * never claimed any.
   */
  it("null arm: executive-review validation rejection still routes to needs_revision", async () => {
    const created = await createFounderRequest({
      // Under the length minimum, so deterministicExecutiveReview fails it.
      title: "ok",
      description: "short",
      priority: "High",
    });

    const review = await runExecutiveReview(created.execution.id);

    expect(review.passed).toBe(false);
    expect(review.approvalId).toBeNull();
    expect(
      await statusOf(created.task.id),
      "the validation rejection stopped routing its task to needs_revision; the refusal is catching the caller it was written to exempt",
    ).toBe("needs_revision");
  });
});
