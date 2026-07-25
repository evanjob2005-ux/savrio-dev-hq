import { NextResponse } from "next/server";
import { rejectInternalDevRequest } from "@/lib/dev-hq/internal-guard";
import { failWorkflowExecution } from "@/lib/dev-hq/founder-request-service";

export async function POST(request: Request) {
  const rejected = rejectInternalDevRequest(request);
  if (rejected) return rejected;

  try {
    const body = (await request.json()) as {
      executionId?: string;
      message?: string;
    };
    if (!body.executionId) {
      return NextResponse.json({ error: "executionId is required." }, { status: 400 });
    }
    const run = await failWorkflowExecution(
      body.executionId,
      body.message ?? "Workflow failed due to a technical error.",
    );
    return NextResponse.json({ run });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
