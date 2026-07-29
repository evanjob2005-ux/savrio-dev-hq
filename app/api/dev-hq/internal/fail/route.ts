import { NextResponse } from "next/server";
import {
  InvalidRequestError,
  badRequest,
  internalError,
  jsonError,
  readJsonBody,
} from "@/app/api/dev-hq/_lib/route-errors";
import { rejectInternalDevRequest } from "@/lib/dev-hq/internal-guard";
import {
  ApprovalAuthorityError,
  failWorkflowExecution,
} from "@/lib/dev-hq/founder-request-service";
import type { WorkflowDecision } from "@/types/domain";

const ROUTE = "POST /api/dev-hq/internal/fail";

/** The vocabulary `decision` admits, as a runtime value (see 9c1420f). */
const VALID_DECISIONS: readonly WorkflowDecision[] = ["approved", "rejected"];

export async function POST(request: Request) {
  const rejected = rejectInternalDevRequest(request);
  if (rejected) return rejected;

  try {
    const body = await readJsonBody<{
      executionId?: string;
      approvalId?: string;
      decision?: WorkflowDecision;
      message?: string;
    }>(request);
    if (!body.executionId) {
      return badRequest("executionId is required.");
    }
    const hasContinuationIdentity = Boolean(body.approvalId || body.decision);
    if (hasContinuationIdentity && (!body.approvalId || !body.decision)) {
      return badRequest("approvalId and decision must be provided together.");
    }
    // Checked rather than cast, for the reason 9c1420f records: a cast admits
    // any string, and this one selects the branch a failure is recorded under.
    if (body.decision && !VALID_DECISIONS.includes(body.decision)) {
      return badRequest(
        `Invalid decision. Expected one of ${VALID_DECISIONS.join(", ")}.`,
      );
    }
    const run = await failWorkflowExecution(
      body.executionId,
      body.message ?? "Workflow failed due to a technical error.",
      body.approvalId && body.decision
        ? { approvalId: body.approvalId, decision: body.decision }
        : undefined,
    );
    return NextResponse.json({ run });
  } catch (error) {
    if (error instanceof InvalidRequestError) {
      return badRequest(error.message);
    }
    if (error instanceof ApprovalAuthorityError) {
      return jsonError(error.message, 409);
    }
    return internalError(ROUTE, error);
  }
}
