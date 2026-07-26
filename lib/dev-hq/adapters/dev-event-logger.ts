import type { EventLogger, LogEventInput } from "@/types/contracts";
import type { Event, EventEntityType } from "@/types/domain";
import { appendEvent, buildDevHqState } from "@/lib/dev-hq/store";
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

  async listRecent(query?: {
    entityType?: EventEntityType;
    entityId?: string;
    limit?: number;
  }): Promise<Event[]> {
    let events = buildDevHqState().events;
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
