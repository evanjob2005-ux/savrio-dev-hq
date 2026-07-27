# Sprint 1F Track B — Consolidated Founder Decision Package

**Status:** DECISION PACKAGE — planning only. Uncommitted. No implementation performed.
**Date:** 2026-07-26
**Track A:** CLOSED at `fb6f4a3f` · checkpoint `sprint-1f-tracka-approved` → `d1c86e95…`
**Track B:** BLOCKED pending the eight decisions below.

All repository facts in this package were verified this pass; none is recalled.

---

# Part 0 — Decision taxonomy

The eight items are not the same kind of thing. Separating them prevents a Founder
decision being spent on something Design or Architecture already owns.

| Class | Items | Who decides |
|---|---|---|
| **Founder decisions** | FD-1, FD-4, FD-5, FD-6, FD-7, FD-26, ACR-001 X-8 | **Founder** — scope, money, risk, authority |
| **Architecture decisions** | **FD-3** | Architecture Reviewer proposes; **Founder ratifies the ADR amendment** |
| **Design-owned implementation detail** | The eight required DESIGN-001 addenda; view composition; component behaviour | **Claude Design Engineer** — do not spend Founder time |
| **Later Phase 2 scope** | Scorecards (ADR-0001 D8 / ADR-0002 D-E6), executive analytics, roadmap/sprint/release entities | **Out of 1F** — confirmed |

---

# 1. FD-1 — Approve DESIGN-001 as the Sprint 1F design baseline

**Decision required.** Approve `PHASE_1_MISSION_CONTROL_LITE_UX.md` (DESIGN-001) as the
binding design baseline for Sprint 1F, **conditional on eight addenda** being authored before
any surface is implemented.

**Why now.** G-1 Design review must run *before* implementation of any surface (plan §16.1).
Building twelve screens and then reviewing the design is a rework request, not a review.
Every other Track B item depends on knowing which design is authoritative.

**The eight required addenda** (Design-owned; not Founder decisions):
View 21 sign-in surface · unauthenticated shell · expired-session and re-authentication flow ·
permission/refusal behaviour · the **six-way distinction** among *disconnected, unavailable,
unauthenticated, expired, refused, server failure* · **session expiry during a decision must
render `UNCONFIRMED`, not `FAILED`** · no fabricated role hierarchy · additions preserve
DESIGN-001 structure and vocabulary.

**Options**

| # | Option | Consequence |
|---|---|---|
| **A** | Approve conditionally; addenda authored before implementation | **Recommended.** Unblocks Design immediately; implementation waits only on the addenda |
| B | Approve unconditionally now | Fastest, but the six-way state distinction is exactly what UI gets wrong by default; retrofitting it costs more than authoring it |
| C | Withhold until addenda complete | Design idles; no compensating benefit — Design must author them either way |

**Recommendation: A.**

**Authorized after approval:** Design authors the eight addenda; G-1 can be scheduled.
**Still blocked:** all implementation — FD-4, FD-5, FD-6 remain unresolved.

**Why the `UNCONFIRMED`-not-`FAILED` rule matters beyond UI polish.** A decision whose session
expired mid-flight has an *unknown* outcome. Rendering it `FAILED` asserts something the
system does not know — the same class of untruth as X4, which Sprint 1E spent a full
remediation cycle removing. This addendum is a correctness requirement wearing a UX label.

---

# 2. FD-3 — Amend ADR-0002 E5: timeline assembly must not happen in the browser

**Decision required.** Ratify an amendment to ADR-0002 E5 so authoritative execution-timeline
assembly is performed **server-side**, not in the Mission Control view-model layer.

**Why now.** ADR-0002 E5 currently reads, verbatim (`ADR-0002…md:151-154`):

> "The **execution timeline** is a derived read-model… It merges — by timestamp, per
> execution/task — events, evidence, `AgentAssignment` transitions, reviews/findings, and
> escalations into one ordered stream… **assembled in the Mission Control view-model layer.**"

That last clause places authoritative audit-history assembly **in the browser**. Every Track B
read-model depends on it, so it must be settled before read models are designed — not after.

**Why it is architecturally wrong as written.** The timeline is *"the foundation of audit
history: reconstruct exactly what happened, when, by whom"* (E5's own words). An audit record
assembled client-side is one the server cannot attest to: it can be shaped by client clock
skew, partial payloads, or a stale poll. This also compounds the AR finding that event
ordering currently relies on millisecond timestamps and insertion order with **no explicit
sequence or tie-break contract** — client-side merge makes that contract impossible to enforce.

**Options**

