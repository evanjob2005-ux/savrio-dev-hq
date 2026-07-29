// DEFECT: the guard is the FIRST statement, its result IS bound, and its result
// IS returned -- every requirement the previous rule checked -- and the write
// still happens unauthenticated, because the rejection is not acted on until
// after it.
//
// This is the case route-guard-after-write.ts does NOT cover. There the guard
// ran after the write and failed the "first statement" requirement. Here it
// runs first and passes that requirement; what it fails is that a `...` was
// allowed between the binding and the return. Calling a guard is not enforcing
// one.
import { rejectInternalDevRequest } from "@/lib/dev-hq/internal-guard";
import { deleteExecution } from "@/lib/dev-hq/agent-execution-service";

export async function POST(request: Request) {
  const rejected = rejectInternalDevRequest(request);
  await deleteExecution("execution-under-attack");
  if (rejected) return rejected;

  return Response.json({ ok: true });
}
