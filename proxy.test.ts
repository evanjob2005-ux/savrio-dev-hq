import { afterEach, describe, expect, it, vi } from "vitest";

import { config, proxy } from "@/proxy";

/**
 * The outer security boundary had no test of its own.
 *
 * A reviewer stubbed `proxy.ts` to allow everything and ran the full suite plus
 * the e2e: 400/400 green, e2e green. Every test in the repository would have
 * stayed green while the entire unauthenticated Dev HQ API -- including the
 * founder approve and reject endpoints -- was open on the public internet.
 *
 * These are the tests that go red in that scenario.
 */

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("proxy", () => {
  it("blocks the Dev HQ surface in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    const response = proxy();

    expect(response.status).toBe(403);
  });

  it("allows the Dev HQ surface outside production", () => {
    vi.stubEnv("NODE_ENV", "development");

    const response = proxy();

    // NextResponse.next() is signalled by the internal rewrite header rather
    // than by status alone, so assert the status is not the block.
    expect(response.status).not.toBe(403);
  });

  it("covers every Dev HQ route, not merely the ones that exist today", () => {
    // The matcher is the boundary's reach. A narrowed matcher would leave the
    // 403 test above passing while new routes were silently exposed, so the
    // pattern itself is asserted.
    expect(config.matcher).toBe("/api/dev-hq/:path*");
  });
});
