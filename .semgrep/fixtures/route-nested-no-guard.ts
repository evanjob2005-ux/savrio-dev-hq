// DEFECT: unguarded handler at NESTED depth -- two directories below
// app/api/dev-hq/internal/, not one.
//
// This fixture exists for the control, not for the rule. Every other known-bad
// fixture is copied to app/api/dev-hq/internal/<one-dir>/route.ts, so the whole
// positive control lived at a single depth. Narrowing the rule's path glob from
// `internal/**/route.ts` to `internal/*/route.ts` -- one character -- left all
// twelve fixtures detected and all three compliant fixtures clean, while SIX of
// the ten real internal routes stopped being scanned at all:
//
//   execution/complete   execution/dispatch   execution/heartbeat
//   execution/reclaim    execution/running    review/complete
//
// Those are unauthenticated write paths into the execution pipeline, and the
// blocking gate went blind to them with the control still reporting PASS. The
// control could not see the difference because nothing it scanned was ever more
// than one directory deep.
//
// The control copies this file to internal/nested/deeper/route.ts. Keep it at
// that depth: the depth IS the defect class this fixture covers.
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  return Response.json({ received: body });
}
