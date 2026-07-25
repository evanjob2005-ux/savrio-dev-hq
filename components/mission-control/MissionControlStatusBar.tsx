// Operating-mode banner for the command center: what the data is, how fresh it
// is, and what currently needs the founder.

import { StatusPill } from "@/components/mission-control/primitives";
import { COLORS } from "@/lib/theme";
import { clockFromIso } from "@/lib/format";
import type { StatusToken } from "@/lib/mission-control/status";
import type { FeedStatus } from "@/lib/mission-control/useDevHqState";

const FEED_STATUS: Record<FeedStatus, StatusToken> = {
  initial: { label: "Connecting to state feed", color: COLORS.idle },
  live: { label: "Live", color: COLORS.ok },
  degraded: { label: "Degraded feed", color: COLORS.warn },
  disconnected: { label: "Feed disconnected", color: COLORS.err },
};

export function MissionControlStatusBar({
  feedStatus,
  updatedAt,
  error,
  pendingApprovals,
  attentionCount,
}: {
  feedStatus: FeedStatus;
  updatedAt: string | null;
  error: string | null;
  pendingApprovals: number;
  attentionCount: number;
}) {
  const stale = feedStatus === "degraded" || feedStatus === "disconnected";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--text)]">
            Mission Control
          </span>
          <span className="text-[11px] text-[var(--text-faint)]">
            Live operational data
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={FEED_STATUS[feedStatus]} pulse={feedStatus === "live"} />
          <span className="font-mono text-[10.5px] text-[var(--text-faint)]">
            {updatedAt ? `${clockFromIso(updatedAt)} UTC` : "awaiting first snapshot"}
          </span>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {pendingApprovals > 0 ? (
            <StatusPill
              status={{
                label: `${pendingApprovals} approval${pendingApprovals === 1 ? "" : "s"} awaiting you`,
                color: COLORS.wait,
              }}
              pulse
            />
          ) : null}
          {attentionCount > 0 ? (
            <StatusPill
              status={{
                label: `${attentionCount} item${attentionCount === 1 ? "" : "s"} need attention`,
                color: COLORS.warn,
              }}
            />
          ) : null}
          {pendingApprovals === 0 && attentionCount === 0 ? (
            <StatusPill status={{ label: "Nothing needs you", color: COLORS.ok }} />
          ) : null}
        </div>
      </div>

      <p
        className="rounded-lg border border-[var(--warn)]/35 bg-[var(--warn)]/10 px-3 py-2 text-[11.5px] leading-relaxed text-[var(--text-dim)]"
        role="note"
      >
        Development mode: workflow state is stored in a single-process in-memory dev adapter.
        Data is not durable and will reset when the Next.js process restarts. Not for
        production use.
      </p>

      {error ? (
        <p
          className="rounded-lg border border-[var(--err)]/40 bg-[var(--err)]/10 px-3 py-2 text-[12px] leading-relaxed text-[var(--err)]"
          role="alert"
        >
          {error}
          {stale
            ? " Showing the last successful snapshot until the feed recovers."
            : ""}
        </p>
      ) : null}
    </div>
  );
}
