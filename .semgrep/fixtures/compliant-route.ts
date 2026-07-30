// NULL ARM -- this file is CORRECT and must produce NO finding.
//
// Its job is to fail the positive control if a rule is ever widened into
// something that fires on everything. Without a null arm, a rule mutated to
// match every handler still detects all the known-bad fixtures and the control
// reports success, which is the defect this file exists to make impossible.
//
// Guard first, result bound, result returned: the shape every internal route
// in app/api/dev-hq/internal/ actually uses.
import { rejectInternalDevRequest } from "@/lib/dev-hq/internal-guard";

export async function POST(request: Request) {
  const rejected = rejectInternalDevRequest(request);
  if (rejected) return rejected;

  return Response.json({ ok: true });
}
