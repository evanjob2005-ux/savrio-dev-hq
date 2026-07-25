import { NextResponse } from "next/server";
import { rejectInternalDevRequest } from "@/lib/dev-hq/internal-guard";
import { handleExecutionHeartbeat } from "@/lib/dev-hq/agent-execution-service";

export async function POST(request: Request) {
  const rejected = rejectInternalDevRequest(request);
  if (rejected) return rejected;

  try {
    const body = (await request.json()) as { executionId?: string };
    if (!body.executionId) {
      return NextResponse.json({ error: "executionId is required." }, { status: 400 });
    }
    const execution = await handleExecutionHeartbeat(body.executionId);
    return NextResponse.json({ execution });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
