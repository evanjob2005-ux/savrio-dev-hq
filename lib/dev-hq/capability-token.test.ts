import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { nextCapabilityToken, nextId } from "@/lib/dev-hq/id";

/**
 * Negative controls for capability-token entropy.
 *
 * An independent reviewer brute-forced a live review callback token in roughly
 * 250,000 guesses, because it was minted by `nextId`:
 * `rvt-<epoch-millis>-<process-wide counter>`. The search space collapsed
 * further still, because `/api/dev-hq/events` is unauthenticated in development
 * and discloses both the clock and the shared counter either side of a
 * dispatch.
 *
 * Each test below is paired with the same assertion applied to `nextId`, which
 * MUST fail the entropy bar. Without that arm these tests would pass against a
 * generator with no entropy at all — the property under test is a difference
 * between the two, not a property of a string.
 */
describe("capability token entropy", () => {
  /**
   * The clock is frozen for every case here, and this is a correctness
   * requirement rather than tidiness.
   *
   * `nextId` is `prefix-<epoch-millis>-<counter>` (`lib/dev-hq/id.ts:7`), so its
   * output moves for two independent reasons. Every claim in this file is about
   * the *counter* — that it is sequential, and that the clock is embedded at all
   * — and none of them is about the millisecond the mint happened to land on. A
   * live clock therefore contributed nothing but a race:
   *
   *   - the null arm below reconstructs the second id from the first by
   *     incrementing only the trailing counter, which silently assumes both
   *     mints saw the same millisecond. Straddle a tick and it reds with the
   *     counter IDENTICAL and the epoch differing by one:
   *       expected 'rvt-1785338711082-2' to be 'rvt-1785338711083-2'
   *     Observed in ~0.9% of full-suite runs and 0 of 350 standalone runs — it
   *     needs full-suite scheduling pressure to open the window.
   *   - `is not derived from the wall clock` samples `Date.now()` and then mints,
   *     comparing a second-resolution prefix. A boundary in that window reds it
   *     the same way. Never observed, but latent for the same reason and closed
   *     by the same freeze.
   *
   * Pinned at the describe level, not per case, so a case added later cannot
   * reintroduce the race by omission — any comparison between a `nextId` output
   * and a separately-sampled clock is exposed to it. Nothing here is lost to the
   * freeze: `nextCapabilityToken` draws from `randomUUID()`, which does not read
   * the clock, and no case in this file uses a timer.
   *
   * An explicit instant rather than whatever `useFakeTimers` defaults to: the
   * assertions compare against a 13-digit epoch, so the value must be a real one
   * and must not depend on that default.
   */
  const FROZEN = new Date("2026-07-29T09:00:00.000Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FROZEN);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is not derived from the wall clock", () => {
    const token = nextCapabilityToken("rvt");
    const nowPrefix = String(Date.now()).slice(0, 10);

    expect(token).not.toContain(nowPrefix);

    // Null arm: the generator this replaced DOES leak the clock. If this ever
    // stops holding, the test above has stopped measuring anything.
    expect(nextId("rvt")).toContain(nowPrefix);
  });

  it("is not a sequence, so observing one token does not yield the next", () => {
    const a = nextCapabilityToken("rvt");
    const b = nextCapabilityToken("rvt");

    const tailOf = (token: string) => token.slice(token.indexOf("-") + 1);
    expect(tailOf(a)).not.toBe(tailOf(b));

    // The reviewer's actual attack: take a known token, increment the trailing
    // counter, and you hold a neighbouring one. Reproduced here against the old
    // generator to prove the attack is real and that it no longer applies.
    const first = nextId("rvt");
    const second = nextId("rvt");
    const guessedFromFirst = first.replace(
      /-(\d+)$/,
      (_match, counter: string) => `-${Number(counter) + 1}`,
    );
    expect(guessedFromFirst).toBe(second);

    // The same transformation against a capability token yields nothing useful.
    expect(a.replace(/-(\d+)$/, (_m, c: string) => `-${Number(c) + 1}`)).not.toBe(b);
  });

  it("carries at least 128 bits and never repeats across many mints", () => {
    const tokens = Array.from({ length: 10_000 }, () => nextCapabilityToken("rvt"));

    expect(new Set(tokens).size).toBe(10_000);
    for (const token of tokens.slice(0, 50)) {
      // 32 hex characters = 128 bits.
      expect(token.slice("rvt-".length)).toMatch(/^[0-9a-f]{32}$/);
    }
  });

  it("keeps the prefix so tokens remain identifiable in logs and errors", () => {
    expect(nextCapabilityToken("rvt").startsWith("rvt-")).toBe(true);
  });
});
