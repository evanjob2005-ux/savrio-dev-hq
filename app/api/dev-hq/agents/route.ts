import { NextResponse } from "next/server";
import { getDevHqAdapters } from "@/lib/dev-hq/adapters";

export const dynamic = "force-dynamic";

/** Read-only live Agent Registry roster. */
export async function GET() {
  const { agentProvider } = getDevHqAdapters();
  const agents = await agentProvider.listAgents();
  return NextResponse.json({ agents });
}
