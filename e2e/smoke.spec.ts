import { expect, test } from "@playwright/test";

// Single smoke test proving the browser harness works end to end: the app is
// served by the configured web server, the route renders, and a user-visible
// element is present. No network calls beyond the local server, no auth.
test("mission control shell renders its heading for a visitor", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "Savrio Dev HQ" }),
  ).toBeVisible();
});
