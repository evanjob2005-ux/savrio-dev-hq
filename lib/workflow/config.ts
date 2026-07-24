// Centralized workflow configuration: the single source of truth for stage
// order, labels, assigned agents, progress values, mock durations, and
// descriptions. Transition logic (machine.ts) and UI both read from here.

import type {
  ActivityKind,
  AgentId,
  Priority,
  StageId,
  StageKind,
  ValidationStatus,
} from "@/types/workflow";
import { STAGE_IDS } from "@/types/workflow";

export interface StageMeta {
  id: StageId;
  label: string;
  shortLabel: string;
  agent: AgentId;
  kind: StageKind;
  /** Whether the engine auto-advances out of this stage after a delay. */
  auto: boolean;
  /** 0–100 progress once the task has entered this stage. */
  progress: number;
  /** Simulated dwell time before auto-advancing (ms). Ignored when !auto. */
  durationMs: number;
  description: string;
  /** Short verb shown in the agent-status rail while this stage is active. */
  agentAction: string;
  /** Narration added when the task enters this stage. */
  enterMessage?: string;
  /** Narration added when the task leaves this stage. */
  doneMessage?: string;
  activityKind: ActivityKind;
}

export const STAGES: Record<StageId, StageMeta> = {
  PLANNING: {
    id: "PLANNING",
    label: "Planning",
    shortLabel: "Plan",
    agent: "ChatGPT",
    kind: "plan",
    auto: false,
    progress: 5,
    durationMs: 0,
    description:
      "ChatGPT converts Evan's goal into an execution plan, scope, and acceptance criteria.",
    agentAction: "Planning",
    activityKind: "system",
  },
  READY: {
    id: "READY",
    label: "Ready",
    shortLabel: "Ready",
    agent: "ChatGPT",
    kind: "plan",
    auto: false,
    progress: 10,
    durationMs: 0,
    description: "Task is scoped and queued, ready for an engineer to start.",
    agentAction: "Queued",
    activityKind: "system",
  },
  CLAUDE_BUILD: {
    id: "CLAUDE_BUILD",
    label: "Claude Build",
    shortLabel: "Build",
    agent: "Claude",
    kind: "build",
    auto: true,
    progress: 25,
    durationMs: 2400,
    description: "Claude performs the primary implementation.",
    agentAction: "Building",
    enterMessage: "Claude began implementation.",
    doneMessage: "Claude completed implementation.",
    activityKind: "build",
  },
  SUPERVISOR_SCOPE_CHECK: {
    id: "SUPERVISOR_SCOPE_CHECK",
    label: "Supervisor · Scope Check",
    shortLabel: "Scope Gate",
    agent: "Supervisor",
    kind: "gate",
    auto: true,
    progress: 40,
    durationMs: 1500,
    description:
      "Supervisor verifies the correct task is being built, the right agent did it, and the work stays in scope. No code is written.",
    agentAction: "Checking scope",
    enterMessage: "Supervisor began scope verification.",
    doneMessage: "Supervisor confirmed scope.",
    activityKind: "gate",
  },
  CODEX_REVIEW: {
    id: "CODEX_REVIEW",
    label: "Codex Review",
    shortLabel: "Review",
    agent: "Codex",
    kind: "build",
    auto: true,
    progress: 55,
    durationMs: 2200,
    description:
      "Codex performs a focused review and isolated corrections without redesigning the feature.",
    agentAction: "Reviewing",
    enterMessage: "Codex began focused review.",
    doneMessage: "Codex completed corrections.",
    activityKind: "build",
  },
  SUPERVISOR_VALIDATION_CHECK: {
    id: "SUPERVISOR_VALIDATION_CHECK",
    label: "Supervisor · Validation Check",
    shortLabel: "Validation Gate",
    agent: "Supervisor",
    kind: "gate",
    auto: true,
    progress: 66,
    durationMs: 1500,
    description:
      "Supervisor confirms validation is reported and passing before the task moves on. No code is written.",
    agentAction: "Verifying validation",
    enterMessage: "Supervisor began validation verification.",
    doneMessage: "Supervisor confirmed validation.",
    activityKind: "gate",
  },
  CLAUDE_FINAL_REVIEW: {
    id: "CLAUDE_FINAL_REVIEW",
    label: "Claude Final Review",
    shortLabel: "Final Eng. Review",
    agent: "Claude",
    kind: "build",
    auto: true,
    progress: 78,
    durationMs: 2000,
    description: "Claude performs the final engineering review after Codex.",
    agentAction: "Final review",
    enterMessage: "Claude began final engineering review.",
    doneMessage: "Claude completed final engineering review.",
    activityKind: "build",
  },
  GEMINI_QA: {
    id: "GEMINI_QA",
    label: "Gemini QA",
    shortLabel: "QA",
    agent: "Gemini",
    kind: "build",
    auto: true,
    progress: 88,
    durationMs: 2000,
    description:
      "Gemini runs browser, responsive, visual, and basic accessibility QA and reports user-facing issues.",
    agentAction: "Testing",
    enterMessage: "Gemini began QA.",
    doneMessage: "Gemini completed QA.",
    activityKind: "qa",
  },
  SUPERVISOR_FINAL_REVIEW: {
    id: "SUPERVISOR_FINAL_REVIEW",
    label: "Supervisor · Final Review",
    shortLabel: "Final Gate",
    agent: "Supervisor",
    kind: "gate",
    auto: true,
    progress: 95,
    durationMs: 1500,
    description:
      "Supervisor confirms every stage ran, handoff information is complete, and marks the task ready for Evan. No code is written.",
    agentAction: "Final gate",
    enterMessage: "Supervisor began final review.",
    doneMessage: "Supervisor marked task ready for Evan.",
    activityKind: "gate",
  },
  WAITING_FOR_EVAN: {
    id: "WAITING_FOR_EVAN",
    label: "Waiting for Evan",
    shortLabel: "Approval",
    agent: "Evan",
    kind: "approval",
    auto: false,
    progress: 97,
    durationMs: 0,
    description: "Awaiting Evan's approval. The simulation pauses here.",
    agentAction: "Approval required",
    enterMessage: "Supervisor requested Evan's approval.",
    activityKind: "approval",
  },
  APPROVED: {
    id: "APPROVED",
    label: "Approved",
    shortLabel: "Approved",
    agent: "Evan",
    kind: "approval",
    auto: true,
    progress: 99,
    durationMs: 1100,
    description: "Evan approved the task; finalizing.",
    agentAction: "Approved",
    enterMessage: "Evan approved task.",
    doneMessage: "Finalizing approved task.",
    activityKind: "approval",
  },
  COMPLETE: {
    id: "COMPLETE",
    label: "Complete",
    shortLabel: "Complete",
    agent: "Evan",
    kind: "terminal",
    auto: false,
    progress: 100,
    durationMs: 0,
    description: "Task complete.",
    agentAction: "Done",
    enterMessage: "Task complete.",
    activityKind: "system",
  },
};

