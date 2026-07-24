import type { StageVisualState, Task } from "@/types/workflow";
import { AGENTS, STAGE_SEQUENCE } from "@/lib/workflow/config";
import { visualStateFor } from "@/lib/workflow/machine";
import { Panel, Avatar } from "@/components/ui/primitives";
import { COLORS } from "@/lib/theme";

const STATE_META: Record<
  StageVisualState,
  { label: string; color: string }
> = {
  complete: { label: "Complete", color: COLORS.ok },
  active: { label: "Active", color: COLORS.run },
  pending: { label: "Pending", color: COLORS.idle },
  blocked: { label: "Blocked", color: COLORS.err },
  waiting_for_approval: { label: "Awaiting approval", color: COLORS.wait },
};

function Marker({ state, isGate }: { state: StageVisualState; isGate: boolean }) {
  const { color } = STATE_META[state];
  const active = state === "active" || state === "waiting_for_approval";

  if (state === "complete") {
    return (
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full"
        style={{ background: `${color}22`, border: `1px solid ${color}66` }}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M3.5 8.5l3 3 6-6.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  // Gates use a diamond to read as a verification checkpoint, not a build step.
  return (
    <span
      className={`flex h-6 w-6 items-center justify-center ${active ? "savrio-pulse" : ""}`}
      aria-hidden
    >
      <span
        className={isGate ? "rotate-45" : ""}
        style={{
          width: isGate ? 11 : 12,
          height: isGate ? 11 : 12,
          borderRadius: isGate ? 2 : 9999,
          background: active ? color : "transparent",
          border: `1.5px solid ${color}${active ? "" : "88"}`,
        }}
      />
    </span>
  );
}

export function WorkflowTimeline({ task }: { task: Task }) {
  return (
    <Panel
      title="Workflow Timeline"
      subtitle="12-stage Savrio AI engineering pipeline"
      bodyClassName="p-2"
    >
      <ol className="relative" role="list">
        {STAGE_SEQUENCE.map((stage, i) => {
          const state = visualStateFor(stage.id, task);
          const meta = STATE_META[state];
          const isGate = stage.kind === "gate";
          const agent = AGENTS[stage.agent];
          const dim = state === "pending";
          const last = i === STAGE_SEQUENCE.length - 1;

          return (
            <li key={stage.id} className="relative flex gap-3 px-2">
              {/* connector rail */}
              {!last && (
                <span
                  className="absolute left-[23px] top-8 bottom-0 w-px"
                  style={{
                    background:
                      state === "complete" ? "var(--ok)" : "var(--border)",
                    opacity: state === "complete" ? 0.4 : 1,
                  }}
                  aria-hidden
                />
              )}
              <div className="flex flex-col items-center pt-2.5">
                <Marker state={state} isGate={isGate} />
              </div>

              <div
                className={`mb-1 flex-1 rounded-lg border px-3 py-2.5 transition-colors ${dim ? "opacity-60" : ""}`}
                style={{
                  borderColor:
                    state === "active" || state === "waiting_for_approval"
                      ? `${meta.color}55`
                      : "var(--border)",
                  background:
                    state === "active" || state === "waiting_for_approval"
                      ? `${meta.color}0f`
                      : isGate
                        ? "var(--surface-2)"
                        : "transparent",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10.5px] text-[var(--text-faint)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[13px] font-medium text-[var(--text)]">
                      {stage.label}
                    </span>
                    {isGate && (
                      <span
                        className="rounded px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide"
                        style={{ color: "#a78bfa", background: "#a78bfa1f", border: "1px solid #a78bfa33" }}
                      >
                        Verification gate
                      </span>
                    )}
                  </div>
                  <span
                    className="text-[10.5px] font-medium"
                    style={{ color: meta.color }}
                  >
                    {meta.label}
                  </span>
                </div>

                <div className="mt-1.5 flex items-start gap-2">
                  <Avatar
                    initials={agent.initials}
                    accent={agent.accent}
                    size={18}
                    active={state === "active" || state === "waiting_for_approval"}
                  />
                  <div className="min-w-0">
                    <span className="text-[11px] font-medium" style={{ color: agent.accent }}>
                      {agent.name}
                    </span>
                    <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-faint)]">
                      {stage.description}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}
