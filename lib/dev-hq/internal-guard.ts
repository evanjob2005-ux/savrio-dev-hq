import { NextResponse } from "next/server";

export const DEV_HQ_INTERNAL_TOKEN_HEADER = "x-dev-hq-internal-token";

/**
 * Guards Trigger.dev worker callbacks into /api/dev-hq/internal/*.
 * Blocked in production. Optional DEV_HQ_INTERNAL_TOKEN when set.
 */
export function rejectInternalDevRequest(
  request: Request,
): NextResponse | null {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Internal Dev HQ routes are disabled in production." },
      { status: 403 },
    );
  }

  const expectedToken = process.env.DEV_HQ_INTERNAL_TOKEN;
  if (expectedToken) {
    const provided = request.headers.get(DEV_HQ_INTERNAL_TOKEN_HEADER);
    if (provided !== expectedToken) {
      return NextResponse.json(
        { error: "Invalid or missing internal development token." },
        { status: 401 },
      );
    }
  }

  return null;
}
