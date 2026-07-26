import type {
  CreateEscalationInput,
  EscalationStore,
  ReserveRevisionExecutionInput,
  ResolveEscalationInput,
} from "@/types/contracts";
import type { Escalation } from "@/types/domain";
import {
  getDevHqStore,
  getEscalation,
  saveEscalation,
} from "@/lib/dev-hq/store";
import { nextId, nowIso } from "@/lib/dev-hq/id";

/** Development-only in-memory EscalationStore adapter (Task 1E-5). */
export class DevEscalationStore implements EscalationStore {
  async listOpen(): Promise<Escalation[]> {
    return [...getDevHqStore().escalations.values()]
      .filter((escalation) => escalation.status === "open")
      .sort((a, b) => b.raisedAt.localeCompare(a.raisedAt));
  }

  async getEscalation(id: string): Promise<Escalation | null> {
    return getEscalation(id);
  }

  async findOpenByExecution(executionId: string): Promise<Escalation | null> {
    return (
      [...getDevHqStore().escalations.values()]
        .filter(
          (escalation) =>
            escalation.status === "open" &&
            escalation.executionId === executionId,
        )
        .sort((a, b) => b.raisedAt.localeCompare(a.raisedAt))[0] ?? null
    );
  }

  async findByExecution(executionId: string): Promise<Escalation | null> {
    return (
      [...getDevHqStore().escalations.values()].find(
        (escalation) => escalation.executionId === executionId,
      ) ?? null
    );
  }

  async createEscalation(input: CreateEscalationInput): Promise<Escalation> {
    const store = getDevHqStore();
    // Idempotency (Task 1E-5 Fix 1): at most one escalation per (execution, origin),
    // regardless of status. The check and insert are synchronous with no await
    // between them, so concurrent creates cannot both insert. A resolved escalation
    // still dedupes here, preventing a duplicate raise after resolution.
    if (input.executionId) {
      const existing = [...store.escalations.values()].find(
        (escalation) =>
          escalation.executionId === input.executionId &&
          escalation.origin === input.origin,
      );
      if (existing) {
        return existing;
      }
    }

    const escalation: Escalation = {
      id: nextId("esc"),
      origin: input.origin,
      taskId: input.taskId,
      executionId: input.executionId ?? null,
      reviewId: input.reviewId ?? null,
      summary: input.summary,
      status: "open",
      resolution: null,
      raisedByAgentId: input.raisedByAgentId ?? null,
      raisedAt: input.at ?? nowIso(),
      resolvedAt: null,
      revisionExecutionId: null,
    };
    return saveEscalation(escalation);
  }

  async resolveEscalation(
    input: ResolveEscalationInput,
  ): Promise<Escalation | null> {
    const existing = getEscalation(input.escalationId);
    if (!existing || existing.status !== "open") {
      return null;
    }
    return saveEscalation({
      ...existing,
      status: "resolved",
      resolution: input.resolution,
      resolvedAt: input.at ?? nowIso(),
    });
  }

  async reserveRevisionExecution(
    input: ReserveRevisionExecutionInput,
  ): Promise<string> {
    const existing = getEscalation(input.escalationId);
    if (!existing) {
      throw new Error(`Escalation not found: ${input.escalationId}`);
    }
    // Reserve-once (Task 1E-5). The read, the check and the write are
    // synchronous with no await between them, so concurrent callers cannot both
    // reserve: the first writes, every later one reads the persisted value and
    // returns it unchanged. This — not evidence — is the revise idempotency
    // boundary, and it is set *before* the execution is created so a creation
    // failure leaves the id permanently allocated for a replay to retry with.
    if (existing.revisionExecutionId) {
      return existing.revisionExecutionId;
    }
    saveEscalation({ ...existing, revisionExecutionId: input.executionId });
    return input.executionId;
  }
}

export function createDevEscalationStore(): DevEscalationStore {
  return new DevEscalationStore();
}
