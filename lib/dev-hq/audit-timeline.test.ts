import { beforeEach, describe, expect, it } from "vitest";

import { createDevEventLogger } from "@/lib/dev-hq/adapters/dev-event-logger";
import { resetDevHqStore } from "@/lib/dev-hq/store";

describe("append-only audit timeline", () => {
  beforeEach(() => {
    resetDevHqStore();
  });

  it("retains an unbroken timeline beyond the former 200-event buffer", async () => {
    const logger = createDevEventLogger();
    for (let index = 0; index < 205; index += 1) {
      await logger.log({
        type: "audit.test",
        entityType: "task",
        entityId: `task-${index}`,
        message: `event ${index}`,
        actorLabel: "test",
      });
    }

    const all = await logger.listRecent({ limit: 205 });
    expect(all).toHaveLength(205);
    expect(new Set(all.map((event) => event.entityId)).size).toBe(205);
    expect(all.some((event) => event.entityId === "task-0")).toBe(true);
  });

  it("does not manufacture events when nothing was written", async () => {
    expect(await createDevEventLogger().listRecent({ limit: 205 })).toEqual([]);
  });
});
