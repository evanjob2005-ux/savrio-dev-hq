import { NextResponse } from "next/server";
import { internalError } from "@/app/api/dev-hq/_lib/route-errors";
import { getDevHqAdapters } from "@/lib/dev-hq/adapters";

export async function GET() {
  try {
    const { approvalManager } = getDevHqAdapters();
    const approvals = await approvalManager.listPending();
    return NextResponse.json({ approvals });
  } catch (error) {
    return internalError("GET /api/dev-hq/approvals", error);
  }
}
