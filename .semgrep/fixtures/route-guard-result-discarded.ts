// DEFECT: calls the guard but discards its result, so a rejection never returns
// and execution continues unauthenticated. The identifier is present, which is
// why a substring check could not catch this.
import { rejectInternalDevRequest } from "@/lib/dev-hq/internal-guard";

export async function POST(request: Request) {
  rejectInternalDevRequest(request);
  return Response.json({ ok: true });
}
