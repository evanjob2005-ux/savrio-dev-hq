import { NextResponse } from "next/server";
import { rejectInternalDevRequest } from "@/lib/dev-hq/internal-guard";
import {
  ApprovalAuthorityError,
  registerApprovalGate,
} from "@/lib/dev-hq/founder-request-service";

export async function POST(request: Request) {
  const rejected = rejectInternalDevRequest(request);
  if (rejected) return rejected;

  try {
    const body = (await request.json()) as {
      executionId?: string;
      approvalId?: string;
    };
    if (!body.executionId || !body.approvalId) {
      return NextResponse.json(
        { error: "executionId and approvalId are required." },
        { status: 400 },
      );
    }
    const approval = await registerApprovalGate({
      executionId: body.executionId,
      approvalId: body.approvalId,
    });
    return NextResponse.json({ approval });
  } catch (error) {
    // An approval that is not this execution's own is a refusal, not a fault.
    // 409 keeps it distinguishable from the server having broken, so run 1 fails
    // on a stated reason rather than retrying a gate it will never be allowed to
    // open.
    if (error instanceof ApprovalAuthorityError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
