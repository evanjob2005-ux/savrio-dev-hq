// Scope guard for Task 1E-6.
//
// The review subsystem sits next to the execution spine and reaches the agent
// registry, so it is the natural place for provider concepts to creep back in.
// ADR-0001 D4 keeps Phase 1 on deterministic simulated agents, and live-provider
// work is deferred, so this test fails the build rather than letting the boundary
// erode quietly.

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "../..");

/** Files introduced or reshaped by the review subsystem. */
const REVIEW_SUBSYSTEM = [
  "types/domain/review.ts",
  "types/contracts/review-store.ts",
  "lib/dev-hq/adapters/dev-review-store.ts",
  "lib/dev-hq/review-service.ts",
  "trigger/agent-review.ts",
  "app/api/dev-hq/internal/review/complete/route.ts",
];

/** Concepts that belong to the deferred provider work, not to Sprint 1E-6. */
const OUT_OF_SCOPE = [
  "deepseek",
  "providerattempt",
  "provider_uncertain",
  "adr-0003",
  "deepseek_api_key",
  "openai",
  "anthropic",
  // "inference" is deliberately absent: the reviewer's own documentation says it
  // performs no real AI inference, and a guard that trips on a disclaimer would
  // punish the comment that states the invariant.
];

describe("review subsystem scope", () => {
  it("ships every file it claims", () => {
    for (const file of REVIEW_SUBSYSTEM) {
      expect(fs.existsSync(path.join(ROOT, file)), `${file} is missing`).toBe(
        true,
      );
    }
  });

  it("introduces no provider or live-inference concepts", () => {
    for (const file of REVIEW_SUBSYSTEM) {
      const source = fs.readFileSync(path.join(ROOT, file), "utf8").toLowerCase();
      for (const concept of OUT_OF_SCOPE) {
        expect(source.includes(concept), `${file} mentions "${concept}"`).toBe(
          false,
        );
      }
    }
  });

  it("keeps review orchestration out of the Execution Manager", () => {
    const manager = fs.readFileSync(
      path.join(ROOT, "lib/dev-hq/execution-manager.ts"),
      "utf8",
    );
    // The manager persists the policy as a field but owns none of the loop: no
    // review store, no iteration counting, no escalation, no reviewer dispatch.
    for (const forbidden of [
      "reviewStore",
      "MAX_REVIEW_ITERATIONS",
      "reviewIdFor",
      "review-service",
      "REVIEW_EVENT_TYPE",
      "raiseReviewExhaustionEscalation",
    ]) {
      expect(
        manager.includes(forbidden),
        `execution-manager.ts references ${forbidden}`,
      ).toBe(false);
    }
    // It does carry the policy through, which is why the field is on Execution.
    expect(manager).toContain("reviewPolicy");
  });

  it("keeps escalation creation in the escalation service", () => {
    const review = fs.readFileSync(
      path.join(ROOT, "lib/dev-hq/review-service.ts"),
      "utf8",
    );
    // The review service establishes exhaustion and delegates; it never creates
    // an escalation record itself.
    expect(review).not.toContain("createEscalation");
    expect(review).toContain("raiseReviewExhaustionEscalation");
  });
});
