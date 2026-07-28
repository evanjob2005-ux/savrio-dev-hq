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
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const failedResponses: string[] = [];

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  // Retained unfiltered. An app-emitted console.error -- a state parse failure,
  // a React warning escalated to error -- is neither an uncaught exception nor
  // an HTTP failure, so removing this listener in favour of response events
  // would trade one blind spot for another. Resource-load noise is no longer a
  // reason to filter it, because failures are now asserted structurally below.
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  // Asserted over structured response events rather than console text. Chromium
  // logs "Failed to load resource" for EVERY non-2xx subresource, so filtering
  // on that string would also discard a 500 from an API route, a 404 on a
  // missing JS chunk, or a failed font -- and this test would stay green while
  // the page was genuinely broken.
  page.on("response", (response) => {
    const status = response.status();
    if (status >= 400) {
      failedResponses.push(`${status} ${new URL(response.url()).pathname}`);
    }
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // An uncaught exception is never expected, regardless of API availability.
  expect(pageErrors, `uncaught page errors:\n${pageErrors.join("\n")}`).toEqual(
    [],
  );

  // The single tolerated failure class is the 403 that proxy.ts deliberately
  // returns for the whole Dev HQ surface in production. Everything else fails,
  // including a 5xx from a Dev HQ route -- the API being switched off must not
  // become cover for the API being broken.
  const unexpected = failedResponses.filter(
    (entry) => !entry.startsWith("403 /api/dev-hq/"),
  );
  expect(
    unexpected,
    `HTTP failures outside the deliberately blocked Dev HQ surface:\n${unexpected.join("\n")}`,
  ).toEqual([]);

  // Console errors that merely restate a tolerated 403 are expected; anything
  // else is the application reporting a genuine problem.
  const appConsoleErrors = consoleErrors.filter(
    (text) => !/Failed to load resource/i.test(text),
  );
  expect(
    appConsoleErrors,
    `application console errors:\n${appConsoleErrors.join("\n")}`,
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
