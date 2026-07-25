import type { AgentProvider } from "@/types/contracts";
import type {
  Agent,
  AgentHealthCheckResult,
  AgentRequest,
  AgentResult,
} from "@/types/domain";
import {
  evaluateAgentHealth,
  getAgent,
  listAgents,
} from "@/lib/dev-hq/agent-registry";
import { nowIso } from "@/lib/dev-hq/id";

/**
 * Development-only AgentProvider over the in-memory Agent Registry (Task 1D-2).
 *
 * Discovery (`listAgents`, `getAgent`) and `healthCheck` are backed entirely by
 * the registry. `execute` is intentionally not implemented here: dispatching a
 * unit of work is owned by the Execution Manager (Task 1D-3) and the durable
 * `agent-execution` task (Task 1D-5).
 */
export class DevAgentProvider implements AgentProvider {
  async listAgents(): Promise<Agent[]> {
    return listAgents();
  }

  async getAgent(id: string): Promise<Agent | null> {
    return getAgent(id);
  }

  async execute(request: AgentRequest): Promise<AgentResult> {
    void request;
    throw new Error(
      "DevAgentProvider.execute is not available yet; agent dispatch is owned by " +
        "the Execution Manager (Task 1D-3) and the agent-execution task (Task 1D-5).",
    );
  }

  async healthCheck(agentId: string): Promise<AgentHealthCheckResult> {
    const checkedAt = nowIso();
    const agent = getAgent(agentId);

    if (!agent) {
      return {
        agentId,
        healthy: false,
        availability: "offline",
        health: "unavailable",
        message: "Agent not found in registry.",
        checkedAt,
      };
    }

    const health = evaluateAgentHealth(agent, checkedAt);
    const message =
      health === "healthy"
        ? null
        : health === "unavailable"
          ? "Agent is offline."
          : agent.lastActiveAt
            ? "Heartbeat is stale."
            : "No heartbeat recorded.";

    return {
      agentId,
      healthy: health === "healthy",
      availability: agent.availability,
      health,
      message,
      checkedAt,
    };
  }
}

export function createDevAgentProvider(): DevAgentProvider {
  return new DevAgentProvider();
}
