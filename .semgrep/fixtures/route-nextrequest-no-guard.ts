// DEFECT: unguarded handler annotated with NextRequest, the idiomatic Next.js
// request type. A rule that only knew the literal `Request` could not see this,
// so the recommended way to write a handler was the way that evaded the rule.
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  return Response.json({ received: await request.json() });
}
