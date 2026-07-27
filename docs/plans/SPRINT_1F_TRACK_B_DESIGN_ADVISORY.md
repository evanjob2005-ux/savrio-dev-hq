# Sprint 1F Track B — Design Reconciliation Advisory (Founder-Facing Mission Control)

**Document ID:** *proposed* **DESIGN-004** — **not claimed.** ID assignment is unsettled; ACR-001 **X-22** records a missing register-naming rule across four ID spaces, and two writers collided on `X-23` earlier in this session. Following the ADR precedent (Founder decision, 2026-07-26: propose a subject, do not reserve a number), this document proposes its ID and does not assert it.

**Version:** 1.0.0

**Status:** READ-ONLY ADVISORY. Planning input to `SPRINT_1F_TRACK_B_DECISION_PACKAGE.md`. Not a design approval, not an implementation authorization, not an amendment to any ADR, plan, register, or checkpoint.

**Date:** 2026-07-26

**Author role:** Claude Design Engineer (AGENT-004 / ROLE-014), acting as read-only Design Reconciliation Adviser

**Authority:** CONST-001, GOV-001, AGENT-001, ADR-0001, ADR-0002, STANDARD-011 — **subject to ACR-001 X-8** for every roadmap-derived claim

**Repository state inspected:** branch `validation/sprint-1e-overnight-2026-07-26`, HEAD `fb6f4a3`

**Intended reader:** Main Coordinator, for reconciliation into the consolidated Track B Founder Decision Package.

---

# 0. Relationship to `SPRINT_1F_TRACK_B_DECISION_PACKAGE.md` — read this first

That package **did not exist** when this advisory pass began; it appeared in `docs/plans/` during the pass. It is another writer's document and **I have not edited it**, per the permanent one-writer rule.

It covers the same eight decisions and **converges with this advisory on the recommended option for all eight.** This section records only where I add evidence, diverge, or think the package understates a consequence. Everything not listed here is agreement, and the package's wording should be preferred where it is more concise.

## 0.1 New evidence the package does not carry

**FD-26 — the package's premise is too generous, and the correction matters.** The package states the roadmap-required phone actions have *"no corresponding domain concept today."* Verified this pass, the truth is worse:

| Fact | Location |
|---|---|
| `pauseExecution(executionId): Promise<Execution>` and `resumeExecution(...)` are **declared in the contract** | `types/contracts/workflow-engine.ts:25-26` |
| Both are **implemented**. `pauseExecution` writes `status: "queued"`. `resumeExecution` writes `status: "running"` | `lib/dev-hq/adapters/dev-workflow-engine.ts:67-79` |
| `ExecutionStatus` is `queued \| running \| succeeded \| failed \| cancelled` — **there is no `paused` value** | `types/domain/common.ts` |
| `EXECUTION_EVENT_TYPE` contains **no pause or resume event** | `lib/dev-hq/constants.ts` |
| **No HTTP route** exposes either | `app/api/dev-hq/` inventory |

The capability is not absent — it is present in a form that **destroys the distinction it claims to make**. A paused execution is recorded as `queued`, indistinguishable from one that has never started; `resume` marks an execution `running` with no dispatch behind it. A Founder-facing Pause control built on this would write a false value into the exact field the live execution timeline reads.

**This is a contract/domain contradiction — a contract promising a state the domain vocabulary cannot express.** It should be registered in ACR-001 and routed to the Architecture Reviewer. **I have not registered it; I hold no write authority over the register.**

**FD-7 — confirmatory read of NB-1, and a distinction the package does not draw.** In `lib/dev-hq/escalation-service.ts`: the **revise** path was hardened in 1E-5 — the canonical revision resolves before task reconciliation, and reactivation is guarded by a live-revision precondition evaluated *inside* the transition. The **accept/abandon** path is described in the code's own comment as *"terminal and unaffected"* and reconciles through `ensureTaskStatus` (`:86-95`), which writes the terminal status whenever the current status differs, **with no freshness precondition**. This is consistent with the recorded defect. **Static read only — no reproduction was executed and none is claimed.**

**FD-4 — a gap in the "shown in the UI" remedy.** The package's option A requires state loss to be *shown in the UI*. That is right but not sufficient: a memory store that has just restarted produces an empty snapshot **structurally identical to a genuine empty one**, and the store cannot tell the client which it is. This defeats DESIGN-001's Empty (true) vs Empty (dark) rule at the moment it matters most. See §5 condition 1 for the consumer-contract ask that fixes it cheaply.

## 0.2 Where I diverge

**FD-26, package option C — "ship UI affordances that are visibly unavailable."** I disagree with this as written, on a specific and narrow ground. **A disabled control still asserts that the capability exists** and is merely blocked right now. FD-1's six-way state contract governs *data* states — disconnected, unavailable, unauthenticated, expired, refused, server failure — and does **not** license rendering a control for a capability for which the domain has no command. For `pause`, `resume`, and `request-change` the correct rendering is **no control at all**, plus one sentence naming what is not recorded. Authority: DESIGN-001 §19.12 rule 2 (no control that does not take effect), §11.12 rule 5, and AC-19. Recommend option C be struck or re-scoped to data states only.

**FD-6 — deferring `web-push` has a scope consequence the package does not state.** The package's sequencing discipline is good and I do not contest option A. But roadmap §5 R4 and §7 V8, and research **R-14** (*"notification is not an add-on to 1F, it is 1F's headline journey"*), mean deferring the push dependency **defers 1F's headline journey**, not merely a notification nicety. That is a scope decision wearing a dependency label, and the Founder should see it as one.

**X-8 — the package answers the effect but not the question.** Its option A fixes the *precedence effect* (roadmap subordinate to ADRs on architecture) and I agree with that effect. But X-8 as recorded is literally a **tier** question: `AGENTS.md` enumerates eight tiers and the roadmap occupies none of them. An effect-only ruling leaves the tier unassigned and the next conflict re-litigates it. Recommend the ruling name the tier — see §4.

