import type { AgentAvailability, EntityId, IsoTimestamp } from "./common";

export interface Agent {
  id: EntityId;
  name: string;
  role: string;
  provider: string;
  availability: AgentAvailability;
  capabilities: string[];
  accentColor: string;
  initials: string;
  lastActiveAt: IsoTimestamp | null;
}
