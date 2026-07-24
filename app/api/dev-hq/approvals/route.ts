import { NextResponse } from "next/server";
import { getDevHqAdapters } from "@/lib/dev-hq/adapters";

export async function GET() {
  const { approvalManager } = getDevHqAdapters();
  const approvals = await approvalManager.listPending();
  return NextResponse.json({ approvals });
}
