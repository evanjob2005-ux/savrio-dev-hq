// UI-05: text contrast of the shared color tokens.
//
// Every StatusToken color is rendered as text — `StatusPill` sets it as the
// element's `color` at 11px, and `MetricStat`, `Badge`, and the audit-trail
// validation pill do the same. So "is this token readable?" is not a styling
// preference, it is WCAG 2.1 SC 1.4.3 (Contrast (Minimum), Level AA), which
// requires 4.5:1 for text below 18.66px/bold-14px.
//
// This existed as a defect for a long time precisely because it had been fixed
// pointwise twice — `--text-faint` in globals.css and the System actor accent in
// ActivityFeed — while the shared constant every status token reads from stayed
// at #6b7280 (3.55:1 on --surface-3). Pointwise fixes cannot close a shared
// constant, so the check lives on the constant.
//
// Rule 2 of STD-CTRL-001: the null arm is `describe("null arm")` at the bottom.
// Without it, a ratio function that returned Infinity would pass every case
// above and this file would measure nothing.

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { COLORS } from "@/lib/theme";
import {
  APPROVAL_STATUS,
  AVAILABILITY_STATUS,
  CONNECTION_STATUS,
  EXECUTION_STATUS,
  LIFECYCLE_STATUS,
  WORKFLOW_STAGE,
  type StatusToken,
} from "@/lib/mission-control/status";

