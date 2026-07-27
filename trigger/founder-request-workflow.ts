import { metadata, task } from "@trigger.dev/sdk";
import { getDevHqBaseUrl } from "@/lib/dev-hq/constants";
import { getDevHqInternalHeaders } from "@/lib/dev-hq/internal-headers";

interface ExecutiveReviewResponse {
  passed: boolean;
  summary: string;
  approvalId: string | null;
  idempotent?: boolean;
}

interface FounderRequestWorkflowPayload {
  executionId: string;
  taskId: string;
  projectId: string;
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

/**
 * First real Dev HQ workflow — deterministic, no AI, no code execution.
 *
 * Run 1 of two. It carries the request through executive review and, when review
 * passes, registers the approval gate and ends. It does not wait.
 *
 * The split is the point (Founder Decision A1, R3). Previously this run suspended
 * at a waitpoint that held the workflow's only continuation authority, so the run
 * could die while the approval record survived and neither could repair the
 * other. Ending here means there is nothing suspended to lose: the founder's
 * decision starts a fresh run rather than resuming a parked one.
 */
export const founderRequestWorkflow = task({
  id: "founder-request-workflow",
  // Only runs once the run has exhausted its retries, so Dev HQ is not marked
  // failed while an attempt could still succeed.
  onFailure: async ({ payload, error }) => {
    await postJson("/api/dev-hq/internal/fail", {
      executionId: payload.executionId,
      message:
        error instanceof Error
          ? error.message
          : "Workflow failed due to a technical error.",
    });
  },
  run: async (payload: FounderRequestWorkflowPayload) => {
    metadata.set("stage", "founder_request_received");
    metadata.set("executionId", payload.executionId);

    metadata.set("stage", "executive_review");
    const review = await postJson<ExecutiveReviewResponse>(
      "/api/dev-hq/internal/executive-review",
      { executionId: payload.executionId },
    );

    if (!review.passed) {
      metadata.set("stage", "validation_rejected");
      metadata.set("stage", "completed");
      return {
        executionId: payload.executionId,
        outcome: "decided" as const,
        decision: "rejected" as const,
        rejectionKind: "validation" as const,
        summary: review.summary,
      };
    }

    metadata.set("stage", "founder_approval_required");
    await postJson("/api/dev-hq/internal/approval-gate", {
      executionId: payload.executionId,
      approvalId: review.approvalId,
    });

    // Terminal and successful. The workflow has not been abandoned — it has
    // reached a boundary it is not this run's job to cross. Returning normally is
    // what makes that boundary observable: a completed run means the gate was
    // registered, and nothing about the founder's answer is asserted here.
    return {
      executionId: payload.executionId,
      outcome: "awaiting_founder_decision" as const,
      decision: null,
      rejectionKind: null,
      approvalId: review.approvalId,
      summary: review.summary,
    };
  },
});
