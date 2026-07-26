import type { Event, EventEntityType } from "@/types/domain";

export interface LogEventInput {
  type: string;
  entityType: EventEntityType;
  entityId: string;
  message: string;
  actorId?: string | null;
  actorLabel: string;
  /**
   * Optional idempotency key for events that describe a transition which happens
   * once. The logger records at most one event per key, so a first pass and a
   * later reconciliation converge on a single entry without either of them
   * inspecting the timeline. Events stay descriptive; this only prevents
   * duplicates.
   */
  dedupeKey?: string;
}

export interface EventQuery {
  entityType?: EventEntityType;
  entityId?: string;
  limit?: number;
}

export interface EventLogger {
  log(input: LogEventInput): Promise<Event>;
  listRecent(query?: EventQuery): Promise<Event[]>;
}