/** Ordered stage metadata for rendering the timeline. */
export const STAGE_SEQUENCE: StageMeta[] = STAGE_IDS.map((id) => STAGES[id]);

/**
 * Validation status overrides applied when a task ENTERS a given stage.
 * Keyed by validation check id. Stages not listed leave validation untouched.
 * By WAITING_FOR_EVAN all standard checks have reached "passed".
 */
export const VALIDATION_ON_ENTER: Partial<
  Record<StageId, Record<string, ValidationStatus>>
> = {
  CLAUDE_BUILD: { lint: "pending", build: "pending", tests: "pending" },
  CODEX_REVIEW: { lint: "running" },
  SUPERVISOR_VALIDATION_CHECK: { lint: "passed", build: "running" },
  CLAUDE_FINAL_REVIEW: { build: "passed" },
  GEMINI_QA: { tests: "running" },
  SUPERVISOR_FINAL_REVIEW: { tests: "passed" },
};

export interface AgentMeta {
  id: AgentId;
  name: string;
  role: string;
  summary: string;
  /** Accent color used for the agent's dot/avatar. */
  accent: string;
  initials: string;
}

export const AGENTS: Record<AgentId, AgentMeta> = {
  Evan: {
    id: "Evan",
    name: "Evan",
    role: "Product Owner · Final Authority",
    summary: "Defines goals, approves plans and major decisions, gives final approval.",
    accent: "#f2b84b",
    initials: "EV",
  },
  ChatGPT: {
    id: "ChatGPT",
    name: "ChatGPT",
    role: "Technical Program Manager",
    summary: "Converts the goal into an execution plan, scope, and acceptance criteria.",
    accent: "#34c7a6",
    initials: "GP",
  },
  Supervisor: {
    id: "Supervisor",
    name: "Supervisor",
    role: "Process Auditor",
    summary: "Verifies scope, handoffs, validation, and readiness. Never writes production code.",
    accent: "#a78bfa",
    initials: "SV",
  },
  Claude: {
    id: "Claude",
    name: "Claude",
    role: "Principal Software Engineer",
    summary: "Primary build and the final engineering review after Codex.",
    accent: "#e8956b",
    initials: "CL",
  },
  Codex: {
    id: "Codex",
    name: "Codex",
    role: "Implementation Specialist",
    summary: "Reviews Claude's work and makes focused, isolated corrections.",
    accent: "#5cc8ff",
    initials: "CX",
  },
  Gemini: {
    id: "Gemini",
    name: "Gemini",
    role: "QA Engineer",
    summary: "Browser, responsive, visual, and accessibility QA.",
    accent: "#8b7bf7",
    initials: "GM",
  },
  Copilot: {
    id: "Copilot",
    name: "GitHub Copilot",
    role: "IDE Assistant",
    summary: "Autocomplete, boilerplate, and small local assistance.",
    accent: "#9aa4b2",
    initials: "CP",
  },
};

/** Display order for the agent-status rail. */
export const AGENT_ORDER: AgentId[] = [
  "Evan",
  "Supervisor",
  "Claude",
  "Codex",
  "Gemini",
  "ChatGPT",
  "Copilot",
];

export const PRIORITY_ACCENT: Record<Priority, string> = {
  Critical: "#f87171",
  High: "#fbbf24",
  Medium: "#5cc8ff",
  Low: "#9aa4b2",
};
