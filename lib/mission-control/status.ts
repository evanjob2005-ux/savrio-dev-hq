// Presentation-only status vocabulary for Mission Control.
//
// Every domain status is mapped to a human-readable label alongside its color so
// status is never communicated by color alone. This module holds no business
// logic and never mutates state.

import { COLORS } from "@/lib/theme";
import type {
  AgentAvailability,
  ApprovalStatus,
  ConnectionStatus,
  ExecutionStatus,
  FounderRequestWorkflowStage,
  LifecycleStatus,
} from "@/types/domain";

export interface StatusToken {
  label: string;
  color: string;
}

/**
 * Where a value on screen comes from. Rendered next to every panel so the
 * founder can tell operational truth from scaffolding at a glance.
 */
export type DataSource = "live" | "derived" | "preview" | "unavailable";

export const LIFECYCLE_STATUS: Record<LifecycleStatus, StatusToken> = {
  draft: { label: "Draft", color: COLORS.idle },
  active: { label: "In progress", color: COLORS.run },
  paused: { label: "Paused", color: COLORS.warn },
  blocked: { label: "Blocked", color: COLORS.err },
  needs_revision: { label: "Needs revision", color: COLORS.warn },
  rejected: { label: "Rejected", color: COLORS.err },
  completed: { label: "Completed", color: COLORS.ok },
  archived: { label: "Archived", color: COLORS.idle },
};

export const EXECUTION_STATUS: Record<ExecutionStatus, StatusToken> = {
  queued: { label: "Queued", color: COLORS.idle },
  running: { label: "Running", color: COLORS.run },
  succeeded: { label: "Succeeded", color: COLORS.ok },
  failed: { label: "Failed", color: COLORS.err },
  cancelled: { label: "Cancelled", color: COLORS.idle },
};

export const APPROVAL_STATUS: Record<ApprovalStatus, StatusToken> = {
  pending: { label: "Awaiting founder", color: COLORS.wait },
  approved: { label: "Approved", color: COLORS.ok },
  rejected: { label: "Rejected", color: COLORS.err },
  escalated: { label: "Escalated", color: COLORS.warn },
};

export const WORKFLOW_STAGE: Record<FounderRequestWorkflowStage, StatusToken> = {
  founder_request_received: { label: "Request received", color: COLORS.run },
  executive_review: { label: "Executive review", color: COLORS.run },
  founder_approval_required: { label: "Awaiting founder approval", color: COLORS.wait },
  validation_rejected: { label: "Validation rejected", color: COLORS.warn },
  approved: { label: "Approved", color: COLORS.ok },
  rejected: { label: "Founder rejected", color: COLORS.err },
  completed: { label: "Completed", color: COLORS.ok },
  failed: { label: "Technical failure", color: COLORS.err },
};

export const AVAILABILITY_STATUS: Record<AgentAvailability, StatusToken> = {
  available: { label: "Available", color: COLORS.ok },
  busy: { label: "Busy", color: COLORS.run },
  offline: { label: "Offline", color: COLORS.idle },
  waiting: { label: "Waiting", color: COLORS.wait },
};

export const CONNECTION_STATUS: Record<ConnectionStatus, StatusToken> = {
  connected: { label: "Connected", color: COLORS.ok },
  degraded: { label: "Degraded", color: COLORS.warn },
  disconnected: { label: "Disconnected", color: COLORS.err },
  pending: { label: "Not configured", color: COLORS.idle },
};

/**
 * Display names for actor ids that appear in real store records. Mirrors the
 * backend id constants for labelling only — importing `lib/dev-hq/constants`
 * here would pull `next/server` into the client bundle.
 */
const ACTOR_NAMES: Record<string, string> = {
  "agent-executive-orchestrator": "Executive Orchestrator",
  "user-evan": "Evan · Founder",
};

/** Humanizes an actor id, falling back to the raw id so nothing is hidden. */
export function actorName(id: string | null | undefined): string {
  if (!id) return "System";
  return ACTOR_NAMES[id] ?? id;
}

const ACTOR_ACCENTS: Record<string, string> = {
  Evan: COLORS.wait,
  "Evan · Founder": COLORS.wait,
  System: COLORS.textDim,
  "Executive Orchestrator": "#34c7a6",
  Supervisor: "#a78bfa",
  Claude: "#e8956b",
  Codex: "#5cc8ff",
  Gemini: "#8b7bf7",
};

/** Stable accent color for an actor label, used for avatars and name text. */
export function actorAccent(label: string): string {
  return ACTOR_ACCENTS[label] ?? COLORS.run;
}

/** Two-letter avatar initials from a display label. */
export function initialsFor(label: string): string {
  const words = label
    .replace(/[·|]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "??";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}
