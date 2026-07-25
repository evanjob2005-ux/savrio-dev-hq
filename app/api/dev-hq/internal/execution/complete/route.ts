import { NextResponse } from "next/server";
import { rejectInternalDevRequest } from "@/lib/dev-hq/internal-guard";
import { handleExecutionComplete } from "@/lib/dev-hq/agent-execution-service";
import type { AgentExecutionStatus } from "@/types/domain";

const VALID_STATUSES: readonly AgentExecutionStatus[] = [
  "succeeded",
  "failed",
  "partial",
  "cancelled",
  "timeout",
];

export async function POST(request: Request) {
  const rejected = rejectInternalDevRequest(request);
  if (rejected) return rejected;

  try {
    const body = (await request.json()) as {
      executionId?: string;
      status?: AgentExecutionStatus;
      instructions?: string;
      summary?: string | null;
    };
    if (!body.executionId || !body.status) {
      return NextResponse.json(
        { error: "executionId and status are required." },
        { status: 400 },
      );
    }
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status: ${body.status}` },
        { status: 400 },
      );
    }

    const result = await handleExecutionComplete({
      executionId: body.executionId,
      status: body.status,
      instructions: body.instructions ?? "",
      summary: body.summary ?? null,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
