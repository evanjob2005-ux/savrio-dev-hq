// Small, shared presentational primitives for the mission-control UI.
// Server-safe (no client hooks) so they can be used anywhere.

import type { ReactNode } from "react";

export function Panel({
  title,
  subtitle,
  right,
  children,
  className = "",
  bodyClassName = "p-4",
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-[var(--border)] bg-[var(--surface-1)] shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset] ${className}`}
    >
      {(title || right) && (
        <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
          <div className="min-w-0">
            {title && (
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--text)]">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-0.5 truncate text-[11px] text-[var(--text-faint)]">
                {subtitle}
              </p>
            )}
          </div>
          {right}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/**
 * A region that scrolls its own overflow, made operable without a pointer.
 *
 * WCAG 2.1 SC 2.1.1 (Keyboard, Level A): a scroll container holding no
 * focusable descendant cannot be reached or scrolled by keyboard at all, so
 * everything past its first screenful is simply unavailable — in the audit
 * trail's case, every run record past 520px.
 *
 * `tabIndex` alone would fix the scrolling and create a second problem: an
 * unlabelled, roleless stop in the tab order that a screen reader announces as
 * nothing. Hence the required `label` and the explicit role.
 *
 * `role="group"` rather than `role="region"` is deliberate. `region` is a
 * landmark; five landmarks named after scroll containers would bury the page's
 * actual landmarks in the rotor. `group` carries an accessible name just the
 * same and is not a landmark.
 *
 * The wrapper exists so list semantics survive: putting the role on the `<ul>`
 * itself would replace `role="list"` and cost screen-reader users the item
 * count.
 */
export function ScrollRegion({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      tabIndex={0}
      role="group"
      aria-label={label}
      className={`savrio-scroll outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${className}`}
    >
      {children}
    </div>
  );
}

export function StatusDot({
  color,
  pulse = false,
  size = 8,
}: {
  color: string;
  pulse?: boolean;
  size?: number;
}) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full ${pulse ? "savrio-pulse" : ""}`}
      style={{
        width: size,
        height: size,
        background: color,
        boxShadow: pulse ? `0 0 0 3px ${color}22` : undefined,
      }}
      aria-hidden
    />
  );
}

export function Badge({
  children,
  color,
  subtle = true,
}: {
  children: ReactNode;
  color: string;
  subtle?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium tracking-wide"
      style={{
        color,
        background: subtle ? `${color}18` : color,
        border: `1px solid ${color}33`,
      }}
    >
      {children}
    </span>
  );
}

export function ProgressBar({
  value,
  color = "var(--accent)",
  className = "",
  label,
}: {
  value: number;
  color?: string;
  className?: string;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-3)] ${className}`}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${Math.round(clamped)}%`}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${clamped}%`, background: color }}
      />
    </div>
  );
}

export function Avatar({
  initials,
  accent,
  size = 28,
  active = false,
}: {
  initials: string;
  accent: string;
  size?: number;
  active?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-lg font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        color: accent,
        background: `${accent}1f`,
        border: `1px solid ${accent}${active ? "88" : "33"}`,
      }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
