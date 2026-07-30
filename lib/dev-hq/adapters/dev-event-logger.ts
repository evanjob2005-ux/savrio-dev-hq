import type { EventLogger, LogEventInput } from "@/types/contracts";
import type { Event, EventEntityType } from "@/types/domain";
import { appendEvent, getDevHqStore } from "@/lib/dev-hq/store";
import { nextId, nowIso } from "@/lib/dev-hq/id";

/** Development-only in-memory EventLogger adapter. */
export class DevEventLogger implements EventLogger {
  async log(input: LogEventInput): Promise<Event> {
    const event: Event = {
      id: nextId("evt"),
      type: input.type,
      entityType: input.entityType,
      entityId: input.entityId,
      message: input.message,
      actorId: input.actorId ?? null,
      actorLabel: input.actorLabel,
      timestamp: nowIso(),
    };
    return appendEvent(event, input.dedupeKey);
  }

  /**
   * The newest events, newest first (SVC-04).
   *
   * Reads the event buffer alone. It used to read `buildDevHqState()`, which
   * projects and sorts *every* collection in the store — projects, tasks,
   * approvals, workflows, executions, workflow runs, agents, evidence,
   * escalations, reviews, review findings — plus the overview counters and the
   * public-review projection, and then discarded all of it to keep at most 20
   * events. Mission Control polls this every 3 seconds, so the cost of the
   * discarded work grew with total accumulated history rather than with the
   * feed.
   *
   * Ordering is unchanged, deliberately: the same `[...events]` copy and the
   * same descending-timestamp comparator `buildDevHqState` applies, so entries
   * sharing a timestamp keep the same relative order (`Array.prototype.sort` is
   * stable) and the served feed is byte-for-byte what it was.
   */
  async listRecent(query?: {
    entityType?: EventEntityType;
    entityId?: string;
    limit?: number;
  }): Promise<Event[]> {
    let events = [...getDevHqStore().events].sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp),
    );
    if (query?.entityType) {
      events = events.filter((e) => e.entityType === query.entityType);
    }
    if (query?.entityId) {
      events = events.filter((e) => e.entityId === query.entityId);
    }
    return events.slice(0, query?.limit ?? 50);
  }
}

export function createDevEventLogger(): DevEventLogger {
  return new DevEventLogger();
}
