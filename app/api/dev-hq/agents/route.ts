import { NextResponse } from "next/server";
import { internalError } from "@/app/api/dev-hq/_lib/route-errors";
import { getDevHqAdapters } from "@/lib/dev-hq/adapters";

export const dynamic = "force-dynamic";

/** Read-only live Agent Registry roster. */
export async function GET() {
  try {
    const { agentProvider } = getDevHqAdapters();
    const agents = await agentProvider.listAgents();
    return NextResponse.json({ agents });
  } catch (error) {
    // Previously unhandled, so an adapter failure became the framework's own
    // error page — a different body shape and, in dev, the raw stack.
    return internalError("GET /api/dev-hq/agents", error);
  }
}
