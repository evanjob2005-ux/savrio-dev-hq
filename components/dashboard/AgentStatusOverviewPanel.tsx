import type { Agent } from "@/types/domain";
import { Panel, Avatar, StatusDot } from "@/components/ui/primitives";
import { COLORS } from "@/lib/theme";

const AVAILABILITY_COLOR: Record<Agent["availability"], string> = {
  available: COLORS.ok,
  busy: COLORS.run,
  offline: COLORS.idle,
  waiting: COLORS.wait,
};

export function AgentStatusOverviewPanel({ agents }: { agents: Agent[] }) {
  return (
    <Panel
      title="Agent Status"
      subtitle="Domain roster · placeholder"
      bodyClassName="p-0"
    >
      <ul className="divide-y divide-[var(--border)]" role="list">
        {agents.map((agent) => {
          const tone = AVAILABILITY_COLOR[agent.availability];
          const isActive = agent.availability === "busy" || agent.availability === "waiting";
          return (
            <li key={agent.id} className="flex items-center gap-3 px-4 py-2.5">
              <Avatar
                initials={agent.initials}
                accent={agent.accentColor}
                active={isActive}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[12.5px] font-medium text-[var(--text)]">
                    {agent.name}
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] capitalize text-[var(--text-dim)]">
                    <StatusDot color={tone} pulse={isActive} size={6} />
                    {agent.availability}
                  </span>
                </div>
                <p className="truncate text-[11px] text-[var(--text-faint)]">{agent.role}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
