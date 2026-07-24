import { NextResponse } from "next/server";
import { rejectInternalDevRequest } from "@/lib/dev-hq/internal-guard";
import { registerApprovalGate } from "@/lib/dev-hq/founder-request-service";

export async function POST(request: Request) {
  const rejected = rejectInternalDevRequest(request);
  if (rejected) return rejected;

  try {
    const body = (await request.json()) as {
      executionId?: string;
      approvalId?: string;
      waitTokenId?: string;
    };
    if (!body.executionId || !body.approvalId || !body.waitTokenId) {
      return NextResponse.json(
        { error: "executionId, approvalId, and waitTokenId are required." },
        { status: 400 },
      );
    }
    const approval = await registerApprovalGate({
      executionId: body.executionId,
      approvalId: body.approvalId,
      waitTokenId: body.waitTokenId,
    });
    return NextResponse.json({ approval });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
