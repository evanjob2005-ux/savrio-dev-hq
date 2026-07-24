import { NextResponse } from "next/server";
import { approveFounderRequest } from "@/lib/dev-hq/founder-request-service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const state = await approveFounderRequest(id);
    return NextResponse.json({ state });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
