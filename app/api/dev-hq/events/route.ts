import { NextResponse } from "next/server";
import { getDevHqAdapters } from "@/lib/dev-hq/adapters";
import {
  EVENT_BUFFER_SIZE,
  EVENT_FEED_DEFAULT_LIMIT,
} from "@/lib/dev-hq/constants";

/**
 * The accepted `limit`, or the reason it was refused (SEC-07 / SVC-10).
 *
 * `Number()` was the whole defect: it maps `"abc"` to `NaN`, `""` to `0` and
 * `"-5"` to `-5`, and every one of those reaches `Array.prototype.slice`, which
 * accepts all three without complaint — `slice(0, NaN)` and `slice(0, 0)` return
 * nothing, and `slice(0, -5)` returns the feed **with its five oldest entries
 * removed**. A caller therefore got a 200 and a wrong feed with no signal that
 * anything had been misunderstood. So the shape is matched before any numeric
 * coercion, and anything outside the range the store can actually serve is
 * refused rather than quietly reinterpreted.
 */
function parseLimit(raw: string | null): { limit: number } | { error: string } {
  if (raw === null) return { limit: EVENT_FEED_DEFAULT_LIMIT };
  const expected = `limit must be a whole number from 1 to ${EVENT_BUFFER_SIZE}`;
  // Digits only, no sign, no decimal point, no exponent, no surrounding space.
  // Deliberately stricter than Number(): every form it silently accepts is a
  // form whose meaning the caller and this endpoint would disagree about.
  if (!/^\d+$/.test(raw)) {
    return { error: `${expected}; received "${raw}".` };
  }
  const limit = Number(raw);
  if (limit < 1 || limit > EVENT_BUFFER_SIZE) {
    return { error: `${expected}; received "${raw}".` };
  }
  return { limit };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = parseLimit(searchParams.get("limit"));
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { eventLogger } = getDevHqAdapters();
  const events = await eventLogger.listRecent({ limit: parsed.limit });
  return NextResponse.json({ events });
}
