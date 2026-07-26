# CR-1E Independent Review — Sprint 1E Overnight Validation

**Run:** sprint-1e-overnight-2026-07-26
**Reviewer:** CR-1E (Independent Code Reviewer), read-only
**Target:** `sprint-1e-baseline` / `62f629128e5092f593ff494cd729fe516694bbde`
**Method:** static source tracing. No scenario executed, no gate re-run.
**Independence:** reached without input from LSE-1E or AR-1E.

> **Coordinator note on evidence status.** CR-1E's `CONFIRMED` label means it followed
> the exact control flow through the cited lines. It does **not** mean the failure was
> observed. Per the run's fix protocol, reproduction is required before any fix is
> applied. All findings below are therefore **unreproduced** pending LSE-1E.

---

## Findings

| ID | Sev | Category | Confidence | Location |
|---|---|---|---|---|
| F1 | Major | Dead recovery path | CONFIRMED (static) | `execution-manager.ts:525-529`, `internal/execution/running/route.ts:22-25`, `trigger/agent-execution.ts:10-21,60-72` |
| F2 | Major | Lost audit records | CONFIRMED (static) | `agent-execution-service.ts:963-1021` |
| F3 | Major→**Downgraded** | Authorization | **PARTLY REFUTED — see below** | `escalations/[id]/{revise,accept,abandon}/route.ts` |
| F4 | Major | Callback idempotency | CONFIRMED (static) | `execution-manager.ts:556-568` |
| F5 | Minor | Lost update on task status | CONFIRMED (static) | `escalation-service.ts:508-515`, `:86-95` |
| F6 | Minor | Performance | CONFIRMED (static) | `adapters/dev-event-logger.ts:27` |
| F7 | Minor | Union permits invalid states | CONFIRMED (static) | `types/contracts/execution-runner.ts:31-38` |
| F8 | Minor | Unsound non-null assertion | PLAUSIBLE | `review-service.ts:501,505,777` |
| F9 | Minor | Id collision | PLAUSIBLE | `lib/dev-hq/id.ts:1-6` |
| F10 | Minor | Unbounded growth (`eventKeys`) | CONFIRMED (static) | `store.ts:218-228` |
| F11 | Minor | Unvalidated enum (pre-1E code) | CONFIRMED (static) | `internal/finalize/route.ts:11-28` |
| F12 | Minor | Unbounded recovery cycling | PLAUSIBLE | `agent-execution-service.ts:478-488` |

CR-1E states none of F1–F12 overlaps the twelve follow-ups already recorded in
`SPRINT_1E_COMPLETION_NOTES.md`.

---

## F3 — Coordinator verification and partial refutation

**CR-1E claimed:** the founder escalation-resolution routes have no auth and no
production block; "there is no `middleware.ts` in the repository (verified)"; "`next
build` builds these routes; they are not disabled in production."

**Coordinator finding — the production-exposure claim is FALSE.**

`middleware.ts` genuinely does not exist, but Next.js 16 uses **`proxy.ts`**, which is
present at the repo root:

- `proxy.ts:20-22` — `export const config = { matcher: "/api/dev-hq/:path*" }`
- `proxy.ts:11-17` — returns HTTP 403 for the entire Dev HQ API surface when
  `NODE_ENV === "production"`
- Phase 1 build output independently confirms it is active: `ƒ Proxy (Middleware)`

The routes are therefore **not** reachable in production. CR-1E reached a correct
observation (no per-route guard) via an incomplete search, and drew an incorrect
severity conclusion from it.

**What survives.** In development the three routes plus `GET /escalations` are
genuinely unauthenticated, so any process able to reach the dev host can abandon an
escalation or trigger a revision dispatch. This is a real property of the system —
but it is **already documented as a deliberate accepted posture**, in the very file
CR-1E missed:

> `proxy.ts:3-9` — *"Dev HQ is development-only. Nothing under `/api/dev-hq/*`
> authenticates the caller yet — including the founder approve/reject endpoints — so
> the whole surface fails closed in production until a real authentication boundary
> exists."*

**Reclassified:** Major → **Minor / known-accepted**. Not a new Sprint 1E
authorization gap. Legitimate input to the Sprint 1F authentication boundary.

---

## Areas explicitly examined and cleared by CR-1E

Recorded because coverage claims matter as much as findings:

1. Store-level atomicity claims — every "no await between check and write" comment
   verified true across `store.ts`, `dev-review-store.ts`, `dev-escalation-store.ts`,
   `dev-task-repository.ts`, `execution-manager.ts`. No suspension point inside any
   guarded region.
2. Post-await re-read in `performDispatch` (`agent-execution-service.ts:381-398`) —
   genuinely handles the fast-worker-claims-during-`tasks.trigger` hazard.
3. `applyFailedAttempt` keeps `agentId`/`assignmentId` consistent in both branches.
4. Stale-callback guards on `running` and `complete` correct in both directions.
5. Review-iteration bound traced end to end; `MAX_REVIEW_ITERATIONS = 3` holds,
   counter fixed at creation so sweeps and replays cannot consume it.
6. Execution-id namespace proven collision-free across all four generators.
7. `PublicReview` secret-projection boundary enforced by the type system; all paths
   from `Review` to a response project correctly. No third path exists.
8. Callback-token authorization on the review surface validates against durable state.
9. Zero `any`, `as any`, `as unknown as`, `@ts-ignore`, `@ts-expect-error` in
   non-test source. Four non-null assertions total (three are F8).
10. `reconcileQueuedDispatches` stale-snapshot risk investigated and cleared, though
    safety rests on a non-local invariant.
11. Provider-pin integrity — a retry cannot cross providers.
12. Escalation dedupe under resolution — a post-resolution sweep cannot re-transition
    a resolved task.

---

## CR-1E verdict

> "The baseline is sound in its core — but I do not clear it unconditionally."

- **Blocks commit: NO.**
- **Should be fixed before Sprint 1F extends the execution surface:** F1, F2, F3.
- Identified blind spot: the layer above the state machine — correct-but-throwing
  primitives crossing an HTTP boundary into a durable worker with
  `retries.enabledInDev: false`. F1 and F4 are two instances.
- F1 called out as the sharpest case: the test suite at
  `agent-execution-service.test.ts:1450-1499` *pins* the throwing behavior that makes
  the worker's documented stand-down path dead code — a green test that is worse than
  no test.

---

## CR-1E's declared limitations (recorded verbatim in substance)

1. Re-ran no gate; attests to none of Phase 1.
2. Executed nothing — every finding is a static trace.
3. Did **not** read ADR-0001 or ADR-0002; asserts no ADR violation. Architecture
   compliance is AR-1E's assignment.
4. Did **not** verify Trigger.dev's actual idempotency-key semantics; several
   correctness arguments depend on that platform behavior, taken as stated.
5. Did **not** review the UI layer.
6. Did **not** systematically assess test-suite quality; read one test in full.
7. `handbooks/INDEPENDENT_CODE_REVIEWER.md` does not exist though
   `agents/independent-code-reviewer/AGENT.md` references it — recorded as a
   governance gap.
8. `standards/` has no NAMING, LOGGING, or ERROR_HANDLING standard; F2 and F11 were
   judged against sibling-code consistency instead.

**Coordinator assessment of these limitations:** items 1–3 are appropriate scope
discipline, not deficiencies. Item 4 is a genuine open dependency. Item 6 means the
test-quality claim in F1 is single-instance, not systematic. Items 7–8 are governance
findings independent of the code and are carried to the final report.
