import { NextResponse } from "next/server";
import { internalError, jsonError } from "@/app/api/dev-hq/_lib/route-errors";
import { getDevHqAdapters } from "@/lib/dev-hq/adapters";
import {
  EscalationNotFoundError,
  resolveEscalation,
} from "@/lib/dev-hq/escalation-service";

const ROUTE = "POST /api/dev-hq/escalations/[id]/accept";

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
      return jsonError(error.message, 404);
    }
    return internalError(ROUTE, error);
  }
}
