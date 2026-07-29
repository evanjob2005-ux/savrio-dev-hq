import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEV_HQ_INTERNAL_TOKEN_HEADER,
  rejectInternalDevRequest,
} from "@/lib/dev-hq/internal-guard";

/**
 * The inner security boundary had no test of its own.
 *
 * The only two suites that touched it stubbed it to always allow --
 * `rejectInternalDevRequest: () => null` in `continuation-terminal-failure.test.ts`
 * and `process-start-marker-continuation-seam.test.ts` -- so the entire test
 * suite stayed green whether this function rejected anything or not. These are
 * the tests that fail when it stops guarding.
 *
 * All four arms are covered: production, unconfigured token, mismatched token,
 * and the single case that must be allowed through.
 */

const withRequest = (headers: Record<string, string> = {}) =>
  new Request("http://localhost/api/dev-hq/internal/execution-callback", {
    method: "POST",
    headers,
  });

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("rejectInternalDevRequest", () => {
  it("blocks an optimized deployment not explicitly marked local", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEV_HQ_DEPLOYMENT_MODE", "disabled");
    // Deliberately supply a *correct* token. Production must not be reachable
    // by holding the right credential -- the route is off, not protected.
    vi.stubEnv("DEV_HQ_INTERNAL_TOKEN", "correct-horse-battery-staple");

    const response = rejectInternalDevRequest(
      withRequest({
        [DEV_HQ_INTERNAL_TOKEN_HEADER]: "correct-horse-battery-staple",
      }),
    );

    expect(response).not.toBeNull();
    expect(response?.status).toBe(403);
  });

  it.each(["", "internet"])(
    "blocks development with an absent or invalid deployment mode (%j), even with the correct token",
    (mode) => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("DEV_HQ_DEPLOYMENT_MODE", mode);
      vi.stubEnv("DEV_HQ_INTERNAL_TOKEN", "expected-token");

      const response = rejectInternalDevRequest(
        withRequest({
          [DEV_HQ_INTERNAL_TOKEN_HEADER]: "expected-token",
        }),
      );

      expect(response?.status).toBe(403);
    },
  );

  it("allows an optimized local deployment with the correct token", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEV_HQ_DEPLOYMENT_MODE", "local");
    vi.stubEnv("DEV_HQ_INTERNAL_TOKEN", "expected-token");

    expect(
      rejectInternalDevRequest(
        withRequest({
          [DEV_HQ_INTERNAL_TOKEN_HEADER]: "expected-token",
        }),
      ),
    ).toBeNull();
  });

  it("fails closed when the token is not configured", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEV_HQ_DEPLOYMENT_MODE", "local");
    vi.stubEnv("DEV_HQ_INTERNAL_TOKEN", "");

    const response = rejectInternalDevRequest(withRequest());

    expect(response).not.toBeNull();
    expect(response?.status).toBe(503);

    // A misconfigured deployment must not silently become an open one: the
    // failure mode is "refuse", never "allow".
    expect(response?.status).not.toBe(200);
  });

  it("rejects a mismatched token", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEV_HQ_DEPLOYMENT_MODE", "local");
    vi.stubEnv("DEV_HQ_INTERNAL_TOKEN", "expected-token");

    const response = rejectInternalDevRequest(
      withRequest({ [DEV_HQ_INTERNAL_TOKEN_HEADER]: "wrong-token" }),
    );

    expect(response).not.toBeNull();
    expect(response?.status).toBe(401);
  });

  it("rejects a missing token header even when one is configured", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEV_HQ_DEPLOYMENT_MODE", "local");
    vi.stubEnv("DEV_HQ_INTERNAL_TOKEN", "expected-token");

    const response = rejectInternalDevRequest(withRequest());

    expect(response).not.toBeNull();
    expect(response?.status).toBe(401);
  });

  it("allows exactly one case: development, configured, and matching", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEV_HQ_DEPLOYMENT_MODE", "local");
    vi.stubEnv("DEV_HQ_INTERNAL_TOKEN", "expected-token");

    const response = rejectInternalDevRequest(
      withRequest({ [DEV_HQ_INTERNAL_TOKEN_HEADER]: "expected-token" }),
    );

    expect(response).toBeNull();
  });

  it("does not accept a token that merely shares a prefix", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEV_HQ_DEPLOYMENT_MODE", "local");
    vi.stubEnv("DEV_HQ_INTERNAL_TOKEN", "expected-token");

    // Guards against a future rewrite to startsWith/includes comparison, which
    // would keep every test above green while accepting a truncated guess.
    const response = rejectInternalDevRequest(
      withRequest({ [DEV_HQ_INTERNAL_TOKEN_HEADER]: "expected" }),
    );

    expect(response?.status).toBe(401);
  });
});
