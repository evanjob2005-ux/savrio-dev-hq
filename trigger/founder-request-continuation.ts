import { metadata, task } from "@trigger.dev/sdk";
import { getDevHqBaseUrl } from "@/lib/dev-hq/constants";
import { getDevHqInternalHeaders } from "@/lib/dev-hq/internal-headers";

/**
 * Run 2 of the split founder-request workflow.
 *
 * Started by the founder's decision rather than resumed from a waitpoint, so the
 * decision has continuation authority that does not depend on a run that may
 * already be dead. Reaching this task at all is the evidence that the workflow
 * advanced; the finalize callback is what turns that evidence into a completed
 * approval.
 *
 * PKGE-HAZARD-1: this module runs on the Trigger.dev worker, in a different
 * process from the Next.js server that owns the in-memory store. It therefore
 * imports only pure helpers — a base-URL reader and a header builder — and
 * reaches Dev HQ state exclusively over the guarded internal HTTP callbacks. An
 * import that pulled in the store would give the worker a second, empty copy of
 * it and make every read silently wrong. Enforced by
 * lib/dev-hq/continuation-import-boundary.test.ts.
 */
interface FounderRequestContinuationPayload {
  executionId: string;
  approvalId: string;
  decision: "approved" | "rejected";
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${getDevHqBaseUrl()}${path}`, {
    method: "POST",
    headers: getDevHqInternalHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Dev HQ callback failed (${response.status}): ${text}`);
  }
  return response.json() as Promise<T>;
}

export const founderRequestContinuation = task({
  id: "founder-request-continuation",
  // Only runs once the run has exhausted its retries, so Dev HQ is not marked
  // failed while an attempt could still succeed.
  onFailure: async ({ payload, error }) => {
    await postJson("/api/dev-hq/internal/fail", {
      executionId: payload.executionId,
      message:
        error instanceof Error
          ? error.message
          : "Founder decision continuation failed due to a technical error.",
    });
  },
  run: async (payload: FounderRequestContinuationPayload) => {
    metadata.set("executionId", payload.executionId);
    metadata.set("stage", payload.decision);

    await postJson("/api/dev-hq/internal/finalize", {
      executionId: payload.executionId,
      decision: payload.decision,
      rejectionKind: payload.decision === "rejected" ? "founder" : null,
      approvalId: payload.approvalId,
    });

    metadata.set("stage", "completed");
    return {
      executionId: payload.executionId,
      outcome: "decided" as const,
      decision: payload.decision,
      rejectionKind:
        payload.decision === "rejected" ? ("founder" as const) : null,
    };
  },
});
