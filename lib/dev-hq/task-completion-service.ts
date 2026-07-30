import { getDevHqAdapters } from "@/lib/dev-hq/adapters";
import { getDevHqStore } from "@/lib/dev-hq/store";

function isNewerAgentExecution(
  candidateId: string,
  authoritativeId: string,
): boolean {
  const executions = [...getDevHqStore().executions.values()];
  const candidateIndex = executions.findIndex(
    (execution) => execution.id === candidateId,
  );
  const authoritativeIndex = executions.findIndex(
    (execution) => execution.id === authoritativeId,
  );
  if (candidateIndex < 0 || authoritativeIndex < 0) {
    return false;
  }

  const candidate = executions[candidateIndex];
  const authoritative = executions[authoritativeIndex];
  const byCreatedAt = candidate.createdAt.localeCompare(
    authoritative.createdAt,
  );
  return byCreatedAt > 0 || (byCreatedAt === 0 && candidateIndex > authoritativeIndex);
}

/**
 * Complete a task only when the successful execution is still the authoritative
 * live-work outcome.
 *
 * The precondition is intentionally evaluated inside updateTaskStatusIf's
 * synchronous check-and-write step. A review callback or execution replay may
 * arrive after another execution or escalation has taken ownership of the task;
 * neither is allowed to overwrite that newer lifecycle state.
 */
export async function completeTaskForSuccessfulExecution(
  executionId: string,
  passedReviewId?: string,
): Promise<boolean> {
  const execution = getDevHqStore().executions.get(executionId);
  if (!execution || execution.status !== "succeeded") {
    return false;
  }

  const applied = await getDevHqAdapters().taskRepository.updateTaskStatusIf(
    execution.taskId,
    "completed",
    (task) => {
      if (task.status === "completed") {
        return true;
      }
      if (task.status !== "active") {
        return false;
      }

      const currentExecution = getDevHqStore().executions.get(executionId);
      if (!currentExecution || currentExecution.status !== "succeeded") {
        return false;
      }

      for (const escalation of getDevHqStore().escalations.values()) {
        if (
          escalation.taskId === task.id &&
          escalation.status === "open"
        ) {
          return false;
        }
      }

      for (const candidate of getDevHqStore().executions.values()) {
        if (
          candidate.taskId === task.id &&
          candidate.id !== executionId &&
          Boolean(candidate.routing) &&
          isNewerAgentExecution(candidate.id, executionId)
        ) {
          return false;
        }
      }

      // A null policy identifies generic/founder-request executions outside the
      // agent review lifecycle. Only an explicitly persisted agent policy can
      // authorize this service to complete the task.
      const policy = currentExecution.reviewPolicy;
      if (!policy) {
        return false;
      }
      if (policy === "none") {
        return passedReviewId === undefined;
      }
      if (!passedReviewId) {
        return false;
      }
      const review = getDevHqStore().reviews.get(passedReviewId);
      return (
        review?.executionId === executionId &&
        review.status === "passed"
      );
    },
  );

  return applied !== null;
}
