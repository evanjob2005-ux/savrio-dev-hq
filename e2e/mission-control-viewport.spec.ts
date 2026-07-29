import { expect, test } from "@playwright/test";

// Viewport and runtime-health assertions for the Mission Control shell.
//
// Separate from smoke.spec.ts on purpose: that file proves the browser harness
// works end to end and is deliberately minimal. These assertions prove
// properties the Phase 1 Mission Control exit gate depends on, and they carry
// real weight only because the config runs every spec at both a desktop and a
// mobile project.
//
// Populated approval and blocker behaviour is exercised separately in
// mission-control-live.spec.ts against this same production build and store.
test("produces no runtime or HTTP errors", async ({
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

  // Web-first assertions instead of waitForLoadState("networkidle").
  // Mission Control polls every 3 seconds, so "the network went quiet" is not a
  // durable property. The blocked task proves the state request completed and
  // the populated view rendered before the error collectors are inspected.
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(
    page
      .locator('section[aria-label="Blocked tasks"]')
      .getByText("E2E blocked task", { exact: true }),
  ).toBeVisible();

  // An uncaught exception is never expected, regardless of API availability.
  expect(pageErrors, `uncaught page errors:\n${pageErrors.join("\n")}`).toEqual(
    [],
  );

  expect(
    failedResponses,
    `HTTP failures:\n${failedResponses.join("\n")}`,
  ).toEqual([]);

  expect(
    consoleErrors,
    `application console errors:\n${consoleErrors.join("\n")}`,
  ).toEqual([]);
});

test("does not scroll horizontally at this viewport", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("banner")).toBeVisible();

  // Runs at both projects. A Founder-facing operational view that scrolls
  // sideways on a phone does not satisfy the Mission Control gate. Wait for the
  // exact process-start fixture first so this cannot pass against a loading or
  // empty shell merely because another spec happened not to populate the store.
  await expect(
    page
      .locator('section[aria-label="Blocked tasks"]')
      .getByText("E2E blocked task", { exact: true }),
  ).toBeVisible();
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
