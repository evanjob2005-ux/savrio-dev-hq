# Sprint 1F Package E — Architecture Decision Brief and Reconciliation Record

**Author:** Main Coordinator. Documentation only; this file changes no executable behaviour.
**Date:** 2026-07-27
**Anchor:** commit `0ab3ce1bf39c6bfacc72a3ee4d99181abcce366c`, tree `9e723810c120fc65aea3102354c543477b83345e`
**Status:** Advisory brief preserved. Four Founder decisions ratified. ADR-0003 not authored, not numbered, not ratified.

**Formatting rule, binding on this file and every future record.** No load-bearing
content is preserved only inside a wide Markdown table. Substantive content is in
numbered lists. Tables appear only where every cell is short. This rule exists because
three transmissions in this project lost content to table reflow — see §12.

---

# 0. What this record is, and what it is not

Package E was a **read-only advisory** produced by the Claude Architecture Reviewer at
the anchor above. It ratifies nothing and authorizes nothing.

This record preserves:

1. The clean Package E retransmission's recommendations and reasoning.
2. The Main Coordinator's final reconciliation, including two corrections the brief did
   not carry.
3. The H-AQ infrastructure qualification from the Trigger.dev verification.
4. The Founder decisions made on 2026-07-27.
5. Every evidence limitation, unchanged.

**It is not an ADR.** `docs/decisions/` contains ADR-0001 and ADR-0002 only, both
byte-unchanged at this anchor — blobs `e88cbbd16f1f58e9278ce1ed4e7e79f775e361d9` and
`ea8c9de90f009dcb224e17e22f4c8d97ed2db623`. ADR-0002 §E5 remains unamended. No ADR-0003
file exists. "ADR-0003" names a subject; numbers are assigned centrally.

---

# 1. Founder decisions ratified 2026-07-27

## 1.1 E-3 — Persistence posture: APPROVED (P-A)

1. Sprint 1F Dev HQ state remains **explicitly non-durable and in-memory**.
2. A **mandatory server-supplied process-start marker** must distinguish restart-cleared
   state from genuinely empty state. This is an architectural requirement on the
   consumer contract, not a UX preference.
3. Mission Control **must not claim to be a durable system of record**.
4. Audit history and idempotency guarantees are **explicitly bounded by the current
   process lifetime**, and that bound must be disclosed rather than implied.

Corresponds to FD-4, MCL Q-1, entry package D-2/Q-1.

## 1.2 E-4 — Sprint 1C-B branch: APPROVED (do not adopt)

The unmerged `feature/sprint-1c-b-supabase-persistence` branch (`3d1665f`) is **not** the
Sprint 1F persistence solution and is recorded as **verified not to be a usable
shortcut**. Verified reasons, each re-derived independently at the anchor:

1. **68 commits of divergence.** Merge-base is
   `d5e50e5e949b12ea119cd86ac6d2410ec5856424`; the anchor is 68 commits ahead;
   `git merge-base --is-ancestor 3d1665f 0ab3ce1b` returns false.
2. **Two contracts did not exist on the branch.** `git ls-tree 3d1665f types/contracts/`
   returns 11 files; the anchor has 13. `escalation-store.ts` and `review-store.ts` are
   absent entirely — both are Sprint 1E artifacts.
3. **Five adapters are missing** — `agent-provider`, `escalation-store`,
   `evidence-store`, `execution-runner`, `review-store`. Seven Supabase adapters exist.
4. **Six database tables are missing.** `supabase/migrations/0001_dev_hq_schema.sql`
   creates exactly seven tables: `projects`, `workflows`, `tasks`, `executions`,
   `workflow_runs`, `approvals`, `events`. There is no table for `agents`,
   `agent_assignments`, `evidence`, `escalations`, `reviews`, or `review_findings`.
5. **`DevHqState` grew from 7 to 12 collections** (8 to 13 total fields), adding
   `agents`, `evidence`, `escalations`, `reviews`, `reviewFindings`.
6. **Stale state-reader assumptions.** `types/contracts/state-reader.ts` is
   byte-identical across both trees — both declare `getState(): Promise<DevHqState>` —
   but the payload moved underneath the unchanged signature.
   `supabase-state-reader.ts` cannot satisfy the current `DevHqState`.
