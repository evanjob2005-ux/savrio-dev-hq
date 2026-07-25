import { Badge, StatusDot } from "@/components/ui/primitives";
import { COLORS } from "@/lib/theme";

export function TopBar({
  runningId,
  paused,
  runningTitle,
}: {
  runningId: string | null;
  paused: boolean;
  runningTitle: string | null;
}) {
  let stateLabel = "Idle";
  let stateColor: string = COLORS.idle;
  let pulse = false;
  if (runningId && paused) {
    stateLabel = "Paused";
    stateColor = COLORS.warn;
  } else if (runningId) {
    stateLabel = "Simulating";
    stateColor = COLORS.run;
    pulse = true;
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface-1)]/60 px-5 py-3.5 backdrop-blur">
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[15px] font-bold text-[var(--bg)]"
          style={{ background: "var(--accent)" }}
          aria-hidden
        >
          S
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-2">
            <h1 className="text-[15px] font-semibold tracking-tight text-[var(--text)]">
              Savrio Dev HQ
            </h1>
            <span className="text-[13px] font-medium text-[var(--text-faint)]">
              Mission Control
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-faint)]">
            Autonomous engineering pipeline
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge color={COLORS.accent}>LIVE STATE · DEV MODE</Badge>
        {/* Scoped to the mock engine so this indicator is not read as live
            operational status now that the badge above says LIVE STATE. */}
        <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5">
          <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)]">
            Simulation
          </span>
          <StatusDot color={stateColor} pulse={pulse} />
          <span className="text-[12px] font-medium text-[var(--text-dim)]">
            {stateLabel}
            {runningId && runningTitle ? (
              <span className="text-[var(--text-faint)]"> · {runningId}</span>
            ) : null}
          </span>
        </div>
      </div>
    </header>
  );
}
