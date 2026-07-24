/** Dev HQ founder-request workflow identifier. */
export const FOUNDER_REQUEST_WORKFLOW_ID = "wf-founder-request";

export const EXECUTIVE_ORCHESTRATOR_AGENT_ID = "agent-executive-orchestrator";
export const FOUNDER_USER_ID = "user-evan";

/** Base URL for Trigger.dev worker callbacks into the Next.js dev store. */
export function getDevHqBaseUrl(): string {
  return process.env.DEV_HQ_BASE_URL ?? "http://127.0.0.1:3000";
}

export { DEV_HQ_INTERNAL_TOKEN_HEADER } from "@/lib/dev-hq/internal-guard";
