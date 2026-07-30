import { NextResponse } from "next/server";
import { internalError } from "@/app/api/dev-hq/_lib/route-errors";
import { getDevHqStateSnapshot } from "@/lib/dev-hq/founder-request-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getDevHqStateSnapshot());
  } catch (error) {
    return internalError("GET /api/dev-hq/state", error);
  }
}
