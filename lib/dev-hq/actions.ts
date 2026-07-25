"use server";

// Server Actions for Dev HQ UI controls. Running on the server, these call the
// domain services directly (in-process), so the browser never needs — and never
// receives — the internal callback token (DEV_HQ_INTERNAL_TOKEN). That token is
// only used server-to-server by the Trigger.dev worker calling back into the
// token-guarded /api/dev-hq/internal/* routes.

import {
  dispatchAgentExecution,
  type DispatchAgentExecutionResult,
} from "@/lib/dev-hq/agent-execution-service";

export type DispatchActionResult =
  | { ok: true; result: DispatchAgentExecutionResult }
  | { ok: false; error: string };

export async function dispatchAgentExecutionAction(input: {
  taskId: string;
  requiredCapabilities?: string[];
  instructions?: string;
}): Promise<DispatchActionResult> {
  // Simulated agents are a development-only capability (ADR-0001 D4/D7), matching
  // the prod-disabled internal dispatch route.
  if (process.env.NODE_ENV === "production") {
    return { ok: false, error: "Agent dispatch is disabled in production." };
  }

  if (!input.taskId) {
    return { ok: false, error: "Select a task before dispatching." };
  }

  try {
    const result = await dispatchAgentExecution({
      taskId: input.taskId,
      requiredCapabilities: input.requiredCapabilities,
      instructions: input.instructions,
    });
    return { ok: true, result };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Dispatch failed.",
    };
  }
}
