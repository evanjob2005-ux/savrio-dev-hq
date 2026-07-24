/** Shared primitives for Sprint 1A domain models. */

export type EntityId = string;

export type IsoTimestamp = string;

export type Priority = "Critical" | "High" | "Medium" | "Low";

export type LifecycleStatus =
  | "draft"
  | "active"
  | "paused"
  | "blocked"
  | "completed"
  | "archived";

export type ConnectionStatus = "connected" | "degraded" | "disconnected" | "pending";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "escalated";

export type ExecutionStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

export type AgentAvailability = "available" | "busy" | "offline" | "waiting";

export type DependencyKind = "blocks" | "relates";
