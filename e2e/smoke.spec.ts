import { expect, test } from "@playwright/test";

// Single smoke test proving the browser harness works end to end: the app is
// served by the configured web server, the route renders, and a user-visible
// element is present. No network calls beyond the local server, no auth.
test("mission control shell renders its heading for a visitor", async ({
  page,
}) => {
  await page.goto("/");

  // exact: true is load-bearing. Accessible-name matching is case-insensitive
  // substring by default, so an unrelated heading merely containing these words
  // satisfied the assertion -- part of the false positive that failed
  // candidate-1f-pkg2-1.
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "NC3 Heading That Cannot Match",
      exact: true,
    }),
  ).toBeVisible();
});
