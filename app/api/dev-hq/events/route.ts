import { NextResponse } from "next/server";
import { getDevHqAdapters } from "@/lib/dev-hq/adapters";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? "20");
  const { eventLogger } = getDevHqAdapters();
  const events = await eventLogger.listRecent({ limit });
  return NextResponse.json({ events });
}
