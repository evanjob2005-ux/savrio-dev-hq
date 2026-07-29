import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEV_HQ_E2E_BLOCKED_SCENARIO,
  DEV_HQ_E2E_BLOCKED_TASK_ID,
  getDevHqStore,
  resetDevHqStore,
} from "@/lib/dev-hq/store";

afterEach(() => {
  // Reset while the fixture inputs are disabled, then restore whatever
  // environment the test runner inherited. Direct deletion would destroy an
  // operator-provided value instead of returning it after the test.
  vi.stubEnv("DEV_HQ_DEPLOYMENT_MODE", undefined);
  vi.stubEnv("DEV_HQ_E2E_SCENARIO", undefined);
  resetDevHqStore();
  vi.unstubAllEnvs();
});

function resetWith(mode: string | undefined, scenario: string | undefined) {
  vi.stubEnv("DEV_HQ_DEPLOYMENT_MODE", mode);
  vi.stubEnv("DEV_HQ_E2E_SCENARIO", scenario);
  resetDevHqStore();
  return getDevHqStore();
}

describe("Mission Control process-start E2E fixture", () => {
  it.each([
    [undefined, DEV_HQ_E2E_BLOCKED_SCENARIO],
    ["disabled", DEV_HQ_E2E_BLOCKED_SCENARIO],
    ["Local", DEV_HQ_E2E_BLOCKED_SCENARIO],
    ["", DEV_HQ_E2E_BLOCKED_SCENARIO],
    ["local", undefined],
    ["local", ""],
    ["local", "unknown"],
    ["local", `${DEV_HQ_E2E_BLOCKED_SCENARIO}-extra`],
    ["local", DEV_HQ_E2E_BLOCKED_SCENARIO.toUpperCase()],
  ])(
    "does not seed for mode %j and scenario %j",
    (mode, scenario) => {
      const store = resetWith(mode, scenario);
      expect(store.tasks.has(DEV_HQ_E2E_BLOCKED_TASK_ID)).toBe(false);
      expect(store.projects.has("proj-e2e-blocked")).toBe(false);
    },
  );

  it("seeds exactly one blocked task only for exact local plus exact scenario", () => {
    const store = resetWith("local", DEV_HQ_E2E_BLOCKED_SCENARIO);
    expect([...store.tasks.values()]).toEqual([
      expect.objectContaining({
        id: DEV_HQ_E2E_BLOCKED_TASK_ID,
        projectId: "proj-e2e-blocked",
        status: "blocked",
        title: "E2E blocked task",
      }),
    ]);
    expect([...store.projects.values()]).toEqual([
      expect.objectContaining({
        id: "proj-e2e-blocked",
        status: "active",
      }),
    ]);
  });
});
