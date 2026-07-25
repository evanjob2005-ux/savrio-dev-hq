import { NextResponse } from "next/server";

/**
 * Dev HQ is development-only. Nothing under /api/dev-hq/* authenticates the
 * caller yet — including the founder approve/reject endpoints — so the whole
 * surface fails closed in production until a real authentication boundary
 * exists. The per-route guard in lib/dev-hq/internal-guard.ts still protects
 * the worker callbacks; this is the outer boundary for everything else.
 */
export function proxy() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Dev HQ APIs are disabled in production." },
      { status: 403 },
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/api/dev-hq/:path*",
};
