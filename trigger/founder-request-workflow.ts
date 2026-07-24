import { metadata, task, wait } from "@trigger.dev/sdk";
import { getDevHqBaseUrl } from "@/lib/dev-hq/constants";
import { getDevHqInternalHeaders } from "@/lib/dev-hq/internal-headers";

interface ExecutiveReviewResponse {
  passed: boolean;
  summary: string;
  approvalId: string | null;
  idempotent?: boolean;
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

/** First real Dev HQ workflow — deterministic, no AI, no code execution. */
export const founderRequestWorkflow = task({
  id: "founder-request-workflow",
  run: async (payload: {
    executionId: string;
    taskId: string;
    projectId: string;
  }) => {
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
        decision: "rejected" as const,
        rejectionKind: "validation" as const,
        summary: review.summary,
      };
    }

    const token = await wait.createToken({
      timeout: "7d",
      tags: [`execution-${payload.executionId}`],
    });

    metadata.set("stage", "founder_approval_required");
    await postJson("/api/dev-hq/internal/approval-gate", {
      executionId: payload.executionId,
      approvalId: review.approvalId,
      waitTokenId: token.id,
    });

    const decision = await wait.forToken<{ approved: boolean }>(token).unwrap();
    const outcome = decision.approved ? "approved" : "rejected";
    metadata.set("stage", outcome === "approved" ? "approved" : "rejected");

    await postJson("/api/dev-hq/internal/finalize", {
      executionId: payload.executionId,
      decision: outcome,
      rejectionKind: outcome === "rejected" ? "founder" : null,
      approvalId: review.approvalId,
    });

    metadata.set("stage", "completed");
    return {
      executionId: payload.executionId,
      decision: outcome,
      rejectionKind: outcome === "rejected" ? ("founder" as const) : null,
      summary: review.summary,
    };
  },
});
