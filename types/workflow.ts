// Core domain types for the Savrio Dev HQ mock workflow engine.
// Phase 2: simulated agents only — no real integrations.

export const STAGE_IDS = [
  "PLANNING",
  "READY",
  "CLAUDE_BUILD",
  "SUPERVISOR_SCOPE_CHECK",
  "CODEX_REVIEW",
  "SUPERVISOR_VALIDATION_CHECK",
  "CLAUDE_FINAL_REVIEW",
  "GEMINI_QA",
  "SUPERVISOR_FINAL_REVIEW",
  "WAITING_FOR_EVAN",
  "APPROVED",
  "COMPLETE",
] as const;

export type StageId = (typeof STAGE_IDS)[number];

export const AGENT_IDS = [
  "Evan",
  "ChatGPT",
  "Supervisor",
  "Claude",
  "Codex",
  "Gemini",
  "Copilot",
] as const;

export type AgentId = (typeof AGENT_IDS)[number];

/** Author of an activity entry — an agent or the system narrator. */
export type ActivityActor = AgentId | "System";

/** How a stage renders in the workflow timeline. */
export type StageVisualState =
  | "pending"
  | "active"
  | "complete"
  | "blocked"
  | "waiting_for_approval";

/** Kind of stage, used to style gates differently from build stages. */
export type StageKind = "plan" | "build" | "gate" | "approval" | "terminal";

export type ValidationStatus = "pending" | "running" | "passed" | "failed";

export type Priority = "Critical" | "High" | "Medium" | "Low";

export type ActivityKind =
  | "system"
  | "build"
  | "gate"
  | "qa"
  | "approval"
  | "warning";

export interface ValidationCheck {
  id: string;
  /** The literal command being simulated, e.g. "npm.cmd run lint". */
  command: string;
  label: string;
  status: ValidationStatus;
  optional?: boolean;
}

export interface ActivityEntry {
  id: string;
  /** ISO 8601 timestamp. */
  timestamp: string;
  actor: ActivityActor;
  message: string;
  kind: ActivityKind;
}

export interface StageHistoryEntry {
  stage: StageId;
  agent: AgentId;
  /** ISO 8601 timestamp. */
  enteredAt: string;
  status: "active" | "complete";
  note?: string;
}

export interface Task {
  id: string;
  title: string;
  objective: string;
  repository: string;
  branch: string;
  priority: Priority;
  /** Mirrors currentStage; kept as a distinct field per the task model contract. */
  status: StageId;
  currentStage: StageId;
  currentAgent: AgentId;
  /** 0–100. */
  progress: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  acceptanceCriteria: string[];
  expectedFiles: string[];
  protectedFiles: string[];
  requiredValidation: ValidationCheck[];
  approvalsRequired: string[];
  activity: ActivityEntry[];
  stageHistory: StageHistoryEntry[];
  blockers: string[];
  knownRisks: string[];
  retryCount: number;
}
