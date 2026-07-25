import { metadata, task } from "@trigger.dev/sdk";
import { getDevHqBaseUrl } from "@/lib/dev-hq/constants";
import { getDevHqInternalHeaders } from "@/lib/dev-hq/internal-headers";
import {
  simulateOutcome,
  type AgentExecutionTaskPayload,
} from "@/lib/dev-hq/agent-execution-service";

async function postJson(path: string, body: unknown): Promise<void> {
  const response = await fetch(`${getDevHqBaseUrl()}${path}`, {
    method: "POST",
    headers: getDevHqInternalHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Dev HQ callback failed (${response.status}): ${text}`);
  }
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
  run: async (payload: AgentExecutionTaskPayload) => {
    metadata.set("executionId", payload.executionId);
    metadata.set("stage", "running");
    await postJson("/api/dev-hq/internal/execution/running", {
      executionId: payload.executionId,
      assignmentId: payload.assignmentId,
    });

    const outcome = simulateOutcome(payload.instructions);
    metadata.set("outcome", outcome);

    // A healthy attempt heartbeats before completing; a timeout attempt withholds
    // heartbeats to model a stalled agent (see the simulated-timeout note in the
    // agent-execution service / ADR).
    if (outcome !== "timeout") {
      await postJson("/api/dev-hq/internal/execution/heartbeat", {
        executionId: payload.executionId,
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