## 0.3 Where the package is stronger than this advisory, and should be preferred

- **Keep the `proxy.ts` production block until auth passes G-4.** Correct, and I had not stated it. It is currently the only thing between the approval routes and the internet.
- **The RAT-5 / 200-event-cap distinction** (the cap bounds *events*; RAT-5 concerns *keys never trimmed*). Do not conflate — I did not carry this.
- **The FD-6 sequencing trap** — test infrastructure must land before implementation-order step 10, not with it.
- **Assigning NB-1's fix to AR2-6's workstream rather than Track B's UI work.** Correct ownership, and it authorizes separately.

## 0.4 Addenda count — the two lists are not the same eight

The package's FD-1 lists eight addenda, all authentication and state-related. This advisory's §C list is also eight but includes two the package omits: the **M-7…M-12 internal-defect pass** (editorial, carries no decision, and should not be allowed to hold up FD-1) and the **§2.5 re-anchor from the superseded `057e12c` to `d922f379`**. Recommend the reconciled package carry the union, with the editorial items marked as requiring no Founder time.

---

# 1. FD-1 — Approve or reject DESIGN-001 as the approved Mission Control UX

**Exact unresolved question.** Is `PHASE_1_MISSION_CONTROL_LITE_UX.md` (DESIGN-001 v1.2.0) the governing design baseline for Sprint 1F? `SPRINT_1F_ENTRY_PACKAGE.md` §7 lists it as *"Approved Mission Control UX"*; its own header reads *"awaiting Founder review and Product Owner acceptance"* and its §16.9.2 verdict is `NOT READY FOR INTEGRATION`. Sprint 1F has a sole design authority and no approved design.

**Evidence and authority.** DESIGN-001 header and §16.9.2 (four reasons, none a defect in the specification) · DESIGN-002 X-1 / FD-1 · DESIGN-003 §5.1 · Entry Package §7 (untracked, `NOT FINALIZED`, identity unresolved as ACR-001 X-20). **[TIER-OK]** — a documentary conflict, not a roadmap claim.

**Options.** (a) Approve as-is. (b) Reject and re-scope. (c) **Approve as the Sprint 1F design baseline, conditional on the required addenda, with the four §16.9 reasons recorded as unmade decisions rather than design defects, and the four conditional surfaces explicitly excluded.** (d) Defer until FD-3…FD-7 close.

**Recommendation: (c).**

**Why safest and most truthful.** (a) silently ratifies four surfaces whose governing decisions are unmade — View 17/Q-2, View 15/Q-3, View 6 scorecard copy/Q-6, View 8/OQ-14 — freezing guesses on all four. (d) reproduces the Sprint 1E PE-1 failure exactly: work proceeding against an artifact of ambiguous authority, and the pressure to treat DESIGN-001 as approved in practice already exists because the Entry Package mislabels it. (c) removes the ambiguity, makes the Entry Package §7 label *true* rather than leaving it false, and asserts nothing undecided. It must be recorded that **approving a design is neither implementation authorization nor an ADR amendment** — otherwise FD-1 reads as unblocking Track B, which it does not.

**Approval should cover:** the truth model (§2 provenance ladder; Recorded / Derived / Projection / Recommendation / Unknown claim classes), the view inventory and URL scheme, the state taxonomy including true-empty vs unavailable, the forbidden vocabulary, the decision flow (§11), the mobile plan (§9), and the accessibility requirements. **Explicitly not approved:** the four conditional surfaces, and any reviewer-verdict rendering (barred by ACR-001 X-7).

**User-visible behavior.** None directly. Downstream: it fixes which document an engineer builds against and which copy strings are Design-owned and non-substitutable.

**Mobile.** No direct effect; the §9 mobile plan and the five-tab bar become binding (§9.3 governs over §16.5 and §1.14 — M-10).

**States.** Not applicable.

**Must never be implied or fabricated.** That FD-1 closes FD-3, FD-4, FD-5, FD-6, or FD-7. That approval authorizes Track B — CPU-001 §5.2 reads *NOT AUTHORIZED. BLOCKED. Must not begin.* That the four conditional surfaces are settled. That the Entry Package is the Founder-supplied handoff (X-20 open).

**Deferred to Phase 2.** Nothing.

**Approval class.** **Founder review + Product Owner acceptance.** Not Design-owned.

---

# 2. FD-3 — Amend ADR-0002 E5: where is the execution timeline assembled?

**Exact unresolved question.** Is the live execution timeline merged in the **browser view-model layer** (as ADR-0002 E5 is written) or projected from the **server** (as `SPRINT_1F_MISSION_CONTROL_LITE.md` §8.3 specifies)?

**Evidence and authority.** ADR-0002 E5 · SPRINT-1F-PLAN §8.3, §16.3 · DESIGN-002 X-3 / PE-2 · DESIGN-003 §5.2 · CPU-001 §5.2 **D-9 OPEN**, a Track B blocker · Master Roadmap `:109` — *"Approved ADRs and recorded decisions control architecture and policy"*; the roadmap disclaims authority here in its own voice. **[TIER-OK].** Blocks 1F-1 and 1F-14, which are roadmap R3 / V2 — the sprint's centrepiece.

**Options.** (a) Amend E5 to a **server-assembled projection**; browser renders only. (b) Confirm browser assembly as written. (c) Leave open — 1F-1 and 1F-14 cannot start.

**Recommendation: (a).** Offered as a design-consumer recommendation; the decision is not Design's.

**Why safest and most truthful.** Four UX consequences, each of which gets harder or dishonest under (b):

