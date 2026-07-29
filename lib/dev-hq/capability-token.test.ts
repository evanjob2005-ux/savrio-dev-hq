import { describe, expect, it } from "vitest";

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
