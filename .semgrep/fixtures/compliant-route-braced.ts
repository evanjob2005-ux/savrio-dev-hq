// NULL ARM -- this file is CORRECT and must produce NO finding.
//
// Same enforcement as compliant-route.ts, written with a braced if. It exists
// because the rule now requires the guard's result to be acted on by the very
// next statement, and a tightening of that requirement into "one exact spelling
// of the return" would flag correct code. A rule that flags correct code gets
// muted, and a muted rule enforces nothing.
import { rejectInternalDevRequest } from "@/lib/dev-hq/internal-guard";

export async function POST(request: Request) {
  const rejected = rejectInternalDevRequest(request);
  if (rejected) {
    return rejected;
  }

  return Response.json({ ok: true });
}
