// NULL ARM -- this file is CORRECT and must produce NO finding.
//
// The nested-depth counterpart of compliant-route.ts. route-nested-no-guard.ts
// proves the rule still REACHES two directories below internal/; this proves it
// does not simply fire on everything it reaches there. Widening the path glob
// and widening the pattern are different mutations, and a depth arm with only a
// known-bad half catches the first while passing the second.
import { rejectInternalDevRequest } from "@/lib/dev-hq/internal-guard";

export async function POST(request: Request) {
  const rejected = rejectInternalDevRequest(request);
  if (rejected) return rejected;

  return Response.json({ ok: true });
}
