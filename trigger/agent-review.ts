import { metadata, task } from "@trigger.dev/sdk";
import { getDevHqBaseUrl } from "@/lib/dev-hq/constants";
import { getDevHqInternalHeaders } from "@/lib/dev-hq/internal-headers";
import {
  simulateReview,
  type AgentReviewTaskPayload,
} from "@/lib/dev-hq/review-service";
import type { ReviewOutcome } from "@/types/domain";

async function postJson<T = unknown>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${getDevHqBaseUrl()}${path}`, {
    method: "POST",
    headers: getDevHqInternalHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Dev HQ callback failed (${response.status}): ${text}`);
  }
  return (await response.json().catch(() => ({}))) as T;
}

interface AgentReviewRunResult {
  reviewId: string;
  outcome: ReviewOutcome;
}

/**
 * Deterministic simulated review (ADR-0002 E1, D-E4). Performs no real AI
 * inference and no code execution: the outcome is derived from the material under
 * review — `/block/i` requests changes, `/revise/i` records an advisory note,
 * anything else passes.
 *
 * The run reports through a token-guarded callback and carries the capability the
 * Work Management Layer reserved for this review. It holds no lease and claims no
 * agent capacity: the review-iteration loop, its bound, and the revision it may
 * authorize are all owned by the review service, and this task only supplies the
 * outcome. Trigger.dev is the durable runner here, not the review logic.
 */
export const agentReview = task({
  id: "agent-review",
  // Fires only after Trigger's own retries are exhausted. No compensating call
  // here, and none is needed: the review stays pending, and because it holds no
  // lease it is the response deadline — not this hook — that recovers it. The
  // sweep re-dispatches an unresponsive review under a fresh attempt key, and
  // escalates once the dispatch allowance is spent.
  onFailure: async ({ payload }) => {
    metadata.set("reviewId", payload.reviewId);
    metadata.set("stage", "failed");
  },
  run: async (
    payload: AgentReviewTaskPayload,
  ): Promise<AgentReviewRunResult> => {
    metadata.set("reviewId", payload.reviewId);
    metadata.set("executionId", payload.executionId);
    metadata.set("stage", "reviewing");

    const { outcome, findings } = simulateReview(
      payload.instructions,
      payload.policy,
    );
    metadata.set("outcome", outcome);

    await postJson("/api/dev-hq/internal/review/complete", {
      reviewId: payload.reviewId,
      callbackToken: payload.callbackToken,
      outcome,
      findings,
    });

    metadata.set("stage", "completed");
    return { reviewId: payload.reviewId, outcome };
  },
});
