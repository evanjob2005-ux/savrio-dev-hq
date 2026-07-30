// DEFECT: the guard is present, binds its result and returns it -- but it runs
// AFTER the write it is supposed to gate. The rule message asserts "first
// statement"; a pattern-not opening with `...` did not enforce that, so this
// file satisfied the rule while the unauthenticated write had already landed.
import { rejectInternalDevRequest } from "@/lib/dev-hq/internal-guard";
import { deleteExecution } from "@/lib/dev-hq/agent-execution-service";

export async function POST(request: Request) {
  const body = (await request.json()) as { executionId: string };
  await deleteExecution(body.executionId);

  const rejected = rejectInternalDevRequest(request);
  if (rejected) return rejected;

  return Response.json({ ok: true });
}