/** WCAG 2.1 relative luminance, per the SC 1.4.3 definition. */
function relativeLuminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((raw) => {
    const c = raw / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** WCAG 2.1 contrast ratio, (L1 + 0.05) / (L2 + 0.05) with L1 the lighter. */
export function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  );
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Composites an 8-digit-suffix fill (`${color}14`) over an opaque surface, which
 * is what StatusPill and Badge actually paint behind their own text. The text
 * therefore sits on a *tinted* surface, not the raw one, and that tint is always
 * a step toward the text color — so it is the harder case, not a softer one.
 */
function composite(fg: string, bg: string, alphaByte: number): string {
  const alpha = alphaByte / 255;
  const parse = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const [fr, fgc, fb] = parse(fg);
  const [br, bgc, bb] = parse(bg);
  const mix = (f: number, b: number) =>
    Math.round(f * alpha + b * (1 - alpha))
      .toString(16)
      .padStart(2, "0");
  return `#${mix(fr, br)}${mix(fgc, bgc)}${mix(fb, bb)}`;
}

/** Every opaque surface a status token is drawn on, from globals.css. */
const SURFACES: Record<string, string> = {
  "--bg": "#06070a",
  "--surface-1": "#0c0e13",
  "--surface-2": "#111420",
  "--surface-3": "#171b28",
};

const AA_NORMAL_TEXT = 4.5;

/** The pill/badge fills the codebase paints under status text. */
const PILL_ALPHAS = [0x14, 0x18, 0x0f];

const TEXT_TOKENS: Record<string, string> = {
  "COLORS.text": COLORS.text,
  "COLORS.textDim": COLORS.textDim,
  "COLORS.textFaint": COLORS.textFaint,
  "COLORS.accent": COLORS.accent,
  "COLORS.ok": COLORS.ok,
  "COLORS.run": COLORS.run,
  "COLORS.warn": COLORS.warn,
  "COLORS.err": COLORS.err,
  "COLORS.idle": COLORS.idle,
  "COLORS.wait": COLORS.wait,
};

function everyStatusToken(): [string, StatusToken][] {
  const groups: [string, Record<string, StatusToken>][] = [
    ["LIFECYCLE_STATUS", LIFECYCLE_STATUS],
    ["EXECUTION_STATUS", EXECUTION_STATUS],
    ["APPROVAL_STATUS", APPROVAL_STATUS],
    ["WORKFLOW_STAGE", WORKFLOW_STAGE],
    ["AVAILABILITY_STATUS", AVAILABILITY_STATUS],
    ["CONNECTION_STATUS", CONNECTION_STATUS],
  ];
  return groups.flatMap(([groupName, group]) =>
    Object.entries(group).map(
      ([key, token]) => [`${groupName}.${key}`, token] as [string, StatusToken],
    ),
  );
}

describe("shared color tokens meet WCAG AA as text", () => {
  for (const [name, color] of Object.entries(TEXT_TOKENS)) {
    for (const [surfaceName, surface] of Object.entries(SURFACES)) {
      it(`${name} on ${surfaceName}`, () => {
        const ratio = contrastRatio(color, surface);
        expect(
          ratio,
          `${name} (${color}) renders as small text on ${surfaceName} (${surface}) at ` +
            `${ratio.toFixed(2)}:1, below the WCAG 2.1 AA minimum of ${AA_NORMAL_TEXT}:1`,
        ).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
      });
    }
  }
});

describe("every StatusToken is readable in a StatusPill", () => {
  for (const [name, token] of everyStatusToken()) {
    it(`${name} — "${token.label}"`, () => {
      for (const surface of Object.values(SURFACES)) {
        for (const alpha of PILL_ALPHAS) {
          const pillBackground = composite(token.color, surface, alpha);
          const ratio = contrastRatio(token.color, pillBackground);
          expect(
            ratio,
            `${name} label "${token.label}" (${token.color}) reads at ${ratio.toFixed(2)}:1 ` +
              `on its own pill fill ${pillBackground} over ${surface} — below ${AA_NORMAL_TEXT}:1`,
          ).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
        }
      }
    });
  }
});

describe("globals.css mirrors lib/theme.ts", () => {
  // lib/theme.ts states the two are mirrors. Nothing enforced it, which is how
  // a pointwise fix to --text-faint could land without COLORS.textFaint, and
  // how a fix to COLORS.idle alone would leave var(--idle) failing in the two
  // places that use it (WorkBoardPanel, SystemHealthPanel).
  const css = fs.readFileSync(
    path.resolve(__dirname, "../../app/globals.css"),
    "utf8",
  );

  const MIRRORED: Record<string, string> = {
    "--bg": COLORS.bg,
    "--surface-2": COLORS.surface2,
    "--surface-3": COLORS.surface3,
    "--text": COLORS.text,
    "--text-dim": COLORS.textDim,
    "--text-faint": COLORS.textFaint,
    "--accent": COLORS.accent,
    "--ok": COLORS.ok,
    "--run": COLORS.run,
    "--warn": COLORS.warn,
    "--err": COLORS.err,
    "--idle": COLORS.idle,
    "--wait": COLORS.wait,
  };

  for (const [cssVar, expected] of Object.entries(MIRRORED)) {
    it(`${cssVar} equals ${expected}`, () => {
      const match = css.match(
        new RegExp(`^\\s*${cssVar}:\\s*(#[0-9a-fA-F]{3,8})\\s*;`, "m"),
      );
      expect(match, `${cssVar} not declared as a hex literal in app/globals.css`).not.toBeNull();
      expect(
        match?.[1].toLowerCase(),
        `app/globals.css declares ${cssVar} as ${match?.[1]} but lib/theme.ts declares ${expected}; ` +
          `className users and inline-style users would render different colors`,
      ).toBe(expected.toLowerCase());
    });
  }
});

describe("null arm: the ratio function can report a failure", () => {
  // Everything above is a set of assertions that a broken measurement would
  // satisfy silently. These fix the measurement to values checkable by hand.
  it("scores the pre-fix #6b7280 below AA on every surface", () => {
    for (const surface of Object.values(SURFACES)) {
      expect(contrastRatio("#6b7280", surface)).toBeLessThan(AA_NORMAL_TEXT);
    }
  });

  it("reproduces the two reference ratios from WCAG's own examples", () => {
    // Black on white is exactly 21:1; a color against itself is exactly 1:1.
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#8a92a0", "#8a92a0")).toBeCloseTo(1, 5);
  });

  it("is symmetric in its arguments", () => {
    expect(contrastRatio("#8a92a0", "#06070a")).toBeCloseTo(
      contrastRatio("#06070a", "#8a92a0"),
      10,
    );
  });
});
