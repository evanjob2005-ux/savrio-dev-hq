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
  runExecutiveReview,
} from "@/lib/dev-hq/founder-request-service";

const ROUTE = "POST /api/dev-hq/internal/executive-review";

export async function POST(request: Request) {
  const rejected = rejectInternalDevRequest(request);
  if (rejected) return rejected;

  try {
    const body = await readJsonBody<{ executionId?: string }>(request);
    if (typeof body?.executionId !== "string" || !body.executionId.trim()) {
      return badRequest("executionId is required.");
    }
    const result = await runExecutiveReview(body.executionId.trim());
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof InvalidRequestError) {
      return badRequest(error.message);
    }
    // An evaluated refusal is 409 rather than 500 (precedent: 9c1420f).
    if (error instanceof ApprovalAuthorityError) {
      return jsonError(error.message, 409);
    }
    return internalError(ROUTE, error);
  }
}
