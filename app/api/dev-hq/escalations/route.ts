import { NextResponse } from "next/server";
import { getDevHqAdapters } from "@/lib/dev-hq/adapters";

export async function GET() {
  const { escalationStore } = getDevHqAdapters();
  const escalations = await escalationStore.listOpen();
  return NextResponse.json({ escalations });
}
