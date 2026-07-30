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
      assignmentId?: string;
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
    // The assignment is the ATTEMPT identity, and finalization is the one
    // callback that can destroy live work, so it is required here rather than
    // optional.
    //
    // `handleExecutionComplete` no-ops a callback whose assignment a later
    // attempt superseded — but only when one is supplied. Omitted, that guard is
    // skipped entirely and the callback finalizes "whatever attempt is current".
    // A worker from attempt 1 that was reclaimed for a lease timeout, and wakes
    // up while attempt 2 is running, therefore writes its own abandoned outcome
    // over the live attempt: releasing attempt 2's agent, releasing its
    // assignment, and recording attempt 1's result as attempt 2's. The still-
    // running attempt 2 then completes into an execution that has already moved
    // on. A `succeeded` from dead work can finalize a task nobody actually
    // finished.
    //
    // Every real caller already sends it (trigger/agent-execution.ts passes
    // `payload.assignmentId` to all three callbacks), so requiring it costs
    // nothing and makes an anonymous finalization unrepresentable at the edge
    // instead of merely discouraged. The heartbeat route is deliberately NOT
    // changed to match: an anonymous beat can only extend a lease, and its
    // handler documents resolving it to the current attempt on purpose.
    if (typeof body.assignmentId !== "string" || !body.assignmentId) {
      return NextResponse.json(
        {
          error:
            "assignmentId is required: it identifies the attempt being completed, and without it a superseded worker would finalize the current attempt.",
        },
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
      assignmentId: body.assignmentId,
      status: body.status,
      // Passed through unsubstituted. An absent field is absent, not `""`:
      // nothing re-dispatches from this value any more, and manufacturing an
      // empty string here is what previously made an omitted field re-run the
      // work with empty instructions.
      instructions: body.instructions,
      summary: body.summary ?? null,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