1. **Provenance honesty.** A browser-merged timeline is `derived` under DESIGN-001's four-value ladder, not `live`. A server projection can be badged `live`. Under (b) the surface the Founder trusts most permanently wears the weaker badge.
2. **Truncation.** The event stream is capped at 200 (plan R-5, AC-4). Only the assembling layer knows whether it hit the boundary. In the browser, *"earlier activity unavailable"* is a guess — and DESIGN-001 §5 already forbids rendering the retention marker before the stream is fully assembled, precisely because a premature marker is a **false claim of truncation**.
3. **Ordering ties.** Equal-timestamp entries must render as a tie group labelled `same timestamp — order not recorded` rather than an invented sequence. Enforceable in one place; in the browser it is re-derived per client.
4. **Low bandwidth.** Roadmap §7 V8 names low-bandwidth support a Phase 1 requirement. Browser merging ships the raw event stream to a phone on every refresh.

**User-visible behavior.** The timeline panel's `DataSourceBadge` value; whether the truncation marker can be stated authoritatively; whether tie groups are consistent across devices.

**Mobile.** Materially better under (a) — a projection is a fraction of the payload, on the surface a Founder opens most often on a phone.

**States.** *Loading:* header skeleton → attempt lanes → stream, and **no truncation marker until the stream is fully assembled**. *Disconnected:* last snapshot retained with its age; timeline not blanked. *Unavailable:* if the projection endpoint does not exist, the panel says so — it must not render as an empty timeline, which reads as *"nothing has happened."* *Failed:* a server fault is stated as a fault, not as absence of activity.

**Must never be implied or fabricated.** That a browser-merged timeline is `live`. That an empty or truncated stream means no activity occurred. That an inferred ordering is the recorded one. That a progress percentage exists — `Execution` records no progress fraction (DESIGN-001 §1.12 rule 3).

**Deferred to Phase 2.** Nothing. Phase 1 blocker.

**Approval class.** **Architecture approval via ADR amendment, plus Founder ratification.** A design approval cannot amend an ADR. Design owns only the consumer contract: badge value, truncation rendering, tie-group copy.

---

# 3. FD-26 — RC-2: the four roadmap V7 phone-first actions

**Exact unresolved question.** Roadmap §7 V7 requires *"Phone-first approval, reject, request-change, pause, resume, and priority actions."* DESIGN-001 refuses `pause`/`resume` (§6.4), `request-change` (§7.4), and editable `priority` (§10.4, §18.4), deriving each refusal from ADR-0001/ADR-0002. Which governs?

**Evidence and authority.** Roadmap §7 V7 **[TIER-UNVERIFIED]** · DESIGN-001 §4.4, §6.4, §7.4, §10.4, §16.4, §18.4 · ADR-0001 D1/O2 (retry budget owned by the Work Management Layer), D6 · ADR-0002 E6 (bounded review loop, token-guarded callback) · **repository truth verified this pass** — see §0.1; plus `Task.priority` exists (`types/domain/task.ts:11`) with no mutation route, and no review verdict is founder-writable.

**This recommendation rests on [TIER-OK] sources — repository truth and the ADRs — and therefore survives any X-8 outcome.** X-8 changes only whether the residual gap is recorded as a *conformance exception* or an *advisory note*.

**Options.** (a) Build all four. (b) **Confirm `priority` read-only for 1F; defer `pause`, `resume`, `request-change`; record the roadmap §7 V7 gap as approved-absent with its reason.** (c) Build none and record. (d) Authorize the domain work now — a new `ExecutionStatus` value, pause/resume events, idempotent routes, and a founder-facing review verdict path.

**Recommendation: (b).**

**Why safest and most truthful.** (a) is not available: three of the four have no authoritative domain command, and the one that *appears* to exist writes a false status (§0.1). (d) is a domain and ADR change of real size, outside 1F scope; `request-change` in particular collides with ADR-0002 E6's bounded review loop, where reviews resolve through a token-guarded callback and no founder-facing verdict path exists at all. (c) discards `priority`, which is genuinely recorded and genuinely useful as a chip and a sort. (b) delivers everything the domain can honestly support and makes the remainder visible rather than silently missing.

**User-visible behavior.** No Pause, Resume, or Request-change control renders **at all** — not a disabled one (see §0.2). Where a Founder would reasonably look, one sentence of Design-owned copy, e.g. **`Dev HQ records no paused state for an execution. Pausing is not available in Sprint 1F.`** `Task.priority` renders as a recorded chip and a user-selected sort; not editable.

**Mobile.** The quick-action set stays exactly at DESIGN-001 §16.4's two families — workflow approve/reject, and escalation resolve (itself gated by FD-7). **No new phone verbs.** This is *"phone actions must remain within safe domain authority"* in its literal form: the phone is where a one-tap irreversible action is most likely to be issued twice.

**States.** *Unavailable:* the capability-absent sentence with its reason — never a spinner, never `Coming soon` (a commitment nobody has made), never a greyed button. **`Not recorded` is a different state and must not be reused here:** `Not recorded` means Dev HQ has a field and no value; this is Dev HQ having no field. *Unauthorized / refused:* not applicable — nothing is refused, because nothing is offered.

**Must never be implied or fabricated.** That pause/resume exists or is imminent. That `queued` means paused. That priority is editable. That *request change* on a review has a Founder path. That the absence is a defect **or** an approved deferral — until the Founder rules it is an open conflict, handled exactly as DESIGN-001 §6.3 handles the scorecard slot.

**Deferred to Phase 2.** The three actions, each conditional on a genuine domain command: a recorded status distinct from `queued`, an emitted event, an idempotent route, and a replay guard. `priority` editing likewise requires a mutation route with an idempotency contract.

**Approval class.** **Founder** — accepting a recorded, reasoned gap against roadmap §7 V7, in the manner Sprint 1E established for deferrals; possibly an ADR if (d) is preferred. **The rendering of the absence is Design-owned.**

---

# 4. ACR-001 X-8 — The roadmap and handbook occupy no tier in `AGENTS.md`

