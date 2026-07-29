import { NextResponse } from "next/server";
import {
  InvalidRequestError,
  badRequest,
  internalError,
  jsonError,
  readJsonBody,
} from "@/app/api/dev-hq/_lib/route-errors";
import { rejectInternalDevRequest } from "@/lib/dev-hq/internal-guard";
import { toPublicReview } from "@/lib/dev-hq/review-projection";
import {
  ConflictingReviewFindingsError,
  ReviewNotFoundError,
  UnauthorizedReviewCallbackError,
  handleReviewComplete,
  type SimulatedReviewFinding,
} from "@/lib/dev-hq/review-service";
import type { ReviewOutcome } from "@/types/domain";

const VALID_OUTCOMES: readonly ReviewOutcome[] = ["passed", "changes_requested"];
const VALID_SEVERITIES = ["blocking", "advisory"] as const;

/**
 * Parse the submitted findings, refusing the whole callback if any of them is
 * malformed (P1-12).
 *
 * This previously dropped malformed entries and carried on. Silently discarding
 * them is the defect, not the malformation: findings are the *evidence* an
 * outcome is derived from, and a caller whose blocking finding was discarded got
 * a 200 and a passed review with no signal that its evidence had been thrown
 * away. A reviewer that submits `{ ref, severity: "blocking", category }` with no
 * summary is reporting that changes are required; answering "passed" is the
 * worst available response to it.
 *
 * So the callback is refused whole, before any of it is written, and the review
 * stays pending for a corrected submission. Absence of evidence fails closed and
 * says so (STD-CTRL-001 rule 5) rather than resolving on the evidence that
 * happened to survive.
 */
function parseFindings(value: unknown): SimulatedReviewFinding[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new InvalidRequestError(
      "findings must be an array of review findings.",
    );
  }
  return value.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new InvalidRequestError(
        `findings[${index}] must be a review finding object.`,
      );
    }
    const candidate = entry as Partial<SimulatedReviewFinding>;
    const invalid: string[] = [];
    // Blank is rejected alongside absent: the ref keys the durable finding row
    // and its evidence uri, and an empty one is not an identity.
    if (typeof candidate.ref !== "string" || !candidate.ref.trim()) {
      invalid.push("ref must be a non-empty string");
    }
    if (typeof candidate.category !== "string" || !candidate.category.trim()) {
      invalid.push("category must be a non-empty string");
    }
    if (typeof candidate.summary !== "string" || !candidate.summary.trim()) {
      invalid.push("summary must be a non-empty string");
    }
    if (
      !VALID_SEVERITIES.includes(
        candidate.severity as (typeof VALID_SEVERITIES)[number],
      )
    ) {
      invalid.push(`severity must be one of ${VALID_SEVERITIES.join(", ")}`);
    }
    if (invalid.length > 0) {
      throw new InvalidRequestError(
        `findings[${index}] is not a valid review finding: ${invalid.join("; ")}.`,
      );
    }
    return {
      ref: (candidate.ref as string).trim(),
      severity: candidate.severity as SimulatedReviewFinding["severity"],
      category: (candidate.category as string).trim(),
      summary: (candidate.summary as string).trim(),
    };
  });
}

/**
 * Review outcome callback (reviewer -> Work Management Layer).
 *
 * Two independent gates: the shared internal-token guard authenticates the caller
 * as a Dev HQ worker at all, and the per-review callback token authorizes this
 * specific review attempt. The second is validated inside the service against the
 * durably reserved token, so a callback for another review, a superseded
 * iteration, or a fabricated token cannot advance the lifecycle even from an
 * otherwise authenticated worker.
 */
export async function POST(request: Request) {
  const rejected = rejectInternalDevRequest(request);
  if (rejected) return rejected;

  try {
    const body = await readJsonBody<{
      reviewId?: string;
      callbackToken?: string;
      outcome?: ReviewOutcome;
      findings?: unknown;
    }>(request);
    if (!body.reviewId || !body.callbackToken) {
      return badRequest("reviewId and callbackToken are required.");
    }
    if (!body.outcome || !VALID_OUTCOMES.includes(body.outcome)) {
      return badRequest(
        `Invalid review outcome. Expected one of ${VALID_OUTCOMES.join(", ")}.`,
      );
    }

    const result = await handleReviewComplete({
      reviewId: body.reviewId,
      callbackToken: body.callbackToken,
      outcome: body.outcome,
      findings: parseFindings(body.findings),
    });
    // Projected even though the caller is an authenticated worker that already
    // holds the capability: echoing it back buys nothing and only widens what a
    // downstream log of this response could capture.
    return NextResponse.json({
      ...result,
      review: toPublicReview(result.review),
    });
  } catch (error) {
    if (error instanceof InvalidRequestError) {
      return badRequest(error.message);
    }
    // A payload the service evaluated and refused: two disagreeing findings under
    // one reference (P1-13). The caller's error, not the server's, so 400 rather
    // than the 500 that would invite a retry of a request that cannot succeed.
    if (error instanceof ConflictingReviewFindingsError) {
      return badRequest(error.message);
    }
    if (error instanceof UnauthorizedReviewCallbackError) {
      return jsonError(error.message, 403);
    }
    if (error instanceof ReviewNotFoundError) {
      return jsonError(error.message, 404);
    }
    return internalError("POST /api/dev-hq/internal/review/complete", error);
  }
}
