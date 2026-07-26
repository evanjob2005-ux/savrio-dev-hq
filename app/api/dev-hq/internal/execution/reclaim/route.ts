import { NextResponse } from "next/server";
import { rejectInternalDevRequest } from "@/lib/dev-hq/internal-guard";
import { handleExecutionReclaim } from "@/lib/dev-hq/agent-execution-service";
import { reconcileReviews } from "@/lib/dev-hq/review-service";

export async function POST(request: Request) {
  const rejected = rejectInternalDevRequest(request);
  if (rejected) return rejected;

  try {
    // Execution recovery first: a review can only exist for a completed
    // execution, so reconciling executions may create work the review sweep then
    // picks up in the same pass. Each service owns its own reconciliation; this
    // handler only composes them.
    const result = await handleExecutionReclaim();
    const reviews = await reconcileReviews();
    return NextResponse.json({ ...result, reviews });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
