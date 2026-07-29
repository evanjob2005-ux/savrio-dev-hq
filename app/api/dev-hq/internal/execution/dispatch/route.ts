import { NextResponse } from "next/server";
import { rejectInternalDevRequest } from "@/lib/dev-hq/internal-guard";
import {
  dispatchAgentExecution,
  UndispatchableRequestError,
} from "@/lib/dev-hq/agent-execution-service";
import { AGENT_CAPABILITIES } from "@/lib/dev-hq/constants";

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
    // Validate the requested capabilities against the vocabulary ADR-0001 O3
    // freezes, and reject anything outside it.
    //
    // Two defects lived in the previous three lines. First, an unknown or
    // misspelled capability was accepted: no agent can satisfy it, so the
    // dispatch produced an execution that sat queued forever — the sweep retried
    // it every cycle and declined identically, no attempt was consumed, so the
    // retry budget never exhausted and no escalation was ever raised. That is
    // the SVC-01 shape (commit e5aac96, "work that neither completes nor
    // fails"). Second, `.filter(isString)` SILENTLY DROPPED non-string entries,
    // so a malformed requirement did not fail — it disappeared, and the dispatch
    // ran against a weaker routing policy than the caller asked for, on an agent
    // that need not have satisfied it.
    //
    // Both now fail closed and name what was wrong. The service applies the
    // stronger check underneath (a valid combination no agent holds together);
    // this one exists to answer a malformed request precisely and before any
    // state is created.
    let requiredCapabilities: string[] | undefined;
    if (body.requiredCapabilities !== undefined) {
      if (!Array.isArray(body.requiredCapabilities)) {
        return NextResponse.json(
          { error: "requiredCapabilities must be an array of capability names." },
          { status: 400 },
        );
      }
      const invalid: unknown[] = body.requiredCapabilities.filter(
        (capability: unknown) =>
          typeof capability !== "string" ||
          !(AGENT_CAPABILITIES as readonly string[]).includes(capability),
      );
      if (invalid.length > 0) {
        return NextResponse.json(
          {
            error: `Unknown capabilities: ${invalid
              .map((capability) => JSON.stringify(capability))
              .join(", ")}. Known capabilities: ${AGENT_CAPABILITIES.join(", ")}.`,
          },
          { status: 400 },
        );
      }
      requiredCapabilities = body.requiredCapabilities as string[];
    }

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
    // A request the system can never run is the caller's to fix, not an internal
    // failure. Reported as 500 it reads as "transient, try again" about a
    // dispatch that would be refused identically every time.
    if (error instanceof UndispatchableRequestError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
