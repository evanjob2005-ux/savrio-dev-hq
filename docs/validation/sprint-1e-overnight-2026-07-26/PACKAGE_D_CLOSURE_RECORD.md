# Sprint 1F Package D — FD-5 Exhaustive Mutating-Route Audit — Closure Record

**Author:** Main Coordinator. Documentation only; this file changes no executable behaviour.
**Date:** 2026-07-27
**Package status:** **INDEPENDENTLY VERIFIED AND CLOSED.** No implementation commit.
**Audited source candidate:** commit `f5b702886182d4e3af42716c26f34f60fb360229`, tree `62579c4eb7d106205f92ca6d831a5a9ab9974a71`, branch `feature/dev-hq-operating-system`

---

# 0. Provenance limitation — read this before the findings

**The coordinator does not hold the original auditor's report or the original Codex
review document.** Both ran in separate sessions and reached the coordinator as
**Founder-transmitted results**, not as artifacts the coordinator read directly.
Every verdict, count, severity, and finding text below is reproduced as transmitted.

**Codex recorded a matching limitation of its own:** it could not verify the original
auditor's exact command history, because **no immutable audit report or transcript
exists in the candidate tree**. What Codex did instead is stronger than transcript
review — it **independently reproduced every substantive count and control-path
finding from the exact authorized commit**, rather than checking the auditor's work
against the auditor's own account of it.

**What the coordinator verified first-hand** is recorded in §3 and is independent of
both transmitted texts.

**Process consequence, recorded for future packages:** a read-only audit that writes
nothing leaves no durable artifact to review. This record is the closest durable
substitute and was created after the fact. Future read-only audits should either
return a transcript for preservation or accept that verification must be by
independent reproduction, as it was here.

---

# 1. Verdicts

| Gate | Verdict |
|---|---|
| Independent auditor (separate read-only session) | `AUDIT COMPLETE — READY FOR INDEPENDENT VERIFICATION` |
| Codex Independent Code Review | **`APPROVE WITH NON-BLOCKING FINDINGS`** |

**Package D is closed.** It produced evidence, not code. There is no implementation
commit and no source change. The audited candidate was not modified, amended, rebased,
retagged, or otherwise altered.

---

# 2. Independently reproduced counts

Codex re-derived these from the authorized commit. The coordinator separately
re-derived the same figures. **Three independent enumerations agree.**

| Measure | Count |
|---|---|
| `route.ts` files under `app/api/**` | 21 |
| Real `"use server"` actions | 1 (`lib/dev-hq/actions.ts`) |
| **Total entry units** | **22** |
| Mutating units | 17 |
| Founder-authority mutating units | 7 |
| Mutating units protected by the shared internal token | 10 |
| Mutating units without verified authentication | 7 |
| Mutation boundaries with inadequate idempotency or replay enforcement | 3 |

The two sets of seven overlap in six: six Founder-authority units have no
authentication, and the seventh (`internal/finalize`) has token-only authentication.
The seventh unit lacking authentication is the Server Action, which is not
Founder-authority.

---

# 3. Verified headline finding

**The repository contains no mechanism capable of establishing a request-derived
authenticated Founder principal, yet seven units record Founder actions or decisions
as fact.**

Six of those Founder-authority mutation units have no authentication at all. The
seventh, `internal/finalize`, authenticates only *possession of the shared internal
token* and then accepts a **client-supplied decision** while the service records a
**hardcoded Founder actor**.

Coordinator first-hand corroboration, traced to source:

| Claim | Evidence |
|---|---|
| Hardcoded Founder identity | `lib/dev-hq/founder-request-service.ts:495` and `:534` — `decidedByUserId: DEV_HQ_ACTORS.founderUserId`, resolving to `FOUNDER_USER_ID` at `lib/dev-hq/constants.ts:8` |
| Approve route carries no actor | `app/api/dev-hq/approvals/[id]/approve/route.ts` reads only the URL `id`, has no request body, no auth import, and calls `approveFounderRequest(id)` |
| Escalation routes carry no actor | `app/api/dev-hq/escalations/[id]/accept/route.ts` calls `resolveEscalation(id, "accept")`; no actor crosses the route boundary |
| `internal/finalize` | imports `rejectInternalDevRequest` (shared token only); accepts `decision?: "approved" \| "rejected"` at line 13 and forwards it at line 25 |
| Sole genuine authorization pattern | `app/api/dev-hq/internal/review/complete/route.ts` — two independent gates: shared token authenticates the caller as a worker, per-review `callbackToken` authorizes the specific review |

---

# 4. Accepted finding register — final severities

