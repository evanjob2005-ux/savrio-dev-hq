// Pure, side-effect-free workflow logic: stage ordering, timeline visual
// state, agent-status derivation, validation progression, and the single
// stage-transition function. The React hook (useWorkflowEngine) owns timers
// and dispatch; everything here is deterministic given its inputs.

import type {
  ActivityActor,
  ActivityEntry,
  ActivityKind,
  AgentId,
  StageId,
  StageVisualState,
  Task,
  ValidationCheck,
} from "@/types/workflow";
import { STAGE_IDS } from "@/types/workflow";
import { STAGES, VALIDATION_ON_ENTER } from "./config";

export function stageIndex(stage: StageId): number {
  return STAGE_IDS.indexOf(stage);
}

/** The next stage in the canonical pipeline, or null at the terminal stage. */
export function nextStage(stage: StageId): StageId | null {
  const idx = stageIndex(stage);
  if (idx < 0 || idx >= STAGE_IDS.length - 1) return null;
  return STAGE_IDS[idx + 1];
}

/** How a given stage should render for a given task's current position. */
export function visualStateFor(stage: StageId, task: Task): StageVisualState {
  const current = stageIndex(task.currentStage);
  const target = stageIndex(stage);

  if (task.currentStage === "COMPLETE") return "complete";
  if (target < current) return "complete";
  if (target > current) return "pending";

  // target === current
  if (task.currentStage === "WAITING_FOR_EVAN") return "waiting_for_approval";
  if (task.blockers.length > 0) return "blocked";
  return "active";
}

export interface AgentRuntimeStatus {
  label: string;
  active: boolean;
  /** Semantic tone for styling. */
  tone: "active" | "waiting" | "done" | "idle";
}

/**
 * Derive each agent's status line from the task the user is looking at.
 * Only the current stage's agent is ever "active"; Evan is highlighted while
 * approval is pending. `live` is true when that task is auto-simulating now.
 */
export function deriveAgentStatuses(
  task: Task,
  live: boolean,
): Record<AgentId, AgentRuntimeStatus> {
  const meta = STAGES[task.currentStage];
  const result = {} as Record<AgentId, AgentRuntimeStatus>;

  const idle: AgentRuntimeStatus = { label: "Available", active: false, tone: "idle" };
  (
    ["Evan", "ChatGPT", "Supervisor", "Claude", "Codex", "Gemini", "Copilot"] as AgentId[]
  ).forEach((id) => {
    result[id] = { ...idle };
  });

  if (task.currentStage === "COMPLETE") {
    result.Evan = { label: "Approved", active: false, tone: "done" };
    return result;
  }

  if (task.currentStage === "WAITING_FOR_EVAN") {
    result.Evan = { label: "Approval required", active: true, tone: "waiting" };
    return result;
  }

  // A normal pipeline stage: only its owning agent is engaged.
  result[meta.agent] = {
    label: meta.agentAction,
    active: live,
    tone: live ? "active" : "idle",
  };
  return result;
}

/** Apply this stage's validation overrides to a task's checks. */
export function applyValidationsForStage(
  stage: StageId,
  checks: ValidationCheck[],
): ValidationCheck[] {
  const overrides = VALIDATION_ON_ENTER[stage];
  if (!overrides) return checks;
  return checks.map((c) =>
    overrides[c.id] ? { ...c, status: overrides[c.id] } : c,
  );
}

export function makeActivity(
  id: string,
  timestamp: string,
  actor: ActivityActor,
  message: string,
  kind: ActivityKind,
): ActivityEntry {
  return { id, timestamp, actor, message, kind };
}

export interface TransitionOptions {
  timestamp: string;
  /** Allocates a unique id for each activity entry created. */
  mkId: () => string;
  /** Emit the leaving stage's doneMessage before the entering message. */
  addDone: boolean;
  /** Replace the entering stage's default enterMessage. */
  enterMessageOverride?: string;
}

/**
 * Move a task into `toStage`, updating status, agent, progress, validation,
 * activity feed (newest-first), stage history, and lifecycle timestamps.
 * Pure: returns a new Task; never mutates the input.
 */
export function transition(
  task: Task,
  toStage: StageId,
  opts: TransitionOptions,
): Task {
  const fromMeta = STAGES[task.currentStage];
  const toMeta = STAGES[toStage];
  const { timestamp, mkId } = opts;

  const activity = [...task.activity];
  if (opts.addDone && fromMeta.doneMessage) {
    activity.unshift(
      makeActivity(mkId(), timestamp, fromMeta.agent, fromMeta.doneMessage, fromMeta.activityKind),
    );
  }
  const enterMessage = opts.enterMessageOverride ?? toMeta.enterMessage;
  if (enterMessage) {
    activity.unshift(
      makeActivity(mkId(), timestamp, toMeta.agent, enterMessage, toMeta.activityKind),
    );
  }

  const stageHistory = [
    ...task.stageHistory.map((h) => ({ ...h, status: "complete" as const })),
    { stage: toStage, agent: toMeta.agent, enteredAt: timestamp, status: "active" as const },
  ];

  const clearsBlockers = toStage === "WAITING_FOR_EVAN" || toStage === "COMPLETE";

  return {
    ...task,
    status: toStage,
    currentStage: toStage,
    currentAgent: toMeta.agent,
    progress: toMeta.progress,
    startedAt: task.startedAt ?? (toStage === "CLAUDE_BUILD" ? timestamp : null),
    completedAt: toStage === "COMPLETE" ? timestamp : task.completedAt,
    activity,
    requiredValidation: applyValidationsForStage(toStage, task.requiredValidation),
    stageHistory,
    blockers: clearsBlockers ? [] : task.blockers,
  };
}
