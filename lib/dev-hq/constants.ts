/** Dev HQ founder-request workflow identifier. */
export const FOUNDER_REQUEST_WORKFLOW_ID = "wf-founder-request";

export const EXECUTIVE_ORCHESTRATOR_AGENT_ID = "agent-executive-orchestrator";
export const FOUNDER_USER_ID = "user-evan";

export const DEV_HQ_ACTORS = {
  founderUserId: FOUNDER_USER_ID,
  executiveAgentId: EXECUTIVE_ORCHESTRATOR_AGENT_ID,
} as const;

/**
 * Canonical Phase 1 agent capability vocabulary (ADR-0001 O3), frozen from the
 * existing roster so the UI and the selection engine share one set. A fuller
 * department-mapped taxonomy is deferred to Phase 2.
 */
export const AGENT_CAPABILITIES = [
  "routing",
  "sequencing",
  "escalation",
  "implementation",
  "review",
  "corrections",
  "qa",
  "accessibility",
  "gates",
  "validation",
] as const;

export type AgentCapability = (typeof AGENT_CAPABILITIES)[number];

/**
 * Work-Management retry budget: attempts per execution before it is exhausted and
 * marked failed (ADR-0001 O2). Escalation side effects (approval, needs_revision)
 * are formalized in Sprint 1E.
 */
export const MAX_EXECUTION_ATTEMPTS = 3;

/**
 * Lease duration granted when an execution is claimed and extended on each
 * heartbeat (ADR-0001 O5). An execution whose lease has expired is reclaimable.
 */
export const EXECUTION_LEASE_TTL_MS = 60_000;

/** Base URL for Trigger.dev worker callbacks into the Next.js dev store. */
export function getDevHqBaseUrl(): string {
  return process.env.DEV_HQ_BASE_URL ?? "http://127.0.0.1:3000";
}

export { DEV_HQ_INTERNAL_TOKEN_HEADER } from "@/lib/dev-hq/internal-guard";