7. **Unresolved database concurrency semantics.** Supabase transaction and constraint
   behaviour would have to replace the compare-and-set that
   `lib/dev-hq/execution-manager.ts:508-526` currently gets from single-threadedness.
8. **Middleware provides session infrastructure but no route protection.**
   `3d1665f:lib/supabase/middleware.ts:11-13`, verbatim: *"This helper does NOT enforce
   authentication or redirect unauthenticated users — Sprint 1C-B ships auth
   infrastructure only, not route protection."* `getUser()` is called solely to trigger a
   token refresh and its result is discarded.

**Consequence, recorded so it is not re-litigated:** adopting this branch would not
resolve FD5-01, FD5-02, FD5-03, or FD5-04. This closes MCL Q-5's open sub-question.

**Coordinator correction preserved.** An earlier Main Coordinator sequencing report
framed this as "7 of 12 adapters," which is arithmetically true and architecturally
misleading. Verification moved the assessment in the safe direction. The "7 of 12"
framing must not appear in the ADR without all eight adoption costs stated alongside it.

## 1.3 E-5 — Supabase dependency gate: APPROVED (not required)

The `@supabase/supabase-js` dependency gate required by ADR-0002 D-E5 is **not required
for Sprint 1F under P-A**. Durable persistence is deferred to its own later workstream
and requires separate Founder authorization.

## 1.4 E-11 / A-P4 — Implementation authority: RESOLVED

Exact governance wording as ratified:

> Grant implementation authority to the Lead Software Engineer operating under the Main
> Coordinator and Work Management Layer.
>
> Scope and controls:
>
> - Authority applies only to explicitly Founder-authorized implementation packages.
> - The Main Coordinator defines and reconciles package scope.
> - Each implementation package must follow the approved branch, candidate, validation,
>   review, and promotion process.
> - This authority does not permit the agent to select or expand its own package scope.
> - It does not authorize Track B, Group 3, authentication implementation, deployment,
>   production-barrier modification, DESIGN-001 implementation, or any package that
>   remains blocked.
> - It does not authorize bypassing independent Codex code review, Claude architecture
>   review where required, CI gates, Founder-reserved decisions, protected-branch
>   controls, or repository preservation requirements.
> - Implementation results must return to the Main Coordinator.
> - Critical and high-risk findings stop progress.
> - Medium findings must be fixed before they spread or create rework.
> - Small low-risk findings should be recorded for later hardening and should not block
>   forward development.

**A-P4 is resolved under this governed, package-scoped implementation-authority model.**
It was previously the sharpest open prerequisite: the `lead-software-engineer` charter
required implementation while its definition granted no write capability. That
contradiction is now resolved by governance rather than by tool configuration, and the
resolution is bounded — authority exists only inside a Founder-authorized package whose
scope the Main Coordinator defines.

---

# 2. Package E recommendations — preserved

Every item below is an **advisory recommendation**. None is ratified except where §1
records a Founder decision.

1. **Topic 1 — Hosting.** H-A, one long-lived Node process on a trusted network.
   Prohibit serverless, multi-instance, horizontal scaling, and rolling or overlapping
   deployment. Stop-then-start only. **Superseded in form by H-AQ — see §5.**
   *Owner: Founder. Status: HELD OPEN pending V-2.*
2. **Topic 2 — Persistence.** P-A non-durable operational view plus a mandatory
   server-supplied process-start marker. **RATIFIED — see §1.1.**
3. **Topic 3 — Authentication.** A-A, a single strong credential with a signed,
   server-enforced, revocable session, structured so a passkey can be added later
   against the same session layer. Required properties: session validated server-side on
   every mutating request; cookie `HttpOnly`, `Secure`, `SameSite=Lax`; absolute TTL and
   idle timeout; immediate server-side revocation; recovery by secret rotation; a
   visibly labelled development principal, never a silent fallback; typed authentication
   failures that never surface as transport failures and never increment
   `consecutiveFailures`; session establishment and expiry emit evidence records.
   Departs from the Design Advisory's passkey-first ranking on revocation and recovery
   grounds — a single-principal system has no administrator to reset a lost passkey.
   *Owner: Founder. Status: OPEN (E-6, E-7).*
