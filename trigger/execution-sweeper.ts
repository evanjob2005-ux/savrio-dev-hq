import { schedules } from "@trigger.dev/sdk";
import { EXECUTION_SWEEP_CRON, getDevHqBaseUrl } from "@/lib/dev-hq/constants";
import { getDevHqInternalHeaders } from "@/lib/dev-hq/internal-headers";

/**
 * Scheduled lease sweeper (Task 1E-3). Runs every minute (matched to the lease
 * TTL) and asks Dev HQ to reclaim any expired-lease executions. The actual
 * recovery — moving each timed-out attempt to a new assignment identity, emitting
 * the reclaimed event, and re-dispatching — happens in the token-guarded
 * /api/dev-hq/internal/execution/reclaim handler. Trigger.dev is the durable
 * scheduler here, not the recovery logic.
 */
export const executionSweeper = schedules.task({
  id: "execution-sweeper",
  cron: EXECUTION_SWEEP_CRON,
  // Expire a queued sweep run if a previous one is still going, rather than
  // stacking stale runs.
  ttl: "50s",
  run: async () => {
    const response = await fetch(
      `${getDevHqBaseUrl()}/api/dev-hq/internal/execution/reclaim`,
      { method: "POST", headers: getDevHqInternalHeaders() },
    );
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Dev HQ reclaim failed (${response.status}): ${text}`);
    }
    return (await response.json()) as { reclaimed: number };
  },
});
