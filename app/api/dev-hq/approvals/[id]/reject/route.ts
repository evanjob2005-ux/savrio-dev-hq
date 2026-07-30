import { NextResponse } from "next/server";
import { internalError, jsonError } from "@/app/api/dev-hq/_lib/route-errors";
import {
  ApprovalAuthorityError,
  rejectFounderRequest,
} from "@/lib/dev-hq/founder-request-service";

const ROUTE = "POST /api/dev-hq/approvals/[id]/reject";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const state = await rejectFounderRequest(id);
    return NextResponse.json({ state });
  } catch (error) {
    // See the approve route: an evaluated refusal is 409, never 500.
    if (error instanceof ApprovalAuthorityError) {
      return jsonError(error.message, 409);
    }
    return internalError(ROUTE, error);
  }
}
