// P2-33. Direct coverage for the Dev HQ routes whose error mapping was brought
// onto the shared shape, and which had no direct route test before.
//
// The claim under test, stated so it can be falsified (STD-CTRL-001 rule 6):
// for every route below, a malformed request is answered 4xx and never 500, and
// no 500 body carries the failing error's own message.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { triggerMock } = vi.hoisted(() => ({ triggerMock: vi.fn() }));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: { trigger: triggerMock },
}));

import { INTERNAL_ERROR_MESSAGE } from "@/app/api/dev-hq/_lib/route-errors";
import { GET as getAgents } from "@/app/api/dev-hq/agents/route";
import { GET as getApprovals } from "@/app/api/dev-hq/approvals/route";
import { POST as approve } from "@/app/api/dev-hq/approvals/[id]/approve/route";
import { POST as reject } from "@/app/api/dev-hq/approvals/[id]/reject/route";
import { GET as getEscalations } from "@/app/api/dev-hq/escalations/route";
import { POST as abandon } from "@/app/api/dev-hq/escalations/[id]/abandon/route";
import { POST as accept } from "@/app/api/dev-hq/escalations/[id]/accept/route";
import { POST as executiveReview } from "@/app/api/dev-hq/internal/executive-review/route";
import { POST as fail } from "@/app/api/dev-hq/internal/fail/route";
import { getDevHqAdapters, resetDevHqAdapters } from "@/lib/dev-hq/adapters";
import { createFounderRequest } from "@/lib/dev-hq/founder-request-service";
import { resetDevHqStore } from "@/lib/dev-hq/store";

const TOKEN = "test-internal-token";
const HEADER = "x-dev-hq-internal-token";

function internalRequest(url: string, body: unknown, raw?: string): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", [HEADER]: TOKEN },
    body: raw ?? JSON.stringify(body),
  });
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("Dev HQ route error mapping", () => {
  const originalToken = process.env.DEV_HQ_INTERNAL_TOKEN;

  beforeEach(() => {
    resetDevHqStore();
    resetDevHqAdapters();
    triggerMock.mockReset();
    triggerMock.mockResolvedValue({ id: "run-test-1" });
    process.env.DEV_HQ_INTERNAL_TOKEN = TOKEN;
  });

  afterEach(() => {
    if (originalToken === undefined) delete process.env.DEV_HQ_INTERNAL_TOKEN;
    else process.env.DEV_HQ_INTERNAL_TOKEN = originalToken;
  });

  describe("read-only collections", () => {
    it("serve their collection on the happy path", async () => {
      expect((await getAgents()).status).toBe(200);
      expect((await getApprovals()).status).toBe(200);
      expect((await getEscalations()).status).toBe(200);
    });

    it("answer a fixed, non-leaking 500 when their adapter throws", async () => {
      const leak = "ENOTFOUND agent-registry.internal.savrio:8443";
      const injected = new Error(leak);
      const logged = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.spyOn(
        getDevHqAdapters().agentProvider,
        "listAgents",
      ).mockRejectedValue(injected);

      const response = await getAgents();
      const text = await response.text();

      // Previously this route had no `catch` at all, so the rejection escaped to
      // the framework: a different body shape, and in development the stack.
      expect(response.status).toBe(500);
      expect(text).not.toContain(leak);
      expect(JSON.parse(text)).toEqual({ error: INTERNAL_ERROR_MESSAGE });
      expect(logged).toHaveBeenCalledWith(expect.any(String), injected);
    });
  });

  describe("POST /api/dev-hq/internal/executive-review", () => {
    it("answers 400 for a body that is not JSON, not 500", async () => {
      const response = await executiveReview(
        internalRequest(
          "http://localhost/api/dev-hq/internal/executive-review",
          null,
          "{ not json",
        ),
      );
      expect(response.status).toBe(400);
      expect(await response.text()).not.toContain("JSON.parse");
    });

    it("answers 400 for a missing or blank executionId", async () => {
      for (const body of [{}, { executionId: "" }, { executionId: "   " }]) {
        const response = await executiveReview(
          internalRequest(
            "http://localhost/api/dev-hq/internal/executive-review",
            body,
          ),
        );
        expect(response.status, JSON.stringify(body)).toBe(400);
      }
    });

    it("null arm: a real executionId still runs the review", async () => {
      const created = await createFounderRequest({
        title: "Ship Mission Control",
        description: "Deliver the founder request workflow with durable state.",
        priority: "High",
      });

      const response = await executiveReview(
        internalRequest(
          "http://localhost/api/dev-hq/internal/executive-review",
          { executionId: created.execution.id },
        ),
      );

      expect(response.status).toBe(200);
      expect((await response.json()).passed).toBe(true);
    });
  });

  describe("POST /api/dev-hq/internal/fail", () => {
    it("answers 400 for a body that is not JSON, not 500", async () => {
      const response = await fail(
        internalRequest(
          "http://localhost/api/dev-hq/internal/fail",
          null,
          "{ not json",
        ),
      );
      expect(response.status).toBe(400);
    });

    it("answers 400 for a decision outside the vocabulary", async () => {
      const response = await fail(
        internalRequest("http://localhost/api/dev-hq/internal/fail", {
          executionId: "exec-1",
          approvalId: "apr-1",
          decision: "banana",
        }),
      );
      expect(
        response.status,
        "`decision` was cast, not checked -- the same hole 9c1420f closed on the " +
          "finalize route, where a cast decision returned 200 and wrote an outcome.",
      ).toBe(400);
      expect((await response.json()).error).toContain("approved, rejected");
    });

    it("answers 400 when only half the continuation identity is supplied", async () => {
      const response = await fail(
        internalRequest("http://localhost/api/dev-hq/internal/fail", {
          executionId: "exec-1",
          decision: "approved",
        }),
      );
      expect(response.status).toBe(400);
    });
  });

  describe("founder decision routes", () => {
    it("answer a fixed, non-leaking 500 for an unknown approval", async () => {
      // NOT a 404. `decideFounderRequest` throws a plain Error for a missing
      // approval, and retyping it lives in `lib/dev-hq/founder-request-service.ts`,
      // outside this change's edit boundary. What is closed here is the leak: the
      // 500 no longer echoes the service's own message.
      for (const [name, handler] of [
        ["approve", approve],
        ["reject", reject],
      ] as const) {
        const logged = vi.spyOn(console, "error").mockImplementation(() => {});
        const response = await handler(
          new Request(`http://localhost/api/dev-hq/approvals/apr-missing/${name}`, {
            method: "POST",
          }),
          params("apr-missing"),
        );
        const text = await response.text();

        expect(response.status, name).toBe(500);
        expect(text, name).not.toContain("apr-missing");
        expect(JSON.parse(text)).toEqual({ error: INTERNAL_ERROR_MESSAGE });
        expect(logged).toHaveBeenCalled();
        logged.mockRestore();
      }
    });
  });

  describe("escalation resolution routes", () => {
    it("answer 404 for a missing escalation on every verb", async () => {
      for (const [name, handler] of [
        ["abandon", abandon],
        ["accept", accept],
      ] as const) {
        const response = await handler(
          new Request(
            `http://localhost/api/dev-hq/escalations/esc-missing/${name}`,
            { method: "POST" },
          ),
          params("esc-missing"),
        );
        expect(response.status, name).toBe(404);
        expect((await response.json()).error).toContain("Escalation not found");
      }
    });
  });
});
