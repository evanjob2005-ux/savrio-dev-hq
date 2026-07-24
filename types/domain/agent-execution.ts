import type { AgentAvailability, EntityId, IsoTimestamp } from "./common";

/** Repository and filesystem context for an agent execution request. */
export interface RepositoryContext {
  repository: string;
  branch?: string;
  workingDirectory?: string;
}

/** Vendor-neutral input for dispatching work to an agent provider. */
export interface AgentRequest {
  agentId: EntityId;
  taskId: EntityId;
  projectId: EntityId;
  instructions: string;
  context: RepositoryContext;
  allowedCapabilities: string[];
  metadata?: Record<string, unknown>;
}

export type AgentExecutionStatus =
  | "succeeded"
  | "failed"
  | "partial"
  | "cancelled"
  | "timeout";

export interface AgentCommandRun {
  command: string;
  exitCode: number | null;
  startedAt: IsoTimestamp;
  completedAt: IsoTimestamp | null;
}

export type AgentFileChangeKind = "created" | "modified" | "deleted" | "renamed";

export interface AgentFileChange {
  path: string;
  changeKind: AgentFileChangeKind;
  previousPath?: string;
}

/** Opaque usage metrics — extensible without binding to a vendor SDK shape. */
export interface AgentUsageMetadata {
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  model?: string;
  extra?: Record<string, unknown>;
}

export interface AgentExecutionError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/** Vendor-neutral output from an agent execution. */
export interface AgentResult {
  agentId: EntityId;
  taskId: EntityId;
  status: AgentExecutionStatus;
  summary: string | null;
  output: string | null;
  filesChanged: AgentFileChange[];
  commandsRun: AgentCommandRun[];
  evidenceIds: EntityId[];
  errors: AgentExecutionError[];
  usage: AgentUsageMetadata | null;
  startedAt: IsoTimestamp;
  completedAt: IsoTimestamp | null;
}

export interface AgentHealthCheckResult {
  agentId: EntityId;
  healthy: boolean;
  availability: AgentAvailability;
  message: string | null;
  checkedAt: IsoTimestamp;
}
