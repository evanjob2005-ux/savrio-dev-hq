import { NextResponse } from "next/server";

export const DEV_HQ_INTERNAL_TOKEN_HEADER = "x-dev-hq-internal-token";

/**
 * Guards Trigger.dev worker callbacks into /api/dev-hq/internal/*.
 * Blocked in production. Requires DEV_HQ_INTERNAL_TOKEN, and fails closed when
 * it is not configured so the callbacks are never unauthenticated by default.
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
  if (!expectedToken) {
    return NextResponse.json(
      {
        error:
          "DEV_HQ_INTERNAL_TOKEN is not configured. Set it in .env.local so Next.js and the Trigger.dev worker share the same internal token.",
      },
      { status: 503 },
    );
  }

  const provided = request.headers.get(DEV_HQ_INTERNAL_TOKEN_HEADER);
  if (provided !== expectedToken) {
    return NextResponse.json(
      { error: "Invalid or missing internal development token." },
      { status: 401 },
    );
  }

  return null;
}