4. **Topic 4 — Authorization.** Z-B, principal-type authority plus resource-scoped
   capabilities. Founder decisions are authorized by principal type from the
   authenticated session at a shared choke point, **never by a bearer capability**.
   Worker callbacks may use per-resource capabilities minted server-side at dispatch.
   Generalize the `internal/review/complete` pattern to worker callbacks only —
   `execution/complete`, `execution/running`, `execution/heartbeat`, `fail`, and
   `approval-gate`. **Do not generalize it to Founder decisions:** a capability is a
   bearer credential, so using one for approvals would reproduce FD5-03 in a new form.
   Denial vocabulary: 401 unauthenticated; 403 authenticated but not permitted with a
   machine-readable reason and never a role claim; 404 genuinely absent; never a generic
   500. Every denial on a Founder-authority route emits a durable evidence record.
   *Owner: Architecture proposes, Founder ratifies. Status: OPEN (E-8).*
5. **Topic 5 — Transport.** T-C, tuned scoped conditional polling behind an SSE-ready
   projection contract: scoped endpoints, ETag / If-None-Match, a monotonic read-model
   version the client refuses to move backward from, and adaptive backoff. Reject T-B —
   Next.js Route Handlers do not support WebSocket upgrade. **AA-2's monotonic version is
   required under every option** and is a decision, not a recommendation. Departs from
   MCL Q-7's SSE-first ranking on sequencing, hosting-coupling, and cost-of-reversal
   grounds. *Owner: Architecture, Founder informed.*
6. **Topic 6 — Verified actor provenance.** Thread an authenticated `Principal` into
   eight sinks: approvals and rejections; escalation accept, revise, abandon; founder
   request creation; workflow finalization; events; message strings; evidence; audit and
   timeline. Remove **all three fabrication forms together** — see §4. Keep
   `FOUNDER_USER_ID` as the canonical identity the session resolves to; remove it as a
   default at the point of recording. Add a provenance discriminant —
   `authenticated_session`, `worker_token`, `system`, `unauthenticated_legacy` — and
   backfill pre-ADR records as `unauthenticated_legacy`. **Ordering constraint:** the
   principal must be resolved **before** `wait.completeToken`, because
   `lib/dev-hq/founder-request-service.ts:486-496` deliberately completes the wait token
   before recording the decision. *Owner: Architecture.*
7. **Topic 7 — CSRF and cross-origin.** Mandatory Origin and Referer validation on every
   state-changing Route Handler, failing closed when Origin is absent on a
   cookie-authenticated mutation. CSRF token as defence in depth for cookie-authenticated
   mutations. `SameSite=Lax`, not `Strict`, because `Strict` breaks notification-tap and
   deep-link entry. **No CORS** — no cross-origin consumer exists. Keep worker-header and
   Founder-cookie credential channels structurally separate. Next.js supplies Server
   Actions framework-level same-origin protection, which **is not authentication or
   authorization and does not extend to custom Route Handlers** — where FD5-01 through
   FD5-04 live. *Owner: Architecture.*
8. **Topic 8 — Internal worker identity.** Additive five-step migration: add worker
   identity alongside the shared token; mint per-resource capabilities at dispatch; prove
   each capability's negative control by execution; make capabilities required while
   keeping the shared token as the outer gate; only then consider replacing the shared
   token. **Defer step 5** — least security gain per unit of risk once steps 1 to 4 are
   done. *Owner: Architecture.*
9. **Topic 9 — Production boundary.** One shared policy module, **three separate
   enforcement points — never one**. They protect structurally different surfaces:
   `proxy.ts` runs in the proxy layer and structurally cannot match a Server Action.
   Prevent drift with a structural coverage test in the `lib/dev-hq/review-scope.test.ts`
   idiom, guard-by-construction wrappers, and CI enforcement. Removal order, outermost
   last: `internal-guard.ts`, then `actions.ts`, then `proxy.ts`. **No barrier changed
   now.** *Owner: Architecture.*
10. **Topic 10 — Idempotency.** Required keys or equivalent durable request identity at
    five boundaries: founder-request creation; approve; reject; escalation accept,
    revise, abandon; and both dispatch entry contracts. Duplicate returns the original
    result; conflicting replay returns 409; key scoped by the triple of principal, route,
    and resource. **No automatic retry of a Founder mutation** — the Design Advisory's
    rule is a safety control, not a UX preference. Client retains the same key through
    ambiguous outcomes. Under P-A, idempotency is **bounded by process lifetime** and
    that bound must be disclosed. Every deduplicated replay records evidence of the
    replay. *Owner: Architecture. Implementation is Group 3 and remains unauthorized.*
