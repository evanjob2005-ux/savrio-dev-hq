import type { Event, EventEntityType } from "@/types/domain";

export interface LogEventInput {
  type: string;
  entityType: EventEntityType;
  entityId: string;
  message: string;
  actorId?: string | null;
  actorLabel: string;
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
