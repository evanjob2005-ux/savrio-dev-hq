import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://127.0.0.1:${PORT}`;

// E2E specs live in e2e/ and are matched explicitly by the .spec.ts suffix, so
// a file placed here with a .test.ts suffix is collected by neither runner
// rather than by both: Playwright matches only testMatch below, and the Vitest
// node project excludes e2e/ outright.
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    // retain-on-failure, not on-first-retry: with retries at 0 there is never a
    // first retry, so an on-first-retry trace could never be captured.
    trace: "retain-on-failure",
  },
  // The Phase 1 Mission Control exit gate requires live progress to be viewable
  // on desktop AND phone, so a desktop-only pass does not evidence it. Both
  // projects run the same specs; viewport-sensitive assertions live in
  // mission-control-viewport.spec.ts.
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  // Production build + start, so the run is deterministic rather than
  // depending on dev-server compilation timing.
  webServer: {
    command: `npm run build && npx next start --hostname 127.0.0.1 --port ${PORT}`,
    url: baseURL,
    // Never reuse. Reuse previously allowed a run to skip the build entirely and
    // pass against whatever already held the port -- the false positive that
    // failed candidate-1f-pkg2-1. The suite must always exercise this build.
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