11. **Topic 11 — RAT-5 retention.** No disposition recommended. Verified: destructive
    200-event eviction cannot support authoritative audit history; `eventKeys` is never
    trimmed on eviction, so an evicted keyed event is permanently blocked from re-append.
    Under P-A only R-1 (no eviction) and R-5 (bounded retention with explicit
    `truncated` / `earliestRetained` / `hasMore` metadata) are reachable; R-2, R-3, and
    R-4 require durable persistence. Recommend fixing the `eventKeys` leak under any
    option — trimming keys in lockstep with ring eviction converts a permanent silent
    block into an ordinary bounded window. *Owner: Founder. Status: OPEN (E-9).*
12. **Topic 12 — Single-process consequences.** The ADR must record all ten guarantees
    that depend on one JavaScript process — global state handle, event dedupe, event ring
    integrity, dedupe index consistency, claim compare-and-set, agent capacity 1,
    lease/heartbeat/reclaim, dispatch idempotency, seed determinism, and test isolation.
    **Rolling deployments must be explicitly prohibited**: two overlapping versions are
    two processes, which silently falsifies `lib/dev-hq/store.ts:213-215`'s "concurrent
    writers cannot both append." Nothing throws; duplicate events simply appear.
    *Owner: Architecture states, Founder chooses topology.*

---

# 3. Correction — SEC-1 through SEC-14 are readable and binding

Package E recorded `SEC-1…SEC-14` as unverifiable, believing they lived in untracked
design documents. **They do not.** They are at
`docs/plans/SPRINT_1F_MISSION_CONTROL_LITE.md` §10.2, lines 707–720 — tracked at this
anchor since Package C, in a file Package E lists as read.

The acceptance bar is therefore available, and **ADR-0003's authentication and security
sections cannot be considered complete until they reconcile against all fourteen.**

Three fall outside every Package E topic and must not be lost:

1. **SEC-6 — CR-1, a pre-deployment blocker.** *"must be resolved before deployment."*
   See §4.2.
2. **SEC-7 — NB-1, a pre-fast-approval blocker.** *"must be resolved before fast approval
   flows ship."*
3. **SEC-12 — prompt injection is a live threat.** The conversation surface must never
   execute a state change without an explicit Founder confirmation naming the exact
   record and action, because it reads task descriptions, review findings, and evidence
   summaries — all attacker-influenced text in a real deployment. Commands must be
   structured and confirmed, never inferred and executed.

Also present and unaddressed by any topic: SEC-8 (push subscriptions are credentials),
SEC-9 (VAPID key handling), SEC-10 (rate limiting), SEC-11 (CSP including
service-worker scope), SEC-14 (independent security review before deployment).

---

# 4. Corrections and hazards added by reconciliation

## 4.1 Three forms of Founder-provenance fabrication, not two

Package D recorded hardcoded identity on the decision record. Verification found **three
distinct forms, all occurring on every Founder decision**:

1. **Hardcoded `decidedByUserId` on the decision record.**
   `lib/dev-hq/founder-request-service.ts:495` (approve) and `:534` (reject), resolving
   through `lib/dev-hq/constants.ts:8` to `lib/dev-hq/constants.ts:5`
   (`FOUNDER_USER_ID = "user-evan"`).
2. **Hardcoded `actorId` and `actorLabel` on the emitted event.**
   `lib/dev-hq/founder-request-service.ts:503-504` and `:542-543`.
3. **Human-readable timeline message strings with the name baked in.**
   `lib/dev-hq/founder-request-service.ts:502` — `` `Evan approved ${approval.title}.` ``
   — and `:541` — `` `Evan rejected ${approval.title}.` ``

**Form 3 matters independently.** Repairing Forms 1 and 2 alone would leave the rendered
audit timeline asserting *"Evan approved…"* regardless of who acted — a Founder
attribution that no field in the record supports. **All three must be removed together.**

## 4.2 CSPRNG requirement — the reference capability pattern is predictable

Package E's Topic 4 generalizes `internal/review/complete`'s per-review capability to
five further worker callbacks. Verified at the anchor:

1. `lib/dev-hq/review-service.ts:354` mints the capability via `nextId("rvt")`.
2. `lib/dev-hq/id.ts:3-6` returns `` `${prefix}-${Date.now()}-${sequence}` `` — a
   timestamp plus a monotonic counter. Predictable, not cryptographically random.

