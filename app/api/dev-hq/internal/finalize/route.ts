import { NextResponse } from "next/server";
import { rejectInternalDevRequest } from "@/lib/dev-hq/internal-guard";
import {
  ApprovalAuthorityError,
  finalizeWorkflowOutcome,
} from "@/lib/dev-hq/founder-request-service";
import type { WorkflowRejectionKind } from "@/types/domain";

/**
 * `approvalId` is required here, where it is optional on the service function.
 *
 * The difference is deliberate and is the whole surface of this route. Only one
 * caller reaches it — the founder-decision continuation — and that caller always
 * holds the approval its own payload was built from. The service keeps the
 * parameter optional for its single in-process caller, `runExecutiveReview`,
 * whose validation rejection finalises before any founder gate exists and claims
 * no founder authority. Nothing that arrives over HTTP is in that position, so
 * over HTTP an outcome must name the approval it is written under.
 */
const DECISIONS = new Set(["approved", "rejected"]);
const REJECTION_KINDS = new Set(["validation", "founder"]);

export async function POST(request: Request) {
  const rejected = rejectInternalDevRequest(request);
  if (rejected) return rejected;

  try {
    const body = (await request.json()) as {
      executionId?: string;
      decision?: "approved" | "rejected";
      rejectionKind?: WorkflowRejectionKind | null;
      approvalId?: string;
    };
    if (!body.executionId || !body.decision || !body.approvalId) {
      return NextResponse.json(
        { error: "executionId, decision and approvalId are required." },
        { status: 400 },
      );
    }
    // A decision is the field the whole outcome is derived from, and an
    // unrecognised value does not fail — it falls through to the rejected
    // branch and writes an outcome nobody chose. It is checked rather than cast.
    if (!DECISIONS.has(body.decision)) {
      return NextResponse.json(
        { error: `decision must be "approved" or "rejected".` },
        { status: 400 },
      );
    }
    if (
      body.rejectionKind !== undefined &&
      body.rejectionKind !== null &&
      !REJECTION_KINDS.has(body.rejectionKind)
    ) {
      return NextResponse.json(
        { error: `rejectionKind must be "validation", "founder", or null.` },
        { status: 400 },
      );
    }
    const run = await finalizeWorkflowOutcome({
      executionId: body.executionId,
      decision: body.decision,
      rejectionKind: body.rejectionKind ?? null,
      approvalId: body.approvalId,
    });
    return NextResponse.json({ run });
  } catch (error) {
    // A refusal is not an outage. 409 says the act was evaluated and found
    // unbound from the authority it claimed; retrying it unchanged will be
    // refused again, which is what the caller needs to know.
    if (error instanceof ApprovalAuthorityError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