| # | Option | Consequence |
|---|---|---|
| **A** | Amend E5: server assembles the authoritative timeline; client renders only | **Recommended.** Preserves audit integrity and enables the sequence contract |
| B | Leave E5; assemble client-side | Audit history unattestable; the ordering follow-up cannot be closed; likely re-opened at persistence |
| C | Defer to Phase 2 | Track B read models get designed against a clause we already believe is wrong |

**Recommendation: A.** Route through the Architecture Reviewer to draft; Founder ratifies.

**Authorized after approval:** server-side read-model design (implementation-order step 5).
**Still blocked:** implementation — depends on FD-4's persistence answer.

---

# 3. FD-26 — Roadmap-required phone actions not represented in the domain

**Decision required.** Rule on the roadmap-required phone actions that have **no corresponding
domain concept** today: add them to the domain in 1F, defer to Phase 2, or narrow the roadmap
expectation.

**Why now.** This is a scope-versus-capability gap, not a UI gap. If the phone surface is
expected to *perform* actions the domain cannot express, the shortfall surfaces during
implementation as either invented endpoints or a silently reduced product.

**Options**

| # | Option | Consequence |
|---|---|---|
| **A** | Narrow 1F to actions the domain already supports; record the remainder as Phase 2 | **Recommended.** 1F ships an honest surface; nothing is fabricated |
| B | Extend the domain in 1F | Expands 1F into execution-layer work it was scoped to avoid; requires its own ADR and gates |
| C | Ship UI affordances that are visibly unavailable | Acceptable *only* under FD-1's unavailable-state contract; risks a surface that advertises capability it lacks |

**Recommendation: A**, with any deliberately-shown-unavailable actions rendered per FD-1's
six-way state contract — never as empty, zero, or failed.

**Authorized after approval:** the phone action inventory is fixed; Design can finalise View 21
and the mobile shell.
**Still blocked:** the actions themselves, pending FD-5 (authentication) and FD-7 scope.

---

# 4. ACR-001 X-8 — Establish roadmap and handbook authority tier

**Decision required.** Fix where the Master Roadmap and the Permanent Operating Handbook sit in
the authority chain, relative to the Constitution, ADRs, and standards.

**Why now.** This is currently unresolved and it is **load-bearing for every other decision in
this package.** Concretely: the Master Roadmap v8.0 is present but **untracked**; the Permanent
Operating Handbook is **a draft**; the contradiction register's identifiers were **corrupted by
concurrent writers**. Until the tier is fixed, a conflict between roadmap and ADR has no
deterministic resolution — and FD-26 is precisely such a conflict.

**Options**

| # | Option | Consequence |
|---|---|---|
| **A** | Roadmap = strategic direction, **subordinate** to ADRs on architecture; Handbook = operating procedure, subordinate to the Constitution | **Recommended.** Matches how they have actually been used; makes ADR-0001/0002 decisive on architecture |
| B | Roadmap supreme | Roadmap could override ADRs; every ADR becomes provisional |
| C | Defer | FD-26 and future conflicts stay unresolvable; the register keeps accumulating unadjudicated contradictions |

**Recommendation: A.** Also: **track the roadmap and promote the Handbook out of draft**, or
strike them from the authority chain. A controlling document that is untracked can be changed
with no history.

**Authorized after approval:** FD-26 becomes decidable; the register can be reconciled.
**Still blocked:** nothing directly — this is an unblocker, which is why it is early in the order.

---

# 5. FD-4 — Deployment expectations versus non-durable persistence

**Decision required.** Reconcile the intent to deploy a phone-reachable surface with the fact
that **all state is in-memory and process-local**.

**Why now.** Verified: `lib/dev-hq/store.ts` hangs the store off `globalThis` — it is
process-local and **does not survive a restart**. Every Track B read model, timeline, and
approval flow reads from it. This decision determines whether 1F ships a demonstrator or a
system of record.

**Options**

| # | Option | Consequence |
|---|---|---|
| **A** | 1F is explicitly a **non-durable operational view**; state loss on restart is accepted and *shown in the UI* | **Recommended for 1F.** Ships the value without pretending to durability. Requires an explicit unavailable/ephemeral contract (FD-1) |
| B | Add persistence in 1F | Large: ADR-0003, schema, migration, adapter conformance to the ADR-0001 D7 contract, plus AR2-6 first. This is a sprint of its own |
| C | Deploy as-is without disclosure | **Not recommended.** A founder approving work against a surface that silently forgets is the failure mode this project has spent two sprints eliminating |

