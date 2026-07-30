// Real system activity from the Dev HQ event log, newest first.
//
// The newest entry is mirrored into a polite live region by the parent so
// screen-reader users hear operational updates without the list stealing focus.

import { Panel, Avatar, Badge, ScrollRegion } from "@/components/ui/primitives";
import { DataSourceBadge } from "@/components/mission-control/DataSourceBadge";
import { EmptyState } from "@/components/mission-control/primitives";
import { COLORS } from "@/lib/theme";
import { clockFromIso, shortStampFromIso } from "@/lib/format";
import { actorAccent, initialsFor } from "@/lib/mission-control/status";
import type { Event, EventEntityType } from "@/types/domain";

const ENTITY_COLOR: Record<EventEntityType, string> = {
  project: COLORS.accent,
  task: COLORS.run,
  workflow: COLORS.run,
  execution: "#8b7bf7",
  approval: COLORS.wait,
  agent: "#34c7a6",
  service: COLORS.ok,
};

export function ActivityStreamPanel({ events }: { events: Event[] }) {
  return (
    <Panel
      title="System Activity"
      subtitle={`${events.length} recorded event${events.length === 1 ? "" : "s"} · newest first`}
      right={<DataSourceBadge source="live" />}
      bodyClassName="p-0"
    >
      {events.length === 0 ? (
        <EmptyState
          title="No activity recorded"
          detail="Every workflow transition, review finding, and approval decision is appended to the event log and appears here."
        />
      ) : (
        <ScrollRegion
          label={`System activity, ${events.length} event${
            events.length === 1 ? "" : "s"
          }, newest first`}
          className="max-h-[420px] overflow-y-auto"
        >
          <ol className="divide-y divide-[var(--border)]" role="list">
            {events.map((event, index) => {
              const accent = actorAccent(event.actorLabel);
              return (
                <li
                  key={event.id}
                  className="flex gap-3 px-4 py-2.5"
                  style={index === 0 ? { background: `${accent}0d` } : undefined}
                >
                  <Avatar
                    initials={initialsFor(event.actorLabel)}
                    accent={accent}
                    size={24}
                    active={index === 0}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[11.5px] font-medium" style={{ color: accent }}>
                        {event.actorLabel}
                      </span>
                      <time
                        className="shrink-0 font-mono text-[10px] text-[var(--text-faint)]"
                        dateTime={event.timestamp}
                        title={`${shortStampFromIso(event.timestamp)} UTC`}
                      >
                        {clockFromIso(event.timestamp)}
                      </time>
                    </div>
                    <p className="mt-0.5 text-[12px] leading-snug text-[var(--text-dim)]">
                      {event.message}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge color={ENTITY_COLOR[event.entityType]}>{event.entityType}</Badge>
                      <span className="truncate font-mono text-[10px] text-[var(--text-faint)]">
                        {event.type} · {event.entityId}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </ScrollRegion>
      )}
    </Panel>
  );
}