This is CR-1, already recorded in the reconciled decision record's matrix and as SEC-6,
with a one-line remediation (`crypto.randomUUID()`).

**The pattern is structurally correct and cryptographically weak.** Generalizing it
as-is would propagate a guessable bearer credential to five additional routes.
**Requirement: CSPRNG minting is a precondition of generalizing the capability
pattern**, and CR-1 joins Topic 9's preconditions as a tenth.

## 4.3 PKGE-HAZARD-1 — worker-bundle second store

**Classification: MEDIUM architectural constraint. Not a current defect. Not deferred
hardening.**

1. `trigger/agent-execution.ts:4-7` imports `simulateOutcome` — a **value**, not a type —
   from `lib/dev-hq/agent-execution-service.ts`. `trigger/agent-review.ts:4-7` imports
   `simulateReview` from `lib/dev-hq/review-service.ts` the same way.
2. `lib/dev-hq/agent-execution-service.ts:32` imports `getDevHqAdapters` from
   `@/lib/dev-hq/adapters`, which reaches the in-memory store.
3. Both helpers are **verified pure at this anchor** — `simulateOutcome`
   (`agent-execution-service.ts:58-62`) takes a string, runs two regex tests, returns a
   string. No store access. **There is no defect today.**
4. But the worker bundle pulls in a module graph that instantiates a **second,
   disconnected store**, and the failure mode is silent: a future helper that reads or
   writes state would operate on the wrong process-local store and produce wrong answers
   with no error.

**Constraint, binding on future edits:** worker-side imports must be limited to pure
functions, types, and explicitly safe shared utilities. The `review-scope.test.ts`
structural-test idiom is the natural enforcement mechanism.

## 4.4 Two supersessions to record in the ADR

1. MCL Q-7's SSE-first transport recommendation is **superseded** by T-C.
2. The Design Advisory's passkey-first authentication ranking is **superseded** by A-A.

Both departures are argued on axes the earlier documents did not weigh. The ADR must
state the supersession so the corpus does not carry two live positions.

---

# 5. H-AQ — hosting qualification from infrastructure verification

An independent read-only infrastructure verification at this anchor established that
**hosting option H-A is not viable as originally stated.** Corrected form:

> **H-AQ — one long-lived Dev HQ Node process on a trusted private network, with a
> co-located Trigger.dev Development worker, zero inbound ingress, and stop-then-start
> deployment only.**

**Status: PROVISIONAL INTENDED DIRECTION. NOT RATIFIED.** Held pending empirical
verification V-2.

## 5.1 Why H-A as stated does not work

1. **Trigger.dev Cloud deployed workers cannot reach a private host.** Not `localhost`,
   not RFC1918 addresses, not Tailscale-only addresses, not consumer-VPN hosts, not
   non-exposed SSH tunnels. The only official inbound-direction mechanism is Private
   Networking over AWS PrivateLink (Pro/Enterprise), which requires a customer-owned AWS
   VPC, an internal Network Load Balancer, and a VPC Endpoint Service — none of which
   describes an H-A host. Static outbound IPs are egress-only and confer no inbound
   reachability. Self-hosted workers attached to Trigger.dev Cloud are not a shipped
   feature.
2. **The architecture does not require deployed Cloud workers.** Trigger.dev's
   Development environment executes task code on the local machine over an outbound
   connection. With the worker co-located on the H-AQ host, every callback resolves to
   `http://127.0.0.1:3000` and **nothing is exposed to the internet**.

## 5.2 The production-guard conflict — the first blocker, ahead of networking

1. `package.json` declares `"start": "next start"`, which sets `NODE_ENV=production`.
2. `lib/dev-hq/internal-guard.ts:13-18` returns HTTP 403 for **all**
   `/api/dev-hq/internal/*` routes when `NODE_ENV === "production"`.
3. **Therefore a Dev HQ host started with `npm start` returns 403 to every Trigger.dev
   callback, regardless of network reachability.** Networking is the second blocker; the
   production guard is the first. Any H-AQ plan that runs `next start` is broken before
   Trigger.dev is considered.
4. The guard's other behaviours are sound and must be preserved: 503 when
   `DEV_HQ_INTERNAL_TOKEN` is unconfigured (fails closed), 401 on token mismatch.

