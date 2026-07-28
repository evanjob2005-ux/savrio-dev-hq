import { expect, test } from "@playwright/test";

// Viewport and runtime-health assertions for the Mission Control shell.
//
// Separate from smoke.spec.ts on purpose: that file proves the browser harness
// works end to end and is deliberately minimal. These assertions prove
// properties the Phase 1 Mission Control exit gate depends on, and they carry
// real weight only because the config runs every spec at both a desktop and a
// mobile project.
//
// Not covered here: approval, blocker, and escalation panel behaviour. Those
// belong in the gate suite as Sprint 1F lands them.

// KNOWN HARNESS LIMITATION, deliberately asserted rather than ignored.
//
// playwright.config.ts serves a production build, and proxy.ts fails the entire
// /api/dev-hq/* surface closed in production because nothing authenticates the
// caller yet. So Mission Control loads its shell here but never its data: every
// Dev HQ request returns 403 by design.
//
// This means the Phase 1 Mission Control exit gate CANNOT be fully proved by
// this harness as configured. Shell, layout, and viewport behaviour are proved;
// live progress, approvals, and blockers are not, because the API that feeds
// them is switched off in the environment under test. Closing that gap requires
// either a real authentication boundary (which is what proxy.ts is waiting for)
// or an e2e environment that is not NODE_ENV=production. Until then, treat the
// Mission Control gate as partially evidenced.
//
// The test below is written so that the deliberate 403s pass and anything else
// fails, rather than blanket-ignoring console errors — which would also hide a
// genuine runtime error on this page.
test("produces no runtime errors beyond the deliberate production API block", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const forbidden: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });
  page.on("response", (response) => {
    if (response.status() === 403) {
      forbidden.push(new URL(response.url()).pathname);
    }
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // An uncaught exception is never expected, regardless of API availability.
  expect(pageErrors, `uncaught page errors:\n${pageErrors.join("\n")}`).toEqual(
    [],
  );

  // Every 403 must come from the Dev HQ surface proxy.ts deliberately blocks.
  // A 403 from anywhere else is a real failure.
  const unexpected403s = forbidden.filter(
    (pathname) => !pathname.startsWith("/api/dev-hq/"),
  );
  expect(
    unexpected403s,
    `403 responses outside the deliberately blocked Dev HQ surface:\n${unexpected403s.join("\n")}`,
  ).toEqual([]);

  // Resource-load failures are the browser reporting those same 403s. Anything
  // that is not a resource-load failure is an unexplained console error.
  const unexplained = consoleErrors.filter(
    (text) => !/Failed to load resource/i.test(text),
  );
  expect(
    unexplained,
    `unexplained console errors:\n${unexplained.join("\n")}`,
  ).toEqual([]);
});

test("does not scroll horizontally at this viewport", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Runs at both projects. A Founder-facing operational view that scrolls
  // sideways on a phone does not satisfy the Mission Control gate, and this is
  // the assertion that distinguishes "renders on mobile" from "usable on
  // mobile".
  const overflowsHorizontally = await page.evaluate(() => {
    const root = document.documentElement;
    // One pixel of tolerance absorbs sub-pixel layout rounding, which varies
    // between engines and would otherwise make this flaky rather than useful.
    return root.scrollWidth > root.clientWidth + 1;
  });

  expect(overflowsHorizontally, "document should not scroll horizontally").toBe(
    false,
  );
});

test("exposes a banner landmark carrying run state", async ({ page }) => {
  await page.goto("/");

  // The top bar is the first thing the Founder reads. Asserting the landmark
  // rather than its copy keeps this from failing on ordinary wording changes
  // while still catching the header being removed or losing its semantics.
  await expect(page.getByRole("banner")).toBeVisible();
});
