import type { EntityId, IsoTimestamp } from "./common";

/**
 * Lifecycle sub-state of an agent's ownership of an execution. Distinct from the
 * generic `Execution.status`: the assignment tracks who holds the work and the
 * health of that hold (lease, heartbeat), while the execution tracks the unit of
 * work itself. See ADR-0001 (D3).
 */
export type AgentAssignmentStatus =
  | "assigned" // agent chosen; not yet claimed
  | "claimed" // agent has taken ownership; lease active
  | "running" // work in progress; heartbeating
  | "released"; // terminal; agent freed

/**
 * The lease and ownership record joining an agent to an execution. Behavior
 * (selection, claim/release, heartbeat, timeout) is implemented in later Sprint 1D
 * tasks; this type only defines the persisted shape.
 */
export interface AgentAssignment {
  id: EntityId;
  executionId: EntityId;
  agentId: EntityId;
  taskId: EntityId;
  status: AgentAssignmentStatus;
  /** Work-Management retry attempt this assignment belongs to (1-based). See D1. */
  attempt: number;
  /**
   * Capabilities the task required when this assignment was created. Carried so a
   * retry can re-select an eligible agent without the original policy in hand.
   */
  requiredCapabilities: string[];
  /** When the current lease expires; null before claim. */
  leaseExpiresAt: IsoTimestamp | null;
  /** Last heartbeat received from the running agent; null before first beat. */
  lastHeartbeatAt: IsoTimestamp | null;
  claimedAt: IsoTimestamp | null;
  releasedAt: IsoTimestamp | null;
  createdAt: IsoTimestamp;
}