**This is a deliberate safety barrier. Removing, weakening, conditioning, bypassing, or
consolidating it requires a Founder-ratified architecture decision and explicit
implementation authorization. It is not an engineering-level call.** Recorded as
decision **E-12**, held open.

## 5.3 Binding qualifications on H-AQ

1. **Co-located Development worker only.** A deployed Trigger.dev Cloud environment is
   incompatible with a private-only Dev HQ host.
2. **No public callback gateway under the current shared-token model.** It would expose
   nine state-mutating routes behind one static secret with no rotation, no expiry, no
   per-worker identity, no per-message signature, no replay protection, and a
   non-timing-safe comparison (`provided !== expectedToken`). Compromise permits forged
   execution completions, forged review outcomes, forged approval gating, and forged
   finalization — full control of the work-management state machine. **Not authorized as
   an implementation shortcut.**
3. **No serverless, no multi-instance, no horizontal scaling, no rolling or overlapping
   deployment.** Stop-then-start only.
4. **No weakening of any production barrier** — `proxy.ts:11`,
   `lib/dev-hq/internal-guard.ts:13`, `lib/dev-hq/actions.ts:44`.
5. **No assumption that long-lived `trigger dev` is production-supported.** Official
   documentation confirms it runs task code locally; no source endorses or prohibits
   continuous operational use. Absence of prohibition is not endorsement.
6. **Worker placement and Dev HQ network placement are coupled.** Either both sit on the
   private network, or Dev HQ must present a reachable authenticated endpoint.

## 5.4 Callback base-URL behaviour — preserved verbatim

`lib/dev-hq/constants.ts:145-147`:

```text
/** Base URL for Trigger.dev worker callbacks into the Next.js dev store. */
export function getDevHqBaseUrl(): string {
  return process.env.DEV_HQ_BASE_URL ?? "http://127.0.0.1:3000";
}
```

A single environment variable, a single loopback default, no per-environment logic. The
default is only correct when the worker is on the same host — the code as written
already assumes the co-located model. Authentication is a shared static bearer,
`x-dev-hq-internal-token`, from `DEV_HQ_INTERNAL_TOKEN`
(`lib/dev-hq/internal-headers.ts`).

## 5.5 The nine inbound callback routes — preserved inventory

All are POST, all under `/api/dev-hq/internal/`. Independently re-derived at the anchor.

1. `execution/running` — `trigger/agent-execution.ts`, claim check.
2. `execution/heartbeat` — `trigger/agent-execution.ts`, lease extension.
3. `execution/complete` — `trigger/agent-execution.ts`, outcome and retry budget.
4. `review/complete` — `trigger/agent-review.ts`, token-guarded review outcome.
5. `execution/reclaim` — `trigger/execution-sweeper.ts`, scheduled, cron `* * * * *`,
   `ttl: "50s"`.
6. `executive-review` — `trigger/founder-request-workflow.ts`.
7. `approval-gate` — `trigger/founder-request-workflow.ts`, publishes the wait token.
8. `finalize` — `trigger/founder-request-workflow.ts`.
9. `fail` — `trigger/founder-request-workflow.ts`, `onFailure`.

`execution/dispatch` exists and is guarded but is called only by tests at this anchor.
All four task modules build every call as `` fetch(`${getDevHqBaseUrl()}${path}`) `` —
`agent-execution.ts:11`, `agent-review.ts:11`, `execution-sweeper.ts:21`,
`founder-request-workflow.ts:19`.

**The callback dependency is load-bearing.** If it fails the system does not degrade
gracefully: claims do not land, heartbeats do not extend leases, completions do not
record outcomes, reclaim does not run, and approval waits never finalize. The single
`/api/dev-hq/internal/` prefix is a clean isolation boundary.

## 5.6 The unresolved question — classified HIGH

**Can a co-located Trigger.dev Development worker reliably support the founder-request
workflow, including `wait.forToken({ timeout: "7d" })` at
`trigger/founder-request-workflow.ts:70` and `:83`, across normal worker and CLI restarts
and during long-lived operation?**

**Classification: HIGH. Stop and resolve before ratifying H-AQ.** It is not a
performance question. `wait.forToken` with a seven-day timeout **is** the founder-approval
workflow. If a local worker cannot suspend that wait across a restart — or requires the
CLI to stay up for seven days — then under H-AQ the approval path either cannot survive a
reboot or holds a process open for a week. Either outcome breaks the headline Track B
journey.