**Exact unresolved question.** Which `AGENTS.md` tier do Master Roadmap v8.0 and POH-001 occupy? Axis A (CONST-001 Art. IX / AGENT-001) enumerates eight tiers containing neither. Axis B (roadmap §Authority Rule) asserts a position for both.

**Evidence and authority.** ACR-001 X-8, `[V] BLOCKING`, *"the register's root item"* · ACR-001 §1.1–§1.4 · CONST-001:331-341 · CPU-001 §1.3 (unverifiable-tier premise rule) · POH-001 R11, R12, R13b and the L0–L5 grid in R8 all marked PROPOSED for exactly this reason · CPU-001 F-G1.

**Options.** (i) Tier 2 — a recorded Founder decision. (ii) **Tier 5 — approved product requirements.** (iii) Outside the eight-tier model, governing a separate axis.

**Recommendation: (ii) for the Master Roadmap** — approved product requirements, with an explicit clause that it does not outrank CONST-001, GOV-001, company standards, or approved ADRs. **Rule on POH-001 separately**, not bundled: it is operating behavior, closest to tier 3 or 6 depending on whether it is approved as a governance document or a handbook. This produces the same *effect* the decision package's option A describes, while answering the tier question X-8 literally asks (§0.2). Offered as a reasoned recommendation — this is not Design's decision by any reading.

**Why safest and most truthful.** Reading (i) has a large, mostly invisible side effect: as a tier-2 Founder decision the roadmap would outrank GOV-001, and would therefore *silently settle* X-7 in favour of the six-verdict roadmap set, override GOV-001's *"No other verdict string is valid"*, and pull on the scorecard conflict (X-1) and the E5 placement — resolving five contradictions by side effect of an authority ruling rather than by anyone deciding them. Reading (iii) is defensible and matches how the roadmap describes itself, but leaves every V-number conflict permanently unadjudicable, which is today's condition. Reading (ii) gives the roadmap real force over *what should be built* — what it claims for itself, *"long-term capability direction"* — while leaving architecture and governance where the roadmap already puts them (`:109`).

**Also recommended, and the decision package is right to raise it:** track the roadmap and promote the Handbook out of draft, or strike them from the authority chain. **A controlling document that is untracked can be changed with no history.** Confirmed: `docs/roadmap/` is untracked in this working tree.

**User-visible behavior.** Indirect but real. Under (ii), roadmap §7 V4 makes the **Evidence Viewer (View 8)** a Sprint 1F requirement rather than a design recommendation — this is FD-11, closed by DESIGN-003 but tagged **[TIER-UNVERIFIED]**, and it reverts to open if X-8 resolves against the roadmap. Also adjudicable under (ii): portfolio/milestone dark surfaces (FD-25 / RC-1), a `Current action` field in the `DecisionHeader` (FD-28 / RC-4), and Review Center candidate identity (FD-27 / RC-3).

**Mobile.** No direct effect.

**States.** Not applicable.

**Must never be implied or fabricated.** That registration equals Founder approval — the roadmap's own registration record `:21` says it was placed under *Operations proposal authority only*. That a roadmap statement has settled a question an approved ADR answers differently. That the DOCX→Markdown conversion is verified — `:45-47` discloses it is not, and it is a governance-baseline gate item; no single-word contractual reading should rest on it.

**Deferred to Phase 2.** Nothing.

**Approval class.** **Founder.** Root item of the register; four other decisions cannot be weighed until it closes.

---

# 5. FD-4 — Q-1: deployment target and persistence

**Exact unresolved question.** Where does Sprint 1F run, and on what persistence? A phone-reachable PWA with push, a dev-only non-durable memory store, and a production build that disables dispatch cannot all be true at once.

**Evidence and authority.** Plan §20 Q-1 · `lib/dev-hq/store.ts:1-2` — *"Development-only … Single Next.js process, non-durable, not for production"* · `lib/dev-hq/actions.ts:43` disables agent dispatch when `NODE_ENV === "production"`, and internal routes return 403 in production · ADR-0002 E9/D-E5 defers persistence · the unmerged `feature/sprint-1c-b-supabase-persistence` branch (tip `3d1665f`) supplies adapters for **seven** stores and **none** for `evidence-store`, `review-store`, `escalation-store`, `execution-runner`, or `agent-provider` — exactly the 1D/1E entities the Mission Control timeline, queue, review, and escalation surfaces read · CPU-001 §5.2 **D-2/Q-1 OPEN** (blocks all Track B phases B–E), **D-7 OPEN** · Phase 2 carries persistence as precondition **P-1** / Founder decision **D-P1**. **[TIER-OK].**

**Options.** (a) Single long-lived process, memory store, trusted network, accepting restart data loss. (b) Adopt the 1C-B persistence branch for 1F. (c) Build and validate locally; defer deployment.

**Recommendation: (a) for Sprint 1F, with persistence routed to its own workstream (P-1 / D-P1) — plus two conditions from Design.**

**Why safest and most truthful.** (b) covers less than half the surface area 1F reads; adopting it would deliver a Mission Control where projects and tasks survive a restart and reviews, escalations, evidence, and executions do not — **a partially durable system is harder to describe honestly than a wholly non-durable one**, because no single disclosure is true of the whole screen. (c) delivers nothing to the phone, and roadmap R4/V8 and research R-14 both place notification and phone access at the centre of 1F.

**Condition 1 — restart-emptiness must be distinguishable from true emptiness.** See §0.1. Without a server-supplied process-start marker the honest terminus is a permanent shell-level durability disclosure, and **every empty state must be barred from asserting "nothing has happened yet."** With a process-start timestamp in the snapshot the client can say `Dev HQ restarted at 09:14. Anything recorded before then is gone.` — materially more truthful and cheap to provide. **Recommend requesting it as a consumer contract item.**

