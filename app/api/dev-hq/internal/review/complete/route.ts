import { NextResponse } from "next/server";
import { rejectInternalDevRequest } from "@/lib/dev-hq/internal-guard";
import { toPublicReview } from "@/lib/dev-hq/review-projection";
import {
  ReviewNotFoundError,
  UnauthorizedReviewCallbackError,
  handleReviewComplete,
  type SimulatedReviewFinding,
} from "@/lib/dev-hq/review-service";
import type { ReviewOutcome } from "@/types/domain";

const VALID_OUTCOMES: readonly ReviewOutcome[] = ["passed", "changes_requested"];
const VALID_SEVERITIES = ["blocking", "advisory"] as const;

function parseFindings(value: unknown): SimulatedReviewFinding[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const candidate = entry as Partial<SimulatedReviewFinding>;
    if (
      typeof candidate.ref !== "string" ||
      typeof candidate.category !== "string" ||
      typeof candidate.summary !== "string" ||
      !VALID_SEVERITIES.includes(
        candidate.severity as (typeof VALID_SEVERITIES)[number],
      )
    ) {
      return [];
    }
    return [
      {
        ref: candidate.ref,
        severity: candidate.severity as SimulatedReviewFinding["severity"],
        category: candidate.category,
        summary: candidate.summary,
      },
    ];
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
    const body = (await request.json()) as {
      reviewId?: string;
      callbackToken?: string;
      outcome?: ReviewOutcome;
      findings?: unknown;
    };
    if (!body.reviewId || !body.callbackToken) {
      return NextResponse.json(
        { error: "reviewId and callbackToken are required." },
        { status: 400 },
      );
    }
    if (!body.outcome || !VALID_OUTCOMES.includes(body.outcome)) {
      return NextResponse.json(
        { error: `Invalid review outcome: ${body.outcome}` },
        { status: 400 },
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
    if (error instanceof UnauthorizedReviewCallbackError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof ReviewNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
