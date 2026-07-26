import { NextResponse } from "next/server";
import { getDevHqAdapters } from "@/lib/dev-hq/adapters";
import {
  EscalationNotFoundError,
  resolveEscalation,
} from "@/lib/dev-hq/escalation-service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const escalation = await resolveEscalation(id, "accept");
    const state = await getDevHqAdapters().stateReader.getState();
    return NextResponse.json({ escalation, state });
  } catch (error) {
    if (error instanceof EscalationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
