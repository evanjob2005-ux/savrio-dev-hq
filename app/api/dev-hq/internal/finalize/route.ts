import { NextResponse } from "next/server";
import { rejectInternalDevRequest } from "@/lib/dev-hq/internal-guard";
import { finalizeWorkflowOutcome } from "@/lib/dev-hq/founder-request-service";
import type { WorkflowRejectionKind } from "@/types/domain";

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
    if (!body.executionId || !body.decision) {
      return NextResponse.json(
        { error: "executionId and decision are required." },
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
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
