import type {
  Agent,
  AgentHealthCheckResult,
  AgentRequest,
  AgentResult,
} from "@/types/domain";

/**
 * Vendor-neutral contract for discovering and executing agents.
 * Capabilities are represented on the `Agent` model returned by `getAgent()`
 * and `listAgents()` — no separate getCapabilities() is required.
 */
export interface AgentProvider {
  listAgents(): Promise<Agent[]>;
  getAgent(id: string): Promise<Agent | null>;
  execute(request: AgentRequest): Promise<AgentResult>;
  healthCheck(agentId: string): Promise<AgentHealthCheckResult>;
}
