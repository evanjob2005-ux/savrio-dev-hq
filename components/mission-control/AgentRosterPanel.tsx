// Who is actually acting in the system, and who is on the roster.
//
// The top section is derived from real records: any id that appears as a project
// owner, task assignee, execution runner, approval requester, decision maker, or
// event actor. The bottom section is the live Agent Registry from Dev HQ state;
// availability reflects claims and releases by the Execution Manager.

import { Panel, Avatar, StatusDot } from "@/components/ui/primitives";
import { DataSourceBadge } from "@/components/mission-control/DataSourceBadge";
import { EmptyState } from "@/components/mission-control/primitives";
import { shortStampFromIso } from "@/lib/format";
import { AVAILABILITY_STATUS, actorAccent, initialsFor } from "@/lib/mission-control/status";
import type { Participant } from "@/lib/mission-control/view-model";
import type { Agent } from "@/types/domain";

export function AgentRosterPanel({
  participants,
  roster,
}: {
  participants: Participant[];
  roster: Agent[];
}) {
  return (
    <Panel
      title="Agents & Participants"
      subtitle={`${participants.length} recorded in state · ${roster.length} in registry`}
      right={<DataSourceBadge source="derived" />}
    >
      <div className="flex flex-col gap-3">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--text-faint)]">
              Recorded in state
            </h3>
            <DataSourceBadge source="derived" />
          </div>
          {participants.length === 0 ? (
            <EmptyState
              title="No participants recorded"
              detail="Actors appear here once they own a project, claim a task, request an approval, decide one, or log an event."
            />
          ) : (
            <ul className="mt-1.5 flex flex-col gap-1.5" role="list">
              {participants.map((participant) => {
                const accent = actorAccent(participant.label);
                return (
                  <li
                    key={participant.id}
                    className="flex items-start gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2"
                  >
                    <Avatar
                      initials={initialsFor(participant.label)}
                      accent={accent}
                      size={26}
                      active={participant.eventCount > 0}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className="truncate text-[12px] font-medium"
                          style={{ color: accent }}
                        >
                          {participant.label}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-[var(--text-faint)]">
                          {participant.eventCount} event
                          {participant.eventCount === 1 ? "" : "s"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10.5px] leading-snug text-[var(--text-dim)]">
                        {participant.roles.join(" · ")}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-[var(--text-faint)]">
                        {participant.id}
                        {participant.lastActiveAt
                          ? ` · last active ${shortStampFromIso(participant.lastActiveAt)} UTC`
                          : ""}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-[var(--border)] pt-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--text-faint)]">
              Agent registry
            </h3>
            <DataSourceBadge source="live" />
          </div>
          <ul className="mt-1.5 flex flex-col gap-1" role="list">
            {roster.map((agent) => {
              const token = AVAILABILITY_STATUS[agent.availability];
              return (
                <li key={agent.id} className="flex items-center gap-2.5 px-1 py-1">
                  <Avatar initials={agent.initials} accent={agent.accentColor} size={22} />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-[11.5px] font-medium text-[var(--text)]">
                      {agent.name}
                    </span>
                    <span className="block truncate text-[10px] text-[var(--text-faint)]">
                      {agent.role}
                    </span>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-[10.5px] text-[var(--text-dim)]">
                    <StatusDot color={token.color} size={5} />
                    {token.label}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 px-1 text-[10.5px] leading-relaxed text-[var(--text-faint)]">
            Live from the Agent Registry via Dev HQ state. Availability reflects claims and
            releases by the Execution Manager (one execution per agent in this phase).
          </p>
        </div>
      </div>
    </Panel>
  );
}