| ID | Finding | Status | **Final severity** |
|---|---|---|---|
| **FD5-01** | `approvals/[id]/approve` and `approvals/[id]/reject` have no authentication or authorization, complete durable workflow wait tokens, and record hardcoded Founder approval or rejection | CONFIRMED | **CRITICAL** |
| **FD5-02** | `escalations/[id]/accept`, `/revise`, `/abandon` have no authentication or authorization and record hardcoded Founder attribution; `revise` can create and dispatch a real durable execution | CONFIRMED | **CRITICAL** |
| **FD5-03** | `internal/finalize` allows a holder of the shared internal token to submit a decision that is then attributed to the Founder | CONFIRMED | **HIGH** |
| **FD5-04** | `founder-requests` is unauthenticated, records fabricated Founder ownership and provenance, accepts client-controlled text, and has no idempotency protection; each replay can create another project, task, execution, workflow record, and Trigger.dev run | CONFIRMED | **HIGH** |
| **FD5-05** | Browser-invoked Server Action outside the `proxy.ts` matcher — see §5 | **PARTIALLY CONFIRMED** | **MEDIUM** *(corrected down from HIGH)* |
| **FD5-06** | 16 of 17 mutating units contain no genuine role, permission, ownership, or resource-capability authorization decision; the only verified resource-scoped pattern is the per-review callback capability in `internal/review/complete` | CONFIRMED | **HIGH** |

## 4.1 Medium findings

| Finding | Status |
|---|---|
| Public API mutation routes contain no designed CSRF or cross-origin protection | VERIFIED |
| The shared internal token is static, unscoped, non-expiring, non-rotating, and carries no per-worker identity | VERIFIED |
| `idempotencyKey` is optional at both dispatch boundaries | VERIFIED |
| `internal/approval-gate` does not verify that the supplied approval belongs to the supplied execution before attaching the wait token | VERIFIED |

## 4.2 Low and informational findings

| Finding | Status |
|---|---|
| Read-only routes expose broad operational state without authentication — **the production proxy currently blocks the API surface** | VERIFIED |
| Client-controlled text can enter durable timeline or attempt records | VERIFIED |
| Some replay and concurrency guarantees depend on the current single-process in-memory model | VERIFIED |

The last item is informational **today** and becomes **CRITICAL** if ADR-0003 selects a
multi-instance or serverless hosting target. It is a required input to that decision,
not a deferred cleanup.

---

# 5. FD5-05 — corrected classification, with qualifications preserved

**Earlier classification: HIGH. Final classification: PARTIALLY CONFIRMED — MEDIUM.**

The coordinator raised the severity question during reconciliation and routed it to
independent review rather than resolving it unilaterally. Codex ruled. The correction
is recorded here in full because a severity that moves must leave a trail.

**All five qualifications are binding and must travel with this finding:**

1. **`proxy.ts` does not cover Server Actions.** Its matcher is
   `/api/dev-hq/:path*`; a Server Action POSTs to a page route and structurally
   cannot be matched.
2. **The Server Action has its own production guard** —
   `lib/dev-hq/actions.ts:44` returns before any mutation when
   `NODE_ENV === "production"`.
3. **No present production mutation exposure was verified through that path.**
4. **Duplicated and non-uniform protection remains a medium architectural and
   maintenance risk.** Two independently maintained guards mean a future action is one
   forgotten check away from an unguarded mutating surface.
5. **The current UI caller supplies an idempotency key, but the contract does not
   require one.** The safety property is a caller convention, not an enforced contract.

**Additional verified context recorded by Codex:**

- The Server Action has **no user authentication or authorization**.
- It **can mutate state and trigger durable work outside production**.
- **Next.js supplies framework-level same-origin protection for Server Actions.**
  This is **not** user authentication or authorization, and **does not apply to custom
  API Route Handlers** — which is where FD5-01, FD5-02, FD5-03, and FD5-04 live.

**Record the architectural concern as a non-uniform and duplicated production
boundary, not as a current HIGH production vulnerability.**

---

# 6. Production barriers — verified intact, must not be weakened

Three independent production blocks exist and were verified present and unmodified at
the audited commit:

| Barrier | Location | Covers |
|---|---|---|
| API surface kill-switch | `proxy.ts:11`, matcher `/api/dev-hq/:path*` | the entire public and internal API surface |
| Internal worker guard | `lib/dev-hq/internal-guard.ts:13` | the 10 `internal/*` routes |
| Server Action guard | `lib/dev-hq/actions.ts:44` | `dispatchAgentExecutionAction` |

**None of these may be weakened, removed, bypassed, or consolidated until approved
replacement authentication and authorization exist.**

The consolidation prohibition is deliberate and may look counter-intuitive against
FD5-05's non-uniformity finding. Unifying the boundary is the *right* eventual fix, but
performing it now would mean editing all three barriers while nothing else protects the
surface. **Uniformity is an ADR-0003 outcome, not a pre-ADR refactor.**

---

# 7. What Package D did not do

- No implementation, no remediation, no source change.
- No ADR authored.
- The audited candidate `f5b7028` was **not** modified, amended, rebased, retagged, or
  otherwise changed.
- The full audit artifact was **not** placed inside the audited candidate.
- No workflow, ruleset, required check, dependency, lockfile, or configuration changed.
- No Track B work begun.

---

# 8. Standing blocks — unchanged by this closure

| Item | Status |
|---|---|
| Track B implementation | **BLOCKED** |
| Authentication implementation | **BLOCKED** until ADR-0003 is ratified and implementation authority is assigned |
| Deployment to any phone-reachable or externally reachable environment | **BLOCKED** |
| Phone-accessible Founder actions | **BLOCKED** |
| DESIGN-001 implementation | **UNAUTHORIZED** |

**Package D discharges an evidence prerequisite. It authorizes nothing.**
