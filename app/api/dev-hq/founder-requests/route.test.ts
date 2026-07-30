import { beforeEach, describe, expect, it, vi } from "vitest";

const { triggerMock } = vi.hoisted(() => ({ triggerMock: vi.fn() }));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: { trigger: triggerMock },
}));

import { POST } from "@/app/api/dev-hq/founder-requests/route";
import { INTERNAL_ERROR_MESSAGE } from "@/app/api/dev-hq/_lib/route-errors";
import * as founderRequestService from "@/lib/dev-hq/founder-request-service";
import { getDevHqStore, resetDevHqStore } from "@/lib/dev-hq/store";
import { resetDevHqAdapters } from "@/lib/dev-hq/adapters";

function request(body: unknown, raw?: string): Request {
  return new Request("http://localhost/api/dev-hq/founder-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ?? JSON.stringify(body),
  });
}

/** Every task the request actually persisted, so a refusal can be shown to write nothing. */
function persistedTasks() {
  return [...getDevHqStore().tasks.values()].map((task) => ({
    title: task.title,
    priority: task.priority,
  }));
}

const VALID = {
  title: "Ship Mission Control",
  description: "Deliver the founder request workflow with durable state.",
};

describe("POST /api/dev-hq/founder-requests", () => {
  beforeEach(() => {
    resetDevHqStore();
    resetDevHqAdapters();
    triggerMock.mockReset();
    triggerMock.mockResolvedValue({ id: "run-test-1" });
  });

  // --- P2-34: priority is validated, not cast -------------------------------
  //
  // Both arms start from an empty store and differ only in the `priority` field,
  // so a refusal cannot be attributed to anything else (STD-CTRL-001 rule 2).
  describe("P2-34 priority", () => {
    it("refuses a priority outside the vocabulary and persists nothing", async () => {
      const response = await POST(
        request({ ...VALID, priority: "banana" }),
      );
      const body = await response.json();

      expect(
        { status: response.status, tasks: persistedTasks() },
        "P2-34: `priority` was cast, not checked, so any string was accepted and " +
          "WRITTEN. Observe `status: 201` with a persisted task whose priority is " +
          '"banana" below. `Priority` is a closed four-value set the dashboard ' +
          "indexes directly (PRIORITY_ACCENT[task.priority]), so the stored value " +
          "is a key with no entry, and it is durable — exactly the hole 9c1420f " +
          "found in `decision`.",
      ).toEqual({ status: 400, tasks: [] });

      expect(body.error).toContain("Critical, High, Medium, Low");
      expect(triggerMock).not.toHaveBeenCalled();
    });

    it("null arm: each of the four valid priorities is accepted and persisted", async () => {
      for (const priority of ["Critical", "High", "Medium", "Low"] as const) {
        resetDevHqStore();
        resetDevHqAdapters();
        const response = await POST(request({ ...VALID, priority }));

        expect(response.status, `priority ${priority}`).toBe(201);
        expect((await response.json()).task.priority).toBe(priority);
        expect(persistedTasks()).toEqual([
          { title: VALID.title, priority },
        ]);
      }
    });

    it("null arm: an absent priority still defaults to Medium", async () => {
      const response = await POST(request(VALID));

      expect(response.status).toBe(201);
      expect((await response.json()).task.priority).toBe("Medium");
    });

    it("bounds the free-text fields rather than persisting them unbounded", async () => {
      const longTitle = await POST(
        request({ ...VALID, title: "x".repeat(201) }),
      );
      expect(longTitle.status).toBe(400);

      const longDescription = await POST(
        request({ ...VALID, description: "x".repeat(10_001) }),
      );
      expect(longDescription.status).toBe(400);
      expect(persistedTasks()).toEqual([]);

      // Null arm: one character under each bound is still accepted.
      expect(
        (await POST(request({ ...VALID, title: "x".repeat(200) }))).status,
      ).toBe(201);
    });

    it("validates the normalised value it stores", async () => {
      // Trimming after the length check would let a field pass in one form and
      // be persisted in another. `title` also becomes the project name and slug.
      const response = await POST(
        request({ title: "  Padded title  ", description: "  A described request.  " }),
      );

      expect(response.status).toBe(201);
      expect(persistedTasks()).toEqual([
        { title: "Padded title", priority: "Medium" },
      ]);
    });

    it("still refuses a missing title or description", async () => {
      expect((await POST(request({ description: "d".repeat(20) }))).status).toBe(
        400,
      );
      expect((await POST(request({ title: "t" }))).status).toBe(400);
      expect((await POST(request({ ...VALID, title: "   " }))).status).toBe(400);
    });
  });

  // --- P2-33: consistent, non-leaking error mapping --------------------------
  describe("P2-33 error mapping", () => {
    it("answers 400 for a body that is not JSON, not 500", async () => {
      const response = await POST(request(null, "{ not json"));

      expect(
        response.status,
        "A malformed body is the caller's error. A 500 blames the server, is " +
          "retryable, and pages an operator for a request that can never succeed.",
      ).toBe(400);
      expect(await response.text()).not.toContain("JSON.parse");
    });

    it("answers 400 for a body that is not an object", async () => {
      expect((await POST(request(null, '"a string"'))).status).toBe(400);
      expect((await POST(request(null, "[]"))).status).toBe(400);
    });

    it("does not leak an internal failure's message into the 500", async () => {
      const leak = "ECONNREFUSED postgres://dev-hq:hunter2@10.0.0.4:5432/devhq";
      const injected = new Error(leak);
      vi.spyOn(founderRequestService, "createFounderRequest").mockRejectedValue(
        injected,
      );
      // Silenced so the deliberate failure does not look like a real one in the
      // suite output; the assertion below is what proves it was recorded.
      const logged = vi.spyOn(console, "error").mockImplementation(() => {});

      const response = await POST(request(VALID));
      const text = await response.text();

      expect(response.status).toBe(500);
      expect(
        text,
        "An unexpected failure's message is written by whatever broke, not by " +
          "anyone deciding what a caller may see. Returning it verbatim published " +
          "an internal host and credential.",
      ).not.toContain(leak);
      expect(JSON.parse(text)).toEqual({ error: INTERNAL_ERROR_MESSAGE });
      // Not swallowed: the cause still reaches the server log. Asserting on the
      // injected error itself also proves the spy took effect, so the 500 above
      // is the failure this test caused and not an unrelated one.
      expect(logged).toHaveBeenCalledWith(expect.any(String), injected);
    });
  });
});