**Recommendation: A for Sprint 1F**, with durability scoped as its own sprint. Note RAT-5
compounds B: even in-memory, the 200-event ring plus untrimmed `eventKeys` means an evicted
event **cannot be re-appended**, so timeline completeness is already bounded.

**Authorized after approval:** read-model design against known-ephemeral state; ADR-0003 can be
scoped narrowly (transport + auth) rather than persistence-first.
**Still blocked:** any claim that Mission Control is a system of record.

---

# 6. FD-5 — Authentication mechanism

**Decision required.** Choose the authentication mechanism for Founder-authority routes.

**Why now.** Verified: **zero** auth dependencies in `package.json`; no session, cookie, or
identity check on any public route. The only protection is `proxy.ts`, which returns 403 for
the entire `/api/dev-hq/*` surface **when `NODE_ENV === "production"`** — i.e. the current
safety property is *"the surface does not work in production at all."*

**A phone-reachable PWA is by definition reachable beyond a developer machine.** Shipping 1F
without authentication would publish the Founder's approval authority to the internet. This is
the single hardest blocker in Track B.

**Options**

| # | Option | Consequence |
|---|---|---|
| **A** | Single-user credential + signed session cookie, server-side enforced | **Recommended.** Smallest surface that actually protects approval authority; matches a one-Founder product; no third-party dependency |
| B | Hosted identity provider (Clerk/Auth0/NextAuth + provider) | More features, more dependencies, more configuration, external trust; heavier than a single-user product needs |
| C | Network-level only (VPN/allowlist) | No application-level identity; every route stays anonymous internally; poor fit for a phone |
| D | Defer; keep `proxy.ts` production block | **1F cannot deploy at all.** Honest, but delivers no phone surface |

**Recommendation: A**, with G-4 Security review blocking any hosted deployment. Whatever is
chosen, **keep the `proxy.ts` production block until auth is reviewed** — it is currently the
only thing standing between the approval routes and the internet.

**Authorized after approval:** auth implementation scope; View 21 sign-in and the
unauthenticated shell become buildable; FD-6 dependency list can be finalised.
**Still blocked:** hosted deployment until G-4 passes.

---

# 7. FD-6 — Approve required dependencies

**Decision required.** Approve the dependencies Track B needs. **Sprints 1D and 1E added zero
dependencies by design. 1F cannot.**

**Verified absent today:** auth library (0) · `web-push` (0) · `jsdom` (0) · Playwright config
(none, though `@playwright/test` *is* in devDependencies).

| Need | Why | Gate |
|---|---|---|
| Auth library or crypto primitives | FD-5 | Blocks all deployment |
| `jsdom` (or equivalent) | `vitest.config.ts` is `environment: "node"` with `include: ["**/*.test.ts"]` — **no `.tsx` is collected, so no component test can run today** | Blocks all UI validation |
| Playwright **config** | The package is present; the config and e2e directory are not | Blocks journey validation |
| `web-push` | Notifications | Blocks notification foundations only |

**Options**

| # | Option | Consequence |
|---|---|---|
| **A** | Approve auth + `jsdom` + Playwright config now; defer `web-push` until notifications are scoped | **Recommended.** Unblocks testing and auth; defers the one that is genuinely optional |
| B | Approve all four | Simplest; adds a dependency before its feature is scoped |
| C | Approve none | **Track B cannot be validated.** A UI sprint with no UI test capability cannot pass its own gates |

**Recommendation: A.** Note the sequencing trap: **test infrastructure must land before
implementation-order step 10**, not with it — otherwise the first Track B validation is also
the first time the test harness has ever run.

**Authorized after approval:** frontend test infrastructure; auth implementation.
**Still blocked:** notifications, pending `web-push`.

---

# 8. FD-7 — NB-1 and mobile Family B scope

**Decision required.** Rule on NB-1's disposition and on whether mobile Family B is in 1F.

**Why now.** NB-1 is a **confirmed defect** carried from Sprint 1E
(`SPRINT_1E_COMPLETION_NOTES.md:230`): *"A replayed `accept`/`abandon` escalation resolution
overwrites newer task state"* (`escalation-service.ts:505-515, 86-95`). It is recorded as
**required before non-developer use** — and Track B *is* non-developer use. A phone surface
that lets the Founder accept or abandon an escalation is exactly the path that replays.

**Options**

| # | Option | Consequence |
|---|---|---|
| **A** | Fix NB-1 **before** any phone escalation action ships; scope Family B to what the domain supports (see FD-26) | **Recommended.** NB-1 is a lost-update on Founder decisions — the highest-consequence record in the system |
| B | Ship Family B with NB-1 open | A replayed resolution can silently overwrite newer task state, from the phone, on a Founder decision |
| C | Defer Family B entirely to Phase 2 | Removes the risk; also removes most of the phone value |