**Condition 2 — if the deployment runs in a mode where dispatch is disabled, the shell must say so permanently.** `actions.ts:43` means a production-mode deployment of the current code cannot dispatch or execute anything. A Mission Control whose commands are inert, without a standing statement to that effect, is the single most misleading thing this sprint could ship.

**User-visible behavior.** A permanent, non-dismissible shell disclosure naming non-durability and, where applicable, inert dispatch. The `as of` stamp on every snapshot gains weight. No empty state anywhere asserts absence of history.

**Mobile.** Decisive. Under (a) with a VPN or tunnel the PWA may be unreachable from a phone on a cellular network, and **Web Push requires HTTPS and a service worker** — so D-7 being open means push may be unavailable, putting 1F's headline journey at risk. This should reach the Founder as part of FD-4, not be discovered in Phase C.

**States.** *Loading:* normal. *Empty:* per condition 1. *Disconnected:* existing rules; last snapshot retained and aged. *Unavailable:* push reports only what the browser tells it — permission state and subscription state — never a general platform capability claim. *Failed:* server faults stated as faults.

**Must never be implied or fabricated.** Durability. That a restart-emptied Dev HQ is a true empty. That push works before the browser reports it does. That a partially durable deployment is durable. That the 1C-B branch's coverage extends to 1D/1E entities.

**Deferred to Phase 2.** The durable persistence backend and the 1C-B merge path — **P-1 / D-P1**. Sprint 1F should not own that decision and the plan does not claim it.

**Approval class.** **Founder + architecture approval** (the deployment / persistence / transport / authentication ADR — subject proposed, number assigned centrally per the Founder decision of 2026-07-26). **Design owns only the disclosure copy, placement, and the empty-state rule.**

---

# 6. FD-5 — Q-5: authentication mechanism

**Exact unresolved question.** Which mechanism — passkey/WebAuthn, a single strong credential with a session, or a hosted identity provider (including the Supabase auth on the unmerged 1C-B branch)? And is the additive-only deviation approved, given that adding authentication changes the behavior of existing public routes?

**Evidence and authority.** Plan §20 Q-5, SEC-1…SEC-14 (the acceptance bar, unchanged) · DESIGN-002 M-1, M-2, P-9 · DESIGN-003 §3 · CPU-001 §5.2 D-6/D-7 OPEN · roadmap §7 V8 *"secure authentication"* · **verified defect:** `lib/mission-control/useDevHqState.ts:64-69` maps every non-`ok` response into one error string and increments `consecutiveFailures`, so a 401, a 403, and a 500 all render as *"Not connected to Dev HQ"* — a false statement about the network that also disables every decision control for the wrong reason. **[TIER-OK].**

**Options.** (a) Passkey/WebAuthn. (b) Single strong credential + session. (c) Hosted IdP / adopt 1C-B Supabase auth.

**Recommendation: (a), with (b) as fallback, decided jointly with FD-4** — adopt (c) only if FD-4 adopts the 1C-B branch, since building auth twice is the outcome to avoid. The decision package's option A (single-user credential + signed session cookie) is a fully acceptable resolution of this and is simpler; the property below is what matters, and both (a) and (b) have it.

**Why safest and most truthful.** One principal at L5 does not need an identity provider. The decisive UX property is **inline re-authentication**: passkey and a credential field can both re-authenticate inside a sheet, preserving decision context; most IdP flows require a full-page redirect and must then *reconstruct* the destination and the in-flight decision. That reconstruction is a strictly harder correctness problem, and it is hardest in exactly the case that matters most — session expiry during a submitted decision (§8). On a phone, a biometric passkey is also the fastest path to roadmap R4's *"fast approval flows."*

**Approvable now, mechanism-independent (~85% of the surface).** DESIGN-003 §3 already specifies all of it: View 21 Sign-in and the unauthenticated shell; the four new failure taxonomy rows; the five-way differentiation table and every copy string; the §3.4 expiry-during-decision rule; snapshot retention across 401/403; **the rule that an authentication or authorization outcome is never a feed status**; destination preservation; the `SessionStatus` and `RefusalReason` tokens; the four `ActionabilityNotice` states; the six forbidden strings; every accessibility requirement. **Hold four items** until FD-5: the credential control itself, inline-vs-redirect re-auth, whether an `expiring` state renders at all, and whether a sign-in failure may name a cause.

**User-visible behavior.** The sign-in surface renders **no Dev HQ state, no counts, no status, no provenance badge, and no `as of` stamp** — it reads no authenticated snapshot, and a freshness stamp there would be the first lie the product tells. One string for *unknown account* and *wrong credential*. If a destination was preserved it is named on screen, never silently dropped. No auto-submit, no auto-retry.

**Mobile.** Single column; credential control ≥ 56 px tall; safe-area insets honoured; no horizontal scroll at 320 px. Sign-in failure announced in an assertive region — one of only two legitimate assertive cases in the product, because an unannounced failure leaves a screen-reader user with no indication anything happened.

**States.** *Unauthenticated:* **`You are not signed in.`** / *"Dev HQ cannot show you anything until you sign in. Your place has been kept."* Shell unauthenticated; decision controls not rendered. *Session expired:* **`Your session has expired.`** — last good snapshot **retained and aged**, controls disabled with the *expiry* reason, never a network reason. *Authorization refused (403):* **`Dev HQ refused this action.`** plus the server's recorded reason verbatim plus *"This is a refusal by Dev HQ, not a connection problem."* *Server failure (5xx):* stated as a fault, distinct from both. *Disconnected:* unchanged — and **401/403 must not increment `consecutiveFailures`**. *Unavailable:* unchanged; a dark capability is not an auth outcome. All six distinguishable non-visually via accessible-name prefixes: `Not signed in:`, `Session expired:`, `Refused:`, `Server error:`, `Not connected:`, `Not instrumented:`.

