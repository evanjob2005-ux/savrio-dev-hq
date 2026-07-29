import { NextResponse } from "next/server";
import { internalError, jsonError } from "@/app/api/dev-hq/_lib/route-errors";
import {
  ApprovalAuthorityError,
  approveFounderRequest,
} from "@/lib/dev-hq/founder-request-service";

const ROUTE = "POST /api/dev-hq/approvals/[id]/approve";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const state = await approveFounderRequest(id);
    return NextResponse.json({ state });
  } catch (error) {
    // A refusal the service evaluated, not an outage: 409, per the precedent set
    // by commit 9c1420f on the internal finalize and approval-gate routes. This
    // route answered 500 for the same class, so a caller could not tell an
    // unauthorized act from a transient failure, and would retry one that can
    // never succeed.
    if (error instanceof ApprovalAuthorityError) {
      return jsonError(error.message, 409);
    }
    return internalError(ROUTE, error);
  }
}
