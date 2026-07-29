"use server";

// Server Actions for Dev HQ UI controls. Running on the server, these call the
// domain services directly (in-process), so the browser never needs — and never
// receives — the internal callback token (DEV_HQ_INTERNAL_TOKEN). That token is
// only used server-to-server by the Trigger.dev worker calling back into the
// token-guarded /api/dev-hq/internal/* routes.

import {
  ConflictingDispatchRequestError,
  dispatchAgentExecution,
  dispatchExecutionIdFor,
  UndispatchableRequestError,
  type DispatchAgentExecutionResult,
} from "@/lib/dev-hq/agent-execution-service";
import { getDevHqDeploymentMode } from "@/lib/dev-hq/deployment-mode";

/**
 * A dispatch outcome the browser can act on.
 *
 * `resolved` is the part that matters for idempotency: it says whether the server
 * reached a definitive answer about this request identity. An exception thrown
 * anywhere after the canonical execution was created is *not* definitive — state
 * may exist — so the browser must keep the identity and resume with it rather
 * than starting a second logical dispatch. Only a returned result, or a rejection
 * that provably created nothing, resolves the identity.
 */
export type DispatchActionResult =
  | { ok: true; resolved: true; result: DispatchAgentExecutionResult }
  | { ok: false; resolved: boolean; error: string; executionId: string | null };

export async function dispatchAgentExecutionAction(input: {
  taskId: string;
  requiredCapabilities?: string[];
  preferredAgentId?: string;
  instructions?: string;
  /**
   * Per-submission key from the panel. Re-submitting the same form submission —
   * a double click, a retried action, two tabs racing — resolves to one
   * execution, one assignment, and one durable run instead of duplicates.
   */
  idempotencyKey?: string;
}): Promise<DispatchActionResult> {
  // Phase 1 agents are deterministic simulations (ADR-0001 D4). ADR-0004 alone
  // makes explicit local deployment mode the boundary: optimized local builds
  // remain testable, while unset and unknown modes fail closed.
  if (getDevHqDeploymentMode() !== "local") {
    // Rejected before any state could exist: definitively nothing to recover.
    return {
      ok: false,
      resolved: true,
      error: "Agent dispatch is disabled for this deployment.",
      executionId: null,
    };
  }

  if (!input.taskId) {
    return {
      ok: false,
      resolved: true,
      error: "Select a task before dispatching.",
      executionId: null,
    };
  }

  try {
    const result = await dispatchAgentExecution({
      taskId: input.taskId,
      requiredCapabilities: input.requiredCapabilities,
      preferredAgentId: input.preferredAgentId,
      instructions: input.instructions,
      idempotencyKey: input.idempotencyKey,
    });
    return { ok: true, resolved: true, result };
  } catch (error) {
    // Two definitive refusals, and only one of them was classified (NBF-1).
    //
    // A conflicting replay is definitive because the stored request differs, so
    // this identity will never accept these parameters. An undispatchable request
    // is definitive for a stronger reason: both eligibility asserts run *before*
    // `ensureExecution`, and only when the canonical execution does not yet
    // exist, so nothing was created and there is provably nothing to recover.
    //
    // Leaving it unclassified had a concrete cost on the shipped path. The
    // founder ticks `validation` and `routing` in DispatchAgentPanel — two
    // adjacent checkboxes the capability-partitioned roster cannot satisfy
    // together — the request is refused, this returned `resolved: false`, the
    // panel never retired the pending key, and it showed a retryable-looking hold
    // on a request that will be refused identically forever.
    const definitive =
      error instanceof ConflictingDispatchRequestError ||
      error instanceof UndispatchableRequestError;
    return {
      ok: false,
      resolved: definitive,
      error: error instanceof Error ? error.message : "Dispatch failed.",
      // The canonical id is derived from the key, so the browser can be told
      // which execution to look at even when the call failed part-way through.
      executionId: input.idempotencyKey
        ? dispatchExecutionIdFor(input.idempotencyKey)
        : null,
    };
  }
}