**Recommendation: A.** NB-1's fix is execution-layer work and belongs with AR2-6's workstream,
not inside Track B's UI work — it should be authorized separately.

**Authorized after approval:** Family B scope fixed; Design can finalise mobile flows.
**Still blocked:** phone escalation actions until NB-1 is fixed and reviewed.

---

# Part 9 — What is explicitly NOT in this package

**Design-owned (do not spend Founder time):** the eight DESIGN-001 addenda; view composition;
component behaviour; IA detail; accessibility specification.

**Architecture-owned:** the ADR-0002 E5 amendment text (FD-3 ratifies it, AR drafts it); the
event sequence/tie-break contract; AR2-6 port revision detail.

**Phase 2, confirmed out of 1F:** scorecards (ADR-0001 D8 / ADR-0002 D-E6) · executive
analytics · roadmap/sprint/release entities (D-3/Q-3 undefined) · cost/context/checkpoint data
(D-5/Q-4, source unknown).

**Deferred, record-only:** RAT-5 (event-ring/`eventKeys` eviction) — **distinct from** the
200-event cap; the cap bounds *events*, RAT-5 concerns *keys never trimmed*. Do not conflate.

**Open but not in this package:** F-A11 (LSE charter versus tool authority) — deferred past
Track A freeze, root cause of delivery failures 8 and 9 remains **UNKNOWN**.

---

# Part 10 — ⚠️ ADVISORY COVERAGE NOT OBTAINED

Three read-only advisers were launched at Founder request: **Design Reconciliation**,
**Architecture**, and **Repository Audit**. **All three returned no deliverable.** Each was
given an explicit output contract and one equal-treatment follow-up triaged to its two
highest-value questions. This brings the session total to **ten consecutive freshly-spawned
agents with zero deliverables**, across five agent types and four task shapes. Root cause
remains **UNKNOWN**; see `WORKFLOW_DIAGNOSIS.md`.

**The read-only constraint held.** Zero tracked modifications resulted, including from the
Design agent, which holds `Write`/`Edit` and was explicitly forbidden to use them.

## What this package does and does not rest on

**Facts — independently verified by the coordinator this pass, each with file:line:**

| Decision | Verified evidence |
|---|---|
| FD-3 | `ADR-0002…md:151-154` — timeline *"assembled in the Mission Control view-model layer"* |
| FD-4 | `lib/dev-hq/store.ts` — `globalThis`-scoped, process-local |
| FD-5 | `package.json` — **zero** auth dependencies; `proxy.ts` is the sole control |
| FD-6 | `vitest.config.ts` — `environment: "node"`, `include: ["**/*.test.ts"]`; no `.tsx` collected; `@playwright/test` present, **no config** |
| FD-7 | `SPRINT_1E_COMPLETION_NOTES.md:230` — NB-1 confirmed defect |

**Reasoning — NOT independently reviewed.** The options, recommendations and consequence
analyses are the coordinator's alone.

| Decision | Missing second opinion | Materiality |
|---|---|---|
| FD-1, FD-26 | Design input | **High** — the six-way state contract and the phone-action inventory are Design's core competence |
| FD-3, FD-4 | Architecture cross-check | **High** — FD-3 proposes amending an ADR; that should not rest on one reading |
| FD-5 | Independent route-by-route audit | **Highest** — see below |
| FD-6 | Independent capability audit | Medium — the gaps are directly verifiable and were verified |

## The one gap the Founder should weigh most

**FD-5's evidence is coordinator-verified but unaudited.** A complete route-by-route
enumeration of *which mutating routes are reachable without any identity check* was the single
most valuable thing the Repository Audit would have produced, and it was not obtained.

This matters because of a specific, recorded precedent in this project. During the Sprint 1E
overnight validation, the coordinator refuted a reviewer's finding by searching for
`middleware.ts`, finding none, and concluding there was no production boundary — **while
`proxy.ts` existed and provided exactly that boundary.** The error was an absence-claim
established by searching for one name. FD-5's evidence has the same shape.

The coordinator has verified the *structure* — `proxy.ts` blocks the whole `/api/dev-hq/*`
surface when `NODE_ENV === "production"`, and the founder-facing escalation routes carry no
per-route guard — but **an exhaustive enumeration was not independently confirmed.** Treat
FD-5's factual basis as sound-but-unaudited, not as independently verified.

**Recommendation:** before implementing FD-5's chosen mechanism, commission the route-by-route
audit from a separate clean session — the path that has worked on this project when in-session
spawning has not.