**The 403 copy, for a one-principal system.** In Phase 1 there is one principal holding L5, so a 403 **does not mean "your role is insufficient" and must never say so** — that invents a role hierarchy the system does not have. Three reasons, each with its own copy: `not_permitted_for_principal` (a configuration problem, not a permission the Founder lacks), `action_not_available_in_state`, and `refusal_reason_not_recorded` (stated as a defect, with the request id).

**Must never be implied or fabricated.** A role or permission model that does not exist. That a 401 or 403 is a connection problem. That an expired session failed the Founder's decision. A cause the response does not support — if the client cannot distinguish a 401 from a transport failure, the honest string names both possibilities rather than guessing.

**Deferred to Phase 2.** Multi-user and RBAC; the role-bearing variant of `not_permitted_for_principal` (the token exists now so the surface needs no restructuring then).

**Approval class.** **Founder** for mechanism and the additive-only deviation. **Design-owned:** all copy, states, prohibitions, accessibility. **Engineering:** the P-9a…P-9f response contract, without which none of the above is renderable.

---

# 7. FD-6 — Q-9: new dependencies

**Exact unresolved question.** Approve the dependency classes Track B needs? Sprints 1D and 1E added zero, deliberately, and `AGENTS.md` requires escalation for a major dependency.

**Evidence and authority.** Plan §20 Q-9, item 1F-19a · CPU-001 §5.2: **frontend test infrastructure ABSENT — verified**; `vitest.config.ts` collects `**/*.test.ts` under `environment: "node"`, no `.tsx` is collected, no Playwright configuration or e2e directory exists · plan risk R-8 (*untestable UI*) · DESIGN-001 AC-19 (plausible placeholders are a failure). **[TIER-OK].**

**Recommendation: approve auth + DOM test environment + Playwright config, and sequence the DOM test environment first — 1F-19a at the front of Phase D, before any surface item.** On `web-push` I do not contest deferral, but see §0.2: deferring it defers 1F's headline journey, and that consequence belongs in front of the Founder.

**Why safest and most truthful.** Design's stake here is concrete and is the strongest of the three arguments. **Every honesty rule in DESIGN-001 is a rendering rule** — dark vs true-empty, `Not recorded` vs a bare `—`, disabled-with-a-stated-reason, accessible-name prefixes, the five-way state differentiation, suppression of reconciliation against a stale snapshot. **None can be verified by a node-environment test.** Without a DOM test environment the entire truth model ships unverified and AC-19 becomes an unenforceable assertion — the sprint would be certifying honesty by inspection. That makes jsdom (or equivalent) the highest-value dependency of the set, ahead of auth.

**User-visible behavior.** None from the test environment. Push produces the permission and subscription states.

**Mobile.** Push is a phone capability by definition. Platform support differs and R-14 records that the constraint *"must be verified against current documentation, not recalled"* — so the surface reports **what the browser actually tells it**, never a general platform assertion.

**States.** *Unavailable:* push unsupported or permission denied — name which state applies and what the Founder can do, if anything. *Unconfirmed:* a dispatched notification is **not** a delivered one. Per DESIGN-001 §8.6 as reconciled at M-9: until 1F-10 lands, notifications are derived in the browser and nothing is delivered anywhere; after it lands, delivery is stated **only from a `D-J` delivery record**.

**Must never be implied or fabricated.** Delivery from a dispatch. Platform push capability from memory. That UI behavior was validated when no DOM test could run.

**Deferred to Phase 2.** Nothing.

**Approval class.** **Founder** for the dependency classes. **Engineering** selects the specific libraries.

---

# 8. FD-7 — NB-1 disposition and the mobile Family B gate

**Exact unresolved question.** Approve the NB-1 remediation and its sequencing; and accept or reject the interim gate barring escalation resolution (Family B: revise / accept / abandon) on mobile until it lands.

**Evidence and authority.** `SPRINT_1E_COMPLETION_NOTES.md:230` records NB-1 as a **confirmed defect** — *"A replayed `accept`/`abandon` escalation resolution overwrites newer task state"* (`escalation-service.ts:505-515, 86-95`), required before non-developer use. Research **R-14**: *"Mobile networks produce exactly the duplicate-submission conditions NB-1 describes; this item must not proceed before NB-1 is fixed."* DESIGN-001 §11.7, §16.4, §15.12, BC-13; OQ-3, OQ-5, OQ-11. Confirmatory static read at §0.1.

**Options.** (a) Approve the remediation and **accept** the interim gate — mobile: approvals resolvable, escalations notify-and-read. (b) Approve the remediation and **reject** the gate. (c) Defer NB-1; ship no escalation resolution anywhere.

**Recommendation: (a).**

**Why safest and most truthful.** (b) enables one-tap irreversible decisions on exactly the network conditions that produce duplicate submissions, against a confirmed defect that R-14 names as a listed risk. (c) removes a working desktop capability to punish a mobile-specific hazard — flattening a safe path for an unsafe path's defect. (a) preserves the distinction. **Family A (workflow approve/reject) is not implicated by NB-1 and remains quick-actionable on mobile.** The split should be recorded as lapsing automatically when NB-1 lands **and** a regression test pins accept/abandon idempotency — otherwise it becomes a permanent restriction nobody revisits.

**User-visible behavior.** On a phone, an escalation notification opens the **record**, with full cause and consequence text, and one statement: **`Escalation decisions are made on a larger screen in Sprint 1F.`** Not a disabled Resolve button — **no control at all**, plus the reason. The verb *resolve* appears nowhere in the mobile escalation surface. On desktop, escalation resolution remains permitted under existing preconditions: escalation open, cause and consequence fully visible, `revisionExecutionId` null for Revise, snapshot `live`.

**States — the load-bearing part.**

