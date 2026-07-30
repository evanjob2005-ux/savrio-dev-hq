import { NextResponse } from "next/server";
import { getDevHqDeploymentMode } from "@/lib/dev-hq/deployment-mode";

/**
 * Dev HQ is local-only. Nothing under /api/dev-hq/* authenticates the
 * caller yet — including the founder approve/reject endpoints — so the whole
 * surface fails closed unless the deployment is explicitly marked local.
 * Optimized-build status is not a network trust boundary. The per-route guard
 * still protects worker callbacks; this is the outer boundary for everything
 * else.
 */
export function proxy() {
  if (getDevHqDeploymentMode() !== "local") {
    return NextResponse.json(
      { error: "Dev HQ APIs are disabled for this deployment." },
      { status: 403 },
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/api/dev-hq/:path*",
};
