import { NextResponse } from "next/server";
import { getDevHqStateSnapshot } from "@/lib/dev-hq/founder-request-service";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getDevHqStateSnapshot());
}
