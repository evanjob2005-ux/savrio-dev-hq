import { NextResponse } from "next/server";
import { rejectInternalDevRequest } from "@/lib/dev-hq/internal-guard";
import { dispatchAgentExecution } from "@/lib/dev-hq/agent-execution-service";

export async function POST(request: Request) {
  const rejected = rejectInternalDevRequest(request);
  if (rejected) return rejected;

  try {
    const body = (await request.json()) as {
      taskId?: string;
      requiredCapabilities?: unknown;
      preferredAgentId?: string;
      instructions?: string;
      idempotencyKey?: string;
    };
    if (!body.taskId) {
      return NextResponse.json({ error: "taskId is required." }, { status: 400 });
    }
    const requiredCapabilities = Array.isArray(body.requiredCapabilities)
      ? body.requiredCapabilities.filter(
          (capability): capability is string => typeof capability === "string",
        )
      : undefined;

    const result = await dispatchAgentExecution({
      taskId: body.taskId,
      requiredCapabilities,
      preferredAgentId:
        typeof body.preferredAgentId === "string" && body.preferredAgentId
          ? body.preferredAgentId
          : undefined,
      instructions:
        typeof body.instructions === "string" ? body.instructions : undefined,
      // Callers that supply a key get a fully idempotent dispatch: repeating the
      // request converges on the same execution, assignment, and run.
      idempotencyKey:
        typeof body.idempotencyKey === "string" && body.idempotencyKey
          ? body.idempotencyKey
          : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
