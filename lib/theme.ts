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
  idle: "#6b7280",
  wait: "#f2b84b",
} as const;