- **`UNCONFIRMED` is the governing state, with exactly one entry path and one exit.** A submission that returns 401, times out, or produces any ambiguous outcome enters `UNCONFIRMED`, **never `FAILED`**. Session expiry during a decision is a *new entry point into the same state* and must not acquire a second, weaker path.
- Copy: **`Your session expired while this decision was being sent. We could not confirm it. Sign in, refresh, and check before deciding again. Do not resubmit.`**
- **The only control is `Sign in and check`. No retry, at any breakpoint.** A "Try again" button after an unconfirmed accept/abandon is not a convenience — it is the thing that fires NB-1.
- After re-authentication the Founder returns to the **record**, not to Home, with refreshed authoritative state applied.
- *Failed:* reserved for an outcome the server actually reported as failed. *Refused:* the 403 vocabulary, never conflated with a decision failure. *Disconnected:* Family A permitted with snapshot age shown; Family B disabled. *Unavailable / not recorded:* an escalation with `escalationReason: null` renders **`Escalation reason not recorded`**, explicitly, never defaulted to either cause — DESIGN-001 calls this the single most important failure state in that view. An escalation referencing a review absent from the snapshot renders *not recorded* **plus** `Referenced review not in current snapshot`, because *"not recorded"* and *"not loaded"* must not be collapsed.

**Must never be implied or fabricated.** That an unconfirmed decision failed. That it succeeded. That resubmitting is safe. That an authentication outcome is an operational failure of the project. That a missing escalation reason is one of the two possible causes.

**Deferred to Phase 2.** Nothing — NB-1 is a Phase 1 confirmed defect.

**Approval class.** **Founder** — approving the remediation and accepting the gate, because **it changes what may ship**; plus Lead Software Engineer for sequencing. The decision package is right that the fix itself belongs with AR2-6's workstream, not inside Track B's UI work. **The state design and copy are Design-owned.**

---

# A. Recommended resolution — all eight

| # | Decision | Recommendation | Approval class |
|---|---|---|---|
| **FD-1** | DESIGN-001 approval | **Approve as Sprint 1F design baseline, conditional** on the addenda (union of both lists, §0.4); exclude the four conditional surfaces and all reviewer-verdict rendering; record that approval is neither implementation authorization nor an ADR amendment | Founder + Product Owner |
| **FD-3** | ADR-0002 E5 | **Amend to a server-assembled timeline projection**; browser renders only | Architecture (ADR amendment) + Founder ratifies |
| **FD-26** | Roadmap V7 actions | **Confirm `priority` read-only; defer `pause`, `resume`, `request-change`; record the V7 gap as approved-absent with its reason.** No control renders for the three — not a disabled one. Register the contract-vs-domain contradiction | Founder (+ possible ADR); rendering Design-owned |
| **X-8** | Roadmap authority tier | **Tier 5 — approved product requirements**, explicitly not outranking CONST-001, GOV-001, standards, or approved ADRs. **Rule on POH-001 separately.** Track the roadmap or strike it from the chain | Founder (root item) |
| **FD-4** | Q-1 deployment/persistence | **Single long-lived process + memory store + trusted network for 1F**; persistence to P-1/D-P1. **Two conditions:** a process-start marker so restart-emptiness is distinguishable from true emptiness, and a permanent shell disclosure if dispatch is inert | Founder + architecture (ADR subject) |
| **FD-5** | Q-5 auth mechanism | **Passkey/WebAuthn or single strong credential + signed session, decided jointly with FD-4.** Approve the ~85% mechanism-independent set now; hold four contingent items. Keep the `proxy.ts` production block until G-4 passes | Founder (mechanism); Design (copy/states); Engineering (P-9) |
| **FD-6** | Q-9 dependencies | **Approve auth + DOM test environment + Playwright config; sequence the DOM test environment first.** If `web-push` is deferred, record that this defers the headline journey | Founder |
| **FD-7** | NB-1 + mobile gate | **Approve the remediation and accept the gate** — mobile: approvals resolvable, escalations notify-and-read. Gate lapses when NB-1 lands **and** an idempotency regression test exists. `UNCONFIRMED`, never `FAILED`; no retry at any breakpoint | Founder (changes what may ship) |

---

# B. Contradictions and missing authority

**Preventing a recommendation outright:**

- **ACR-001 X-8 is upstream of four roadmap-derived findings.** RC-1 (portfolio/milestone, FD-25), RC-4 (`Current action`, FD-28), and FD-11 (Evidence Viewer / View 8) rest on the roadmap alone and are unverifiable-tier premises under CPU-001 §1.3. **I cannot recommend on FD-25 or FD-28 without X-8.** FD-26 is the exception: it rests on repository truth and the ADRs and survives any X-8 outcome.
- **ACR-001 X-7 — reviewer verdict vocabulary, five incompatible sets, `[V] BLOCKING`.** No DESIGN-001 change is needed today (View 7 uses the domain `ReviewStatus`, not the reviewer verdict set), but **the Review Center must not render reviewer verdicts until X-7 closes.** `REJECT CANDIDATE` and `UNABLE TO VERIFY` have no mapping into GOV-001's Approval States at all.
- **Cost instrumentation has no owner (OQ-18).** Four independent documents found it unassigned; View 13 is designed against a gap nobody holds. Not blocking — the view renders its dark state honestly — but it will not light up until someone owns it.
- **Context-health band numbers are unapproved policy (G-11 / P-7).** Every band renders `provisional` by construction. Consistent with the constraint that context-health dark states are acceptable in Sprint 1F; recommend accepting provisional-only rendering **explicitly** rather than leaving it implicit.

**Newly surfaced by this pass, not previously registered:**

- **`WorkflowEngine.pauseExecution` / `resumeExecution` promise a state `ExecutionStatus` cannot express.** Contract and adapter exist; `paused` does not; no event; no route. Recommend an ACR entry routed to the Architecture Reviewer. **Not registered by me.**
- **Restart-emptiness is indistinguishable from true emptiness** in a memory-store deployment, defeating DESIGN-001's Empty (true) vs Empty (dark) rule where it matters most. Routed as a consumer contract item under FD-4.

