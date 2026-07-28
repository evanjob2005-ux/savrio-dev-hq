import { NextResponse } from "next/server";
import { rejectInternalDevRequest } from "@/lib/dev-hq/internal-guard";
import { failWorkflowExecution } from "@/lib/dev-hq/founder-request-service";
import type { WorkflowDecision } from "@/types/domain";

export async function POST(request: Request) {
  const rejected = rejectInternalDevRequest(request);
  if (rejected) return rejected;

  try {
    const body = (await request.json()) as {
      executionId?: string;
      approvalId?: string;
      decision?: WorkflowDecision;
      message?: string;
    };
    if (!body.executionId) {
      return NextResponse.json({ error: "executionId is required." }, { status: 400 });
    }
    const hasContinuationIdentity = Boolean(body.approvalId || body.decision);
    if (hasContinuationIdentity && (!body.approvalId || !body.decision)) {
      return NextResponse.json(
        { error: "approvalId and decision must be provided together." },
        { status: 400 },
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
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
