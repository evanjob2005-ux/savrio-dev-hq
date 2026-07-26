import { metadata, task } from "@trigger.dev/sdk";
import { getDevHqBaseUrl } from "@/lib/dev-hq/constants";
import { getDevHqInternalHeaders } from "@/lib/dev-hq/internal-headers";
import {
  simulateOutcome,
  type AgentExecutionTaskPayload,
} from "@/lib/dev-hq/agent-execution-service";
import type { AgentExecutionStatus } from "@/types/domain";

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

/** What the durable run reports back to Trigger. */
interface AgentExecutionRunResult {
  executionId: string;
  /** The attempt outcome, or `stood_down` when this run never held the claim. */
  status: AgentExecutionStatus | "stood_down";
}

/**
 * Deterministic simulated agent execution (ADR-0001 D4/O4). Performs no real AI or
 * code execution: it claims the assigned agent, optionally heartbeats, and reports
 * a simulated outcome derived from the instructions text.
 *
 * The 3-attempt Work-Management retry budget is owned by the Execution Manager and
 * driven through the complete callback, which re-dispatches this task for each
 * remaining attempt. Trigger's own retries handle transient callback failures
 * within a single attempt (ADR-0001 D1).
 */
export const agentExecution = task({
  id: "agent-execution",
  // Fires only after Trigger's own retries are exhausted (a genuine infra
  // failure). No escalation callback here: the execution's lease will expire and
  // be reclaimed by the Sprint 1E sweeper (reclaimStale already exists).
  onFailure: async ({ payload }) => {
    metadata.set("executionId", payload.executionId);
    metadata.set("stage", "failed");
  },
  run: async (
    payload: AgentExecutionTaskPayload,
  ): Promise<AgentExecutionRunResult> => {
    metadata.set("executionId", payload.executionId);
    metadata.set("stage", "running");

    // The claim is the capacity reservation (ADR-0001). This run may lose it —
    // two dispatches can be assigned the same capacity-one agent before either
    // claims — so the callback's answer is checked rather than assumed. Without
    // the claim this attempt is not current and must report nothing; the Work
    // Management Layer recovers it through the claim deadline.
    const claimed = await postJson<{
      execution?: { status?: string; assignmentId?: string | null };
    }>("/api/dev-hq/internal/execution/running", {
      executionId: payload.executionId,
      assignmentId: payload.assignmentId,
    });
    const holdsClaim =
      claimed.execution?.status === "running" &&
      claimed.execution?.assignmentId === payload.assignmentId;
    if (!holdsClaim) {
      metadata.set("stage", "not-claimed");
      return { executionId: payload.executionId, status: "stood_down" };
    }

    const outcome = simulateOutcome(payload.instructions);
    metadata.set("outcome", outcome);

    // A healthy attempt heartbeats before completing; a timeout attempt withholds
    // heartbeats to model a stalled agent (see the simulated-timeout note in the
    // agent-execution service / ADR). The assignment identifies this attempt, so a
    // superseded worker's beat cannot extend a successor's lease.
    if (outcome !== "timeout") {
      await postJson("/api/dev-hq/internal/execution/heartbeat", {
        executionId: payload.executionId,
        assignmentId: payload.assignmentId,
      });
    }

    await postJson("/api/dev-hq/internal/execution/complete", {
      executionId: payload.executionId,
      assignmentId: payload.assignmentId,
      status: outcome,
      instructions: payload.instructions,
      summary: `Simulated agent ${outcome}.`,
    });

    metadata.set("stage", "completed");
    return { executionId: payload.executionId, status: outcome };
  },
});
