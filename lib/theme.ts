// Hex color constants for use in inline styles where we append alpha suffixes
// (e.g. `${COLORS.ok}22`). CSS custom properties (var(--x)) cannot be
// concatenated with an alpha suffix, so JS-side styling uses these hex values.
// The same values are mirrored as CSS variables in globals.css for className use.

export const COLORS = {
  bg: "#06070a",
  surface2: "#111420",
  surface3: "#171b28",
  text: "#e7e9ef",
  textDim: "#9aa1ad",
  // Mirrors --text-faint in globals.css (WCAG AA compliant on dark surfaces).
  textFaint: "#8a92a0",
  accent: "#f2b84b",
  ok: "#34d399",
  run: "#60a5fa",
  warn: "#fbbf24",
  err: "#f87171",
  // Raised from #6b7280, which rendered as small text in ~20 places at
  // 3.55:1 (--surface-3) to 4.17:1 (--bg) and failed WCAG 2.1 AA (1.4.3) on
  // every app surface. #8a92a0 measures 5.47:1 to 6.43:1. Held under test by
  // lib/mission-control/contrast.test.ts.
  idle: "#8a92a0",
  wait: "#f2b84b",
} as const;
