// SEC-07 / SVC-10. `GET /api/dev-hq/events` coerced `limit` with `Number()` and
// handed the result straight to `Array.prototype.slice`.
//
// Falsifiable claim under test: the endpoint answers 400 with a stated reason
// for any `limit` that is not a whole number from 1 to EVENT_BUFFER_SIZE, and
// otherwise returns exactly the newest `min(limit, available)` events; an absent
// limit means EVENT_FEED_DEFAULT_LIMIT.
//
// The two shapes that motivated it, both previously 200s:
//   ?limit=abc  -> Number("abc") = NaN, slice(0, NaN) = []   -> an empty feed
//   ?limit=-5   -> slice(0, -5)                              -> the feed with
//                                                               its five OLDEST
//                                                               entries removed

import { beforeEach, describe, expect, it } from "vitest";

import { GET } from "@/app/api/dev-hq/events/route";
import { resetDevHqAdapters } from "@/lib/dev-hq/adapters";
import {
  EVENT_BUFFER_SIZE,
  EVENT_FEED_DEFAULT_LIMIT,
} from "@/lib/dev-hq/constants";
import { appendEvent, resetDevHqStore } from "@/lib/dev-hq/store";
import type { Event } from "@/types/domain";

/**
 * Seed `count` events, oldest first, on distinct ascending timestamps so
 * "newest" and "oldest" are unambiguous rather than resolved by sort stability.
 */
function seedEvents(count: number): Event[] {
  const seeded: Event[] = [];
  for (let index = 0; index < count; index += 1) {
    seeded.push(
      appendEvent({
        id: `evt-${index}`,
        type: "test.event",
        entityType: "task",
        entityId: "task-1",
        message: `event ${index}`,
        actorId: null,
        actorLabel: "System",
        // 2026-07-24T21:00:00.000Z + index seconds.
        timestamp: new Date(Date.UTC(2026, 6, 24, 21, 0, index)).toISOString(),
      }),
    );
  }
  return seeded;
}

async function get(query: string): Promise<{
  status: number;
  body: { events?: Event[]; error?: string };
}> {
  const response = await GET(
    new Request(`http://localhost/api/dev-hq/events${query}`),
  );
  return {
    status: response.status,
    body: (await response.json()) as { events?: Event[]; error?: string },
  };
}

describe("GET /api/dev-hq/events limit validation (SEC-07 / SVC-10)", () => {
  beforeEach(() => {
    resetDevHqStore();
    resetDevHqAdapters();
  });

  // --- null arm (rule 2): well-formed limits must still be served, from the
  // identical starting state the rejection cases use. A validator that refused
  // everything would satisfy the negative cases below and be useless.
  describe("null arm: well-formed requests are served", () => {
    it("serves an absent limit at the default", async () => {
      seedEvents(EVENT_FEED_DEFAULT_LIMIT + 5);
      const { status, body } = await get("");
      expect(status).toBe(200);
      expect(body.events).toHaveLength(EVENT_FEED_DEFAULT_LIMIT);
    });

    it("serves an explicit in-range limit", async () => {
      seedEvents(10);
      const { status, body } = await get("?limit=3");
      expect(status).toBe(200);
      expect(body.events).toHaveLength(3);
    });

    it("serves the boundaries 1 and the buffer size", async () => {
      seedEvents(5);
      expect((await get("?limit=1")).status).toBe(200);
      expect((await get("?limit=1")).body.events).toHaveLength(1);

      const max = await get(`?limit=${EVENT_BUFFER_SIZE}`);
      expect(max.status).toBe(200);
      // Fewer events than asked for is not an error; it is the whole feed.
      expect(max.body.events).toHaveLength(5);
    });

    it("returns the newest events, not the oldest", async () => {
      seedEvents(5);
      const { body } = await get("?limit=2");
      expect(body.events?.map((event) => event.id)).toEqual(["evt-4", "evt-3"]);
    });
  });

  describe("refuses a limit it cannot honour", () => {
    it("rejects a non-numeric limit instead of returning an empty feed", async () => {
      seedEvents(5);
      const { status, body } = await get("?limit=abc");

      expect(
        status,
        `?limit=abc returned ${status}. Number("abc") is NaN and slice(0, NaN) ` +
          "is empty, so the caller receives a 200 and an empty feed that is " +
          "indistinguishable from a system with no history (SEC-07 / SVC-10).",
      ).toBe(400);
      expect(body.events).toBeUndefined();
      expect(body.error).toMatch(/limit must be a whole number/);
      expect(body.error).toContain("abc");
    });

    it("rejects a negative limit instead of silently dropping the oldest events", async () => {
      const seeded = seedEvents(5);
      const { status, body } = await get("?limit=-2");

      expect(
        status,
        `?limit=-2 returned ${status}. slice(0, -2) removes the two OLDEST ` +
          "entries and returns the rest with a 200, so the caller is served a " +
          "silently truncated timeline (SEC-07 / SVC-10).",
      ).toBe(400);
      // The specific corruption: the negative slice would have returned the
      // newest three and dropped evt-0 and evt-1 from the tail.
      expect(body.events).toBeUndefined();
      expect(seeded).toHaveLength(5);
    });

    it("rejects zero, which returns nothing while reporting success", async () => {
      seedEvents(5);
      const { status, body } = await get("?limit=0");
      expect(status).toBe(400);
      expect(body.error).toContain("0");
    });

    it("rejects an empty limit, which Number() reads as 0", async () => {
      seedEvents(5);
      const { status } = await get("?limit=");
      expect(
        status,
        'Number("") is 0, so an empty limit returned a 200 with no events.',
      ).toBe(400);
    });

    it("rejects the numeric forms Number() accepts and slice cannot use", async () => {
      seedEvents(5);
      for (const raw of ["1.5", "1e2", " 3", "3 ", "+3", "0x10", "Infinity"]) {
        const { status } = await get(`?limit=${encodeURIComponent(raw)}`);
        expect(status, `?limit=${raw} was not refused`).toBe(400);
      }
    });

    it("rejects a limit above what the buffer can ever serve", async () => {
      seedEvents(5);
      const { status, body } = await get(`?limit=${EVENT_BUFFER_SIZE + 1}`);
      expect(status).toBe(400);
      expect(body.error).toContain(String(EVENT_BUFFER_SIZE));
    });
  });
});