**Contextual, not blocking the eight:** X-20 (identity of the Sprint 1F Preparation Handoff — source of the *"Approved Mission Control UX"* mislabel FD-1 exists to fix); X-3 (both 1E reviewers contributed to the candidate they would certify; the route for the *next* candidate is unchosen, which matters for whoever gates Track A's and Track B's candidates); D-8 (missing handbooks and standards — a gate cannot certify against a standard that does not exist); X-14 (phantom workstream — recommend closing as void; its second party does not exist).

---

# C. Minimum design addenda before implementation can begin

**Scope correction first. AR2-6 is Track A** — the `ExecutionRunner` port revision and its production consumption. It is not a Mission Control surface and **no design addendum gates it.** AR2-6 is gated on F-A1/F-A2/F-A3 and on the X-3 reviewer-independence route, neither of which is Design's. It would be wrong to let Design work hold it up. One design-adjacent consequence only: **if AR2-6 changes execution status or event vocabulary, DESIGN-001 §2.5 must be re-verified against the resulting baseline** (M-12, currently anchored to the superseded `057e12c`).

| # | Addendum | Owner | Blocked by |
|---|---|---|---|
| **A1** | DESIGN-001 revision applying **M-7…M-12** — route-column correction, View 6 scorecard copy propagated verbatim, View 14 delivery prohibitions, five mobile tabs, §14.10 handoff summary, and **§2.5 re-anchored to `d922f379` and re-verified row by row.** Editorial; carries no decision | Design | Nothing — can start now |
| **A2** | Adopt DESIGN-003 §3: View 21, unauthenticated shell, re-auth sheet, four failure rows, Offline (shell only), the five-way differentiation table and copy, **the §3.4 expiry→`UNCONFIRMED` rule**, `SessionStatus`/`RefusalReason`, four `ActionabilityNotice` states, six forbidden strings, §2.4 recovery and wake rules | Design; Founder accepts | Mechanism-independent set: nothing. Four contingent items: FD-5 |
| **A3** | **Capability-absent rendering standard** for the V7 actions — no control, one sentence naming what is not recorded, no `Coming soon`, explicit distinction from `Not recorded` | Design | FD-26 |
| **A4** | **Durability and restart disclosure**, plus the rule that no empty state asserts absence of history; consumer request for a process-start marker | Design (copy) + Engineering (marker) | FD-4 |
| **A5** | **Inert-dispatch shell disclosure**, if the deployment mode disables dispatch | Design | FD-4 |
| **A6** | **Timeline consumer contract:** provenance value, truncation-marker rendering, tie-group ordering copy — consumer requirements, not an architecture choice | Design | FD-3 |
| **A7** | **Review Center:** render `Candidate not recorded` as a visible row rather than omitting it (RC-3); hard bar on reviewer verdicts until X-7 closes | Design; Founder + Engineering for the field | X-7; RC-3 Founder + Engineering |
| **A8** | **P-9a…P-9f** as an engineering consumer contract — without it none of A2 is renderable | Engineering | FD-5 |

**A1 and the mechanism-independent portion of A2 can proceed immediately** — roughly 85% of the outstanding Design work. A3–A8 each wait on a decision that is not Design's.

**Honest statement of position.** Even with every addendum complete, **Track B remains blocked** by FD-3, FD-4, FD-5, FD-6, FD-7, and X-8. The character of the block would have changed — from *"the design authority is unsettled and two required surfaces do not exist"* to *"decisions that are not Design's are unmade."* A better place to be blocked, and a shorter list. Still blocked. **The shortest truthful description: the design would be approved and the sprint still could not start.**

---

# D. Repository changes and validation

**One file was created: this one.** `docs/plans/SPRINT_1F_TRACK_B_DESIGN_ADVISORY.md`, new, untracked.

**Nothing else was changed.** No existing file was edited. `SPRINT_1F_TRACK_B_DECISION_PACKAGE.md` was **read only and not modified**, per the permanent one-writer rule — it is another writer's document and appeared during this pass. Nothing was staged, committed, tagged, or pushed. No branch, tag, or checkpoint was altered. Nothing under `app/`, `components/`, `lib/`, `types/`, `data/`, `public/`, or `trigger/` was touched. No document under `docs/`, `agents/`, `standards/`, or `handbooks/` was modified. No implementation was launched and no Phase 2 work was started.

**Validation performed:** documentary and static inspection only. Read — DESIGN-001 (relevant parts), DESIGN-002, DESIGN-003 in full, `SPRINT_1F_MISSION_CONTROL_LITE.md` §20, `MASTER_ROADMAP.md` §5/§7, ACR-001 §1–§3, CPU-001 §5, `SPRINT_1F_TRACK_B_DECISION_PACKAGE.md` in full, and by direct source read: `types/contracts/workflow-engine.ts`, `types/domain/common.ts`, `types/domain/task.ts`, `types/domain/founder-request-workflow.ts`, `lib/dev-hq/adapters/dev-workflow-engine.ts`, `lib/dev-hq/constants.ts`, `lib/dev-hq/escalation-service.ts`, `lib/mission-control/useDevHqState.ts`, and the `app/api/dev-hq/` route inventory.

**Not validated:** no test, lint, type-check, or build was executed, and no claim here rests on command output. The NB-1 accept/abandon finding is a **static read, not a reproduction**. The DOCX→Markdown roadmap conversion remains unverified line-by-line (a disclosed governance-baseline gate item), so no single-word contractual reading of the roadmap should rest on this report. No usability, contrast, performance, or screen-reader validation was performed and none is claimed.

**Every recommendation above is labelled as a recommendation. No cross-authority conflict was resolved by this pass.**

**Next owner:** Main Coordinator, for reconciliation into `SPRINT_1F_TRACK_B_DECISION_PACKAGE.md`. Then Founder, for the eight decisions in the order that package sets.