Bounded scope: this blocks **H-AQ ratification and any deployment**. It does not block
E-3, ADR-0003 drafting on the other topics, or E-11.

Authorized for empirical resolution as **verification V-2**.

---

# 6. Founder decision register

1. **E-1 — Hosting target.** Recommendation H-AQ. **HELD OPEN** pending V-2.
2. **E-2 — Accept that H-AQ likely defers Web Push and the Sprint 1F headline phone
   journey.** Recommendation: accept as an explicit scope decision. **HELD OPEN**,
   follows E-1.
3. **E-3 — Persistence posture.** **APPROVED — P-A.** See §1.1.
4. **E-4 — Sprint 1C-B disposition.** **APPROVED — do not adopt.** See §1.2.
5. **E-5 — `@supabase/supabase-js` dependency gate.** **APPROVED — not required under
   P-A.** See §1.3.
6. **E-6 — Authentication mechanism.** Recommendation A-A, passkey-ready. **OPEN.**
   Corresponds to FD-5. Must reconcile against SEC-1 through SEC-14.
7. **E-7 — Approve the additive-only deviation.** Recommendation: approve; adding
   authentication necessarily changes existing route behaviour. **OPEN.**
8. **E-8 — May any non-Founder principal ever hold Founder approval authority?**
   Recommendation: no for Phase 1. **OPEN.**
9. **E-9 — RAT-5 retention disposition.** No recommendation. Now constrained by the E-3
   ruling: under P-A only R-1 and R-5 are reachable. **OPEN.**
10. **E-10 — Ratify the ADR subject once drafted.** **OPEN.**
11. **E-11 — Implementation authority (A-P4).** **RESOLVED.** See §1.4.
12. **E-12 — The `NODE_ENV === "production"` internal-route barrier under H-AQ.** Does
    the operational host run non-production mode, or is the guard conditioned by ratified
    decision? **No recommendation — Founder-reserved.** **HELD OPEN.** Note the shape of
    the trap: H-AQ as recommended requires running the operational host in non-production
    mode, meaning the production barriers that currently protect the surface are not
    active on the host actually in use.

The eight FD and ACR-001 X-8 decisions remain governed by the tracked
`docs/plans/SPRINT_1F_ENTRY_PACKAGE.md`. FD-4 corresponds to E-3 and is now decided.
FD-5 corresponds to E-6 and remains open.

---

# 7. Blocker matrix at this record

1. **H-AQ ratification — BLOCKED** by the V-2 verification (HIGH) and the E-12 guard
   decision.
2. **E-1 hosting ratification — BLOCKED**, as above.
3. **ADR-0003 drafting — partially unblocked.** Needs E-6. The hosting section must be
   drafted as provisional pending V-2.
4. **Authentication implementation — BLOCKED.** ADR-0003 unratified.
5. **Track B implementation — BLOCKED.** FD5-01 through FD5-06; the AA-1 ordering
   contract; DESIGN-001.
6. **Deployment, any externally reachable environment — BLOCKED.** FD5-01, FD5-02,
   FD5-04; SEC-6 (CR-1); SEC-14 independent security review; seven production
   high-severity dependency advisories; H-AQ unratified.
7. **Phone-accessible Founder actions — BLOCKED.** All of the above, plus SEC-7 (NB-1)
   and FD-26.
8. **DESIGN-001 implementation — UNAUTHORIZED.** FD-1 unratified.
9. **Public callback gateway — PROHIBITED** as an implementation shortcut under the
   current shared-token model.
10. **Group 3 and all other remediation — UNAUTHORIZED.** E-11 grants authority only
    inside an explicitly Founder-authorized package.

Production barriers verified intact and unaltered at this anchor: `proxy.ts:11`,
`lib/dev-hq/internal-guard.ts:13`, `lib/dev-hq/actions.ts:44`.

---

# 8. Evidence limitations — preserved unchanged

## 8.1 Package E architecture brief

1. Nothing was built, run, linted, type-checked, or tested. All evidence is static
   reading of git objects at the anchor.
2. The Package D auditor's report and the Codex review are not in the tree. Counts and
   source claims were independently re-derived instead, which is stronger than reading
   the accounts, but finding texts and severities are reproduced as transmitted and were
   not re-adjudicated.
