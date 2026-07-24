import type { ConnectionStatus, EntityId, IsoTimestamp } from "./common";

export type ConnectedServiceKind =
  | "source_control"
  | "orchestration"
  | "database"
  | "monitoring"
  | "ai_provider";

export interface ConnectedService {
  id: EntityId;
  name: string;
  kind: ConnectedServiceKind;
  status: ConnectionStatus;
  endpoint: string | null;
  lastSyncAt: IsoTimestamp | null;
}
