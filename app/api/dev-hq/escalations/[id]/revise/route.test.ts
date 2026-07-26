import { beforeEach, describe, expect, it } from "vitest";

import { POST } from "@/app/api/dev-hq/escalations/[id]/revise/route";
import { resetDevHqAdapters } from "@/lib/dev-hq/adapters";
import { resetDevHqStore } from "@/lib/dev-hq/store";

describe("POST /api/dev-hq/escalations/[id]/revise", () => {
  beforeEach(() => {
    resetDevHqStore();
    resetDevHqAdapters();
  });

  it("returns 404 for a missing escalation", async () => {
    const response = await POST(
      new Request("http://localhost/api/dev-hq/escalations/esc-missing/revise", {
        method: "POST",
      }),
      { params: Promise.resolve({ id: "esc-missing" }) },
    );
    expect(response.status).toBe(404);
    const body = (await response.json()) as { error: string };
    expect(body.error).toContain("Escalation not found");
  });
});
