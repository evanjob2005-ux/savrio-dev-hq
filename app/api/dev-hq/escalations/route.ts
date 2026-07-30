import { NextResponse } from "next/server";
import { internalError } from "@/app/api/dev-hq/_lib/route-errors";
import { getDevHqAdapters } from "@/lib/dev-hq/adapters";

export async function GET() {
  try {
    const { escalationStore } = getDevHqAdapters();
    const escalations = await escalationStore.listOpen();
    return NextResponse.json({ escalations });
  } catch (error) {
    return internalError("GET /api/dev-hq/escalations", error);
  }
}