3. Trigger.dev semantics are unverified — wait-token completion, `idempotencyKey`, and
   retry behaviour are taken as stated in ADR-0001 D1 and in code comments. The entry
   package records the same gap.
4. The 1C-B branch was not built. Adapter inventory, contract inventory, migration
   schema, `DevHqState` shape, and `middleware.ts` contents were verified; compilation
   was not attempted, so how many of the seven adapters still typecheck is unknown —
   only that `supabase-state-reader.ts` provably cannot satisfy the current
   `DevHqState`.
5. Untracked artifacts were unreadable: DESIGN-001, DESIGN-002, DESIGN-003,
   `MASTER_ROADMAP.md`, `PERMANENT_OPERATING_HANDBOOK.md`, ACR-001, CPU-001,
   `PHASE_2_PROGRAM_PLAN.md`, `RESEARCH_BACKLOG.md`. **Note the coordinator correction in
   §3: SEC-1 through SEC-14 were wrongly included in this list and are in fact
   readable.**
6. Hosting-platform behaviour is inferred, not verified. The rolling-deploy prohibition
   rests on general platform knowledge plus verified in-repository guarantees. Flagged as
   the highest-value item to confirm against the actual platform.
7. Worker code paths were not exhaustively traced for a case where a worker legitimately
   needs Founder authority. None found; none proven absent.
8. `lib/mission-control/useDevHqState.ts` was not read at the anchor. The 3-second poll
   and the `consecutiveFailures` collapse are reported-but-not-re-verified.

## 8.2 Infrastructure verification

1. The Package E document was not in the repository at the time of that verification —
   this record closes that gap.
2. Trigger.dev "Bring Your Own Cloud" could not be confirmed as a shipped, purchasable
   capability; the primary source marks self-hosted workers as In Review, not shipped.
3. **Checkpoint and wait behaviour for `wait.forToken({ timeout: "7d" })` in the
   Development environment was not established.** This is the V-2 question.
4. No official Trigger.dev statement was found either endorsing or prohibiting long-lived
   use of the dev CLI.
5. The verification was documentary and source-based. No `trigger dev` session was
   started, no callback exercised, no network path probed.
6. Findings were verified strictly at this anchor. Branch `integration/sprint-1f` exists
   at `0b229b7`; if it carries later changes to `trigger/`, `lib/dev-hq/constants.ts`, or
   `lib/dev-hq/internal-guard.ts`, §5.4 and §5.5 should be re-confirmed against it.

## 8.3 Coordinator corrections recorded against itself

1. The "7 of 12 adapters" framing of the 1C-B branch was too generous. Corrected in
   §1.2.
2. The E-1 decision package described H-A without stating that `npm start` breaks the
   callback channel outright. Corrected in §5.2.
3. An earlier position held E-1 and E-3 to be inseparable. E-3 was subsequently found
   decidable independently, because P-A is correct under every single-process topology
   that survived verification. The coupling judgment was reversed and E-3 is now ratified.

---

# 9. Standing rules affirmed by this record

1. **`PKGC-CORRECTION-1`** — cryptographic and other full-width evidence goes in a fenced
   block, one value per line, with the derivation command. Never in a wrapping table
   cell.
2. **`PKGD-CORRECTION-1`** — a read-only audit writes nothing, so verification must be by
   independent reproduction from the authorized commit, or a transcript must be returned
   for preservation.
3. **`PKGE-CORRECTION-1`** — **no load-bearing content may be preserved only inside wide
   Markdown tables.** Three transmissions in this project lost content to table reflow.
   This record follows the rule.
4. **`PKGE-HAZARD-1`** — worker-side imports must be limited to pure functions, types,
   and explicitly safe shared utilities. See §4.3.

---

# 10. What this record does not do

1. It is **not an ADR** and does not ratify one. ADR-0003 is not authored, not numbered,
   not ratified.
2. It does **not** amend ADR-0001 or ADR-0002.
3. It does **not** ratify H-AQ or any hosting target.
4. It does **not** authorize Track B, Group 3, authentication implementation,
   DESIGN-001 implementation, deployment, phone-accessible Founder actions, or any
   production-barrier change.
5. It does **not** expand the E-11 implementation authority beyond the scoped,
   package-bounded model recorded in §1.4.
6. It does **not** resolve the eight FD and ACR-001 X-8 decisions beyond FD-4, which E-3
   decides.

**Preservation is custody, not approval.**
