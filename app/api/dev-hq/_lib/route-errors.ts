// Shared HTTP error mapping for Dev HQ routes (P2-33).
//
// Two defects this exists to close, both of which were repeated in almost every
// route's terminal `catch`:
//
//   1. Status. `catch { return 500 }` answers a malformed request by blaming the
//      server for the caller's mistake. A 500 is retryable and pages an operator;
//      a 400 is neither. Conflating them means a caller retries a request that
//      can never succeed, and an outage and a typo look identical in the logs.
//
//   2. Leakage. `error.message` from an arbitrary throw is written by whatever
//      failed, not by anyone deciding what a caller may see. Under an unexpected
//      failure that is an internal identifier, a file path, or a driver's text.
//      The 500 body therefore carries a fixed message and the real error goes to
//      the server log instead.
//
// Deliberately NOT a generic exception-to-status registry. Each route keeps its
// own explicit `instanceof` chain for the typed errors it can actually receive,
// because that mapping is the route's contract and should be readable at the
// route. This module supplies only the parts that must not vary: the shape of an
// error body, how a malformed body is refused, and the one terminal 500.
//
// The typed-error-to-status shape follows the precedent set by commit 9c1420f
// (ApprovalAuthorityError -> 409): a refusal the server evaluated is a distinct
// class with its own status, so it is never read as an outage and retried as one.

import { NextResponse } from "next/server";

/**
 * A request this route evaluated and refused as the caller's error: wrong shape,
 * wrong vocabulary, out of range, or internally contradictory.
 *
 * Its message is caller-facing by construction — it is written at the boundary
 * that refused the request, never propagated from an internal failure — so it is
 * the one message class that is safe to return verbatim.
 */
export class InvalidRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidRequestError";
  }
}

/**
 * The body every 500 carries. Fixed, so no internal detail can reach a caller
 * through the one branch that handles errors nobody anticipated.
 */
export const INTERNAL_ERROR_MESSAGE =
  "The request could not be completed due to an internal error.";

/** The single error-body shape every Dev HQ route answers with. */
export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** 400 for a request the route refused. */
export function badRequest(message: string): NextResponse {
  return jsonError(message, 400);
}

/**
 * Parse a JSON request body, refusing a malformed one as a 400.
 *
 * `Request.json()` throws a `SyntaxError` whose message quotes the offending
 * bytes. Routes previously let that reach the terminal catch, so a body of
 * `not json` produced a 500 whose text was a parser's opinion of the caller's
 * input — wrong status and an unreviewed message in one call.
 */
export async function readJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new InvalidRequestError("Request body must be valid JSON.");
  }
}

/**
 * The terminal branch of every route's `catch`, for errors the route did not
 * anticipate. Answers a fixed 500 and records the real cause server-side.
 *
 * The cause goes to the server log rather than the event log on purpose: the
 * event log is the append-only lifecycle timeline (ADR-0002 E5), and an
 * infrastructure failure is not a lifecycle fact about any entity.
 */
export function internalError(route: string, error: unknown): NextResponse {
  console.error(`[dev-hq] ${route} failed`, error);
  return jsonError(INTERNAL_ERROR_MESSAGE, 500);
}
