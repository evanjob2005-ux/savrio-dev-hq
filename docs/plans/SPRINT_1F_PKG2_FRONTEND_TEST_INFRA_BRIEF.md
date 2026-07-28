# Sprint 1F Package 2 — Authorization Brief

**Status:** PROPOSED. Planning only. **Not authorized. Not started.** Uncommitted.
**Predecessor:** AR2-6, closed at `sprint-1f-ar2-6-approved` → `8c2eb9a738fa…`
**Coordinator branch HEAD:** `6eefff7f60535ac602f8d62754bc8a560c87c838`

---

## 1. Package name and purpose

**PKG-2 — Frontend Test Infrastructure (FD-6, narrowed)**

Establish the capability to test UI, and prove it works. **No product UI is built. No production
code changes.** The deliverable is a working DOM-capable component-test project and a working
browser/E2E harness, each demonstrated by at least one real passing test with a real negative
control.

---

## 2. Why it is next in dependency order

Established by direct repository inspection this pass, not from planning documents:

| Candidate | Blocking dependency | Status |
|---|---|---|
| Timeline / read-model foundation | ADR-0002 E5 amendment — **grep for `assembled server-side` returns 0**; plus the open RAT-5 retention decision | **BLOCKED** |
| Authentication / Founder identity | **0 auth dependencies** in `package.json`; FD-5 is not implementation-ready until the exhaustive route audit completes | **BLOCKED** |
| Mission Control shell and navigation | Requires G-1 design review **and** a way to validate UI | **BLOCKED** |
| FD-5 remediation | Requires the route audit first | **BLOCKED** |
| RAT-5 remediation | Requires a Founder decision | **BLOCKED** |
| **NB-1 remediation** | **None** — `updateTaskStatusIf` already exists (`dev-task-repository.ts:64`, contract `task-repository.ts:49`); `ensureTaskStatus` at `escalation-service.ts:86` is the unguarded write | **UNBLOCKED** |
| **PKG-2 frontend test infrastructure** | **None** — FD-6 is approved, including dependency approval | **UNBLOCKED** |

**Two leaves. PKG-2 is chosen over NB-1 on three grounds:**

1. **It gates the most.** **31 `.tsx` files exist and not one can be tested today** —
   `vitest.config.ts` sets `environment: "node"` and `include: ["**/*.test.ts"]`, so `.tsx` is
   never collected. Playwright is installed with **no config and no e2e directory**. Every
   later Track B package — shell, views, auth UI, timeline UI — cannot be validated until this
   exists. It is the true bottleneck at step 10 of the approved implementation order.
2. **It carries no production risk.** PKG-2 changes **zero** production source. NB-1 changes
   behaviour on the escalation path — the highest-consequence records in the system, where a
   replayed `accept`/`abandon` overwrites newer task state.
3. **Its one real risk is precisely boundable.** Disturbing the existing node project would
   endanger the 326-test Sprint 1E / Track A regression baseline. That risk is directly measurable:
   the node project must still report exactly 326, and this brief makes that a negative control.

**NB-1 is the explicit runner-up** and should be the package after this one, or instead of it if
the Founder prefers to clear a confirmed defect first. It is smaller; it simply unblocks less.

---

## 3. Exact included scope

1. **A second, DOM-capable Vitest project** for component tests — added **alongside** the
   existing node project, not replacing it.
2. **Component-test dependencies** — a DOM environment (`jsdom` or `happy-dom`) and a component
   testing library (`@testing-library/react` + `@testing-library/dom`, or equivalent).
3. **One real component test** against an existing `.tsx` component, proving the DOM project
   genuinely runs and genuinely renders.
4. **Playwright configuration and scripts** — `@playwright/test` is already installed; this adds
   the config, an `e2e/` directory, and npm scripts.
5. **One real E2E smoke test** proving the browser harness genuinely drives the app.
6. **Negative controls for all three** (§6).

---

## 4. Explicit excluded scope

**Forbidden — no exceptions:**

- Any Mission Control view, shell, navigation, or product UI
- Authentication or authorization of any kind
- Timeline or read-model work
- FD-5 route remediation · NB-1 remediation · RAT-5 remediation
- Any change to `lib/dev-hq/**` or `types/contracts/**`
- Any change to existing `.test.ts` files or their assertions
- Any ADR change
- **Any durable `ExecutionRunner` work** — GATE-1 and GATE-2 remain future authorizations
- **Any reopening of `candidate-1f-ar2-6-1` or `sprint-1f-ar2-6-approved`**
- Accessibility *automation* beyond wiring — the manual passes are Design-owned
- Phase 2 work of any kind

**Explicitly out even though tempting:** broad component-test coverage. **One** proving test per
harness. Coverage is the *next* package's business; this one establishes capability.

---

## 5. Authorized file-path envelope

**May create:**
```
vitest.workspace.ts              (preferred — leaves vitest.config.ts untouched)
vitest.dom.config.ts             (only if a workspace file is not viable)
playwright.config.ts
e2e/**                           (E2E specs and fixtures)
components/**/*.test.tsx         (exactly ONE proving component test)
```

**May modify:**
```
package.json                     (devDependencies + test scripts ONLY)
vitest.config.ts                 (ONLY if a workspace file cannot express the split)
.gitignore                       (ONLY for Playwright artifact directories)
```

**Everything else is forbidden**, including all of `lib/`, `types/`, `app/`, `docs/`, `agents/`,
and every existing `.test.ts`.

**Preference stated deliberately:** use `vitest.workspace.ts` and **do not touch
`vitest.config.ts`**. The existing node project is the Sprint 1E and Track A regression baseline;
the safest change is one that cannot alter it.

---

## 6. Required tests and negative controls

Three harnesses, three proofs, three negative controls. **Every negative control must be
demonstrated by execution, with literal output recorded.**

### NC-1 — the DOM project genuinely provides a DOM
The component test must **fail when run under the node project**, proving the DOM environment
is actually applied rather than merely configured.
*Method:* run the component test with the node configuration; record the failure. Expected: a
`document is not defined`-class error.

### NC-2 — the existing node project is undisturbed
**The node project must still report exactly 326 tests**, and must still **not collect `.tsx`**.
*Method:* run the node project alone; assert 326. Then assert the collected-file list contains
zero `.tsx` entries.
**This is the criterion that protects the Sprint 1E and Track A regression baseline.**

### NC-3 — the E2E harness genuinely drives the app
The smoke test must **fail when its target assertion is falsified**, proving it observes the
real application rather than passing vacuously.
*Method:* mutate the selector or expected text, run, record the failure, revert, confirm the
file is byte-identical.

**Rationale, stated because this project has been bitten twice:** infrastructure that is
configured but unproven is exactly the MAJOR-2 pattern — a test that passes without exercising
what it claims. A harness whose test cannot fail is not a harness.

---

## 7. Review sequence

Unchanged from the established order:

1. Implementation in a dedicated worktree, one writer
2. Deterministic validation (§ below)
3. **Freeze** — narrow commit, immutable annotated candidate tag
4. **Independent Code Review** against a detached clean review worktree
5. Remediation and **re-freeze with a new commit and new tag** if anything changes
6. **Formal Architecture Review** — only after ICR closes
7. Founder approval
8. Protected checkpoint, evidence preservation, worktree cleanup

**The two reviews must not run simultaneously against a mutable candidate.**

### Deterministic validation commands

```
npx tsc --noEmit
npx eslint .
npx vitest run                      # node project — MUST report 326
npx vitest run --project dom        # or equivalent; the DOM project
npx playwright test
npx next build
```

Record **literal commands and actual counts**, per RAT-4. **Do not report a count without its
scope**, per the NOTE-4 correction against this coordinator's own earlier record.

---

## 8. Candidate-freeze procedure

Per the F-A7 permanent policy, twice proven:

```
git worktree add -b impl/pkg2-test-infra ../savrio-impl-pkg2 <baseline>
# implement; explicit-path staging only; never git add . or -A
git commit                                  # one narrow commit
git tag -a candidate-1f-pkg2-1              # immutable annotated tag
git worktree add --detach ../savrio-review-pkg2 candidate-1f-pkg2-1
```

Record tag object, peeled commit, tree SHA, per-file SHA-256, diffstat, and all validation
results with literal commands. Re-verify the tag immediately before **and** after each review.
**Any candidate change invalidates the affected approval and requires a new commit and new tag.
Protected tags never move.**

**Evidence-preservation rule, learned twice on this project:** if a reviewer delivers inline
only, preserve the report to an authorized path **before** removing any worktree, and prove
preservation by hash first.

---

## 9. Risks and open decisions

| # | Risk | Mitigation |
|---|---|---|
| **R-1** | Disturbing the node project endangers the 326-test regression baseline | NC-2 makes it a hard criterion; workspace-file approach avoids touching `vitest.config.ts` |
| **R-2** | New dependencies — first added since 1D and 1E, which added **zero** by design | FD-6 approved them; envelope limits `package.json` to devDependencies and scripts |
| **R-3** | Playwright needs a running app; a misconfigured harness passes vacuously | NC-3 requires a demonstrated failure |
| **R-4** | Scope creep into product UI | Envelope permits exactly one component test; views are forbidden |
| **R-5** | `.gitignore` omission leaks Playwright artifacts into the tree | Envelope permits the `.gitignore` edit; post-build tree check |

**Open decisions — none blocking this package.** FD-3, FD-4, FD-5, FD-26, RAT-5, NB-1 and the
AR2-6 GATE-1/GATE-2 items all remain open and **none is a dependency of PKG-2**.

---

## 10. Is Founder input required before implementation?

**Yes — three items, all small:**

**F-P1 — Confirm PKG-2 over NB-1.** Both are unblocked. This brief argues PKG-2 gates more and
risks less; NB-1 is smaller and clears a confirmed defect. **The Founder should pick.**

**F-P2 — DOM environment choice:** `jsdom` or `happy-dom`. Coordinator recommends **`jsdom`** —
the plan's own §2.6 names it, and it is the more conventional choice for Testing Library.

**F-P3 — Confirm the one-proving-test constraint.** This brief deliberately forbids broad
component coverage. If the Founder wants coverage in this package, the envelope and acceptance
criteria must widen accordingly.

**No adviser was launched for this package.** Independent advisers would add no value here: the
dependency facts were verified directly from the repository this pass, the package touches no
production code, and no architectural or design judgment is in question. Given twelve
consecutive subagent delivery failures, launching advisers would add delay without adding
information. **This is a coordinator judgment and is stated rather than hidden.**

---

## 11. Implementation-agent prompt — DO NOT LAUNCH UNTIL APPROVED

> You are IMPL-PKG2, the dedicated Sprint 1F Package 2 implementation agent. You have Founder
> authorization to write, narrowly scoped.
>
> **WORKTREE — work ONLY here:** `C:\Users\evanj\Documents\Projects\savrio-impl-pkg2`, branch
> `impl/pkg2-test-infra`, at the authorized baseline. **Never touch**
> `C:\Users\evanj\Documents\Projects\savrio-dev-hq` or `..\savrio-impl-ar2-6`.
>
> **OBJECTIVE:** establish frontend test capability and prove it works. **Build no product UI.
> Change no production code.**
>
> **AUTHORIZED PATHS — exhaustive.** May create: `vitest.workspace.ts`, `playwright.config.ts`,
> `e2e/**`, and exactly ONE `components/**/*.test.tsx`. May modify: `package.json`
> (devDependencies and scripts only), `.gitignore` (Playwright artifacts only), and
> `vitest.config.ts` **only if a workspace file cannot express the project split**.
> **Prefer leaving `vitest.config.ts` untouched** — it is the Sprint 1E and AR2-6 regression
> baseline.
>
> **FORBIDDEN:** `lib/**` · `types/**` · `app/**` · `docs/**` · `agents/**` · any existing
> `.test.ts` · any ADR · Mission Control or product UI · authentication · timeline · FD-5 ·
> NB-1 · RAT-5 · durable `ExecutionRunner` work · Phase 2. Do not create or move any tag.
>
> **DELIVER:**
> 1. A DOM-capable Vitest project alongside the node project.
> 2. Exactly ONE real component test against an existing `.tsx`, genuinely rendering.
> 3. Playwright config, an `e2e/` directory, npm scripts, and ONE real smoke test.
>
> **THREE NEGATIVE CONTROLS — each demonstrated by execution, literal output recorded:**
> **NC-1** the component test FAILS under the node project (proving the DOM env is applied).
> **NC-2** the node project still reports **exactly 326 tests** and still collects **zero
> `.tsx`**. **NC-3** the E2E smoke test FAILS when its assertion is falsified; then revert and
> confirm the file is byte-identical.
>
> A harness whose test cannot fail is not a harness. NC-2 protects the Sprint 1E and AR2-6
> regression baseline and is the single most important criterion in this package.
>
> **VALIDATE, recording literal commands and actual counts:** `npx tsc --noEmit` ·
> `npx eslint .` · `npx vitest run` (must be 326) · the DOM project · `npx playwright test` ·
> `npx next build`. **Never report a count without stating the scope that produced it.**
>
> **COMMIT:** explicit-path staging only, never `git add .` or `-A`. One narrow commit on your
> branch. **Do not tag** — the coordinator tags.
>
> **MANDATORY OUTPUT CONTRACT.** Your final message must begin with exactly one of
> `PKG2 IMPLEMENTATION COMPLETE` · `PKG2 IMPLEMENTATION PARTIAL` · `BLOCKED REPORT`, alone on
> the first line. Then: files changed with diffstat · how the project split was achieved and
> whether `vitest.config.ts` was touched · **all three negative-control results with literal
> output** · all six validation results with actual numbers · your commit SHA · anything
> incomplete.
>
> **If you write any file outside your commit, state its exact path in your final message.**
> Agents on this project have produced substantial work that was only discovered by inspecting
> disk. Budget effort so the verdict token and summary always fit. A PARTIAL with honest gaps
> is far more useful than silence.

---
---

# FINALIZED AUTHORIZATION ENVELOPE — PKG-2

**Founder decisions applied:** F-P1 proceed with PKG-2 · F-P2 `jsdom` · F-P3 narrow
proving-test constraint retained. NB-1 recommended as the package after PKG-2.

## 1. Baseline and branch policy

| Item | Value |
|---|---|
| **Baseline commit** | `6eefff7f60535ac602f8d62754bc8a560c87c838` — verified equal to Main Coordinator HEAD |
| Baseline tree | `7cc8b7f42ae5c5f735fc64be453cc22bfe69468e` |
| **Branch** | `impl/pkg2-test-infra` |
| **Worktree** | `C:\Users\evanj\Documents\Projects\savrio-impl-pkg2` |

**No implementation in the Main Coordinator worktree.** One writer, one worktree.

## 2. Single package objective

Establish **independently proven** frontend component-test and browser E2E capability **without
changing production behavior.**

## 3. Required capabilities

Collection and execution of `.test.tsx` component tests · **`jsdom` for the component project
only** · continued Node environment for all existing backend tests · Playwright configuration ·
one deterministic browser smoke test · package scripts to run each harness explicitly · clear
separation among Node, component and E2E tests.

## 4. Production-code prohibition

**No production behavior may change.** No Mission Control feature, authentication, timeline,
backend lifecycle behavior, API behavior, business logic, or UI product feature.

A **minimal static fixture or an existing stable page** may be used solely to prove the harness.
**Do not create a fake Mission Control feature to test the harness.**

## 5. Existing baseline protection

The Node project must continue to: run in the Node environment · collect **zero** `.tsx` ·
pass **326 tests across 22 files** · remain independently runnable.

**Do not silently merge component tests into the Node project.**

## 6. Component proving test

**Exactly one** meaningful `.test.tsx`, demonstrating **real DOM behavior** — not merely
importing a component or asserting a function exists. Use the smallest stable existing
component, or a dedicated fixture permitted by §11.

## 7. E2E proving test

**Exactly one** Playwright smoke test: launches the app through a **deterministic configured web
server**, visits a stable route, asserts a **user-visible condition**, avoids external network
dependencies, avoids authentication and Mission Control features, runs **independently of
Vitest**.

## 8. Negative controls — all three mandatory

**NC-1 — DOM-environment proof.** Run the component proving test under the Node environment, or
disable its `jsdom` assignment. **It must fail for the intended missing-DOM reason.** Restore
candidate files exactly afterward.

**NC-2 — Node-project isolation.** Run the Node project independently: **zero** `.tsx` collected,
**326-test** baseline retained, no contamination of Node collection or environment.
**If a pre-existing repository change alters the count before implementation, STOP and report the
discrepancy — do not rewrite the expected value.**

**NC-3 — E2E sensitivity.** Falsify the Playwright assertion; it must fail **for the intended
assertion reason**. Restore **byte-identically** and demonstrate it passes.

**Negative controls modify only the dedicated implementation worktree and must leave the final
candidate clean.** Literal commands and outputs preserved in the report.

## 9. Required validation — literal commands only

```
npx tsc --noEmit
npx eslint .
npx vitest run --project node       # exact node-project invocation; MUST be 326 across 22 files
npx vitest run --project dom        # exact component-project invocation
npx vitest run                      # all projects together
npx playwright test
npx next build
git diff --check
git status --porcelain --untracked-files=all
```

**No ambiguous commands.** Record the exact command beside every result, and **never report a
count without the scope that produced it** (RAT-4, and the NOTE-4 correction against this
coordinator's own earlier record).

## 10. Dependency and configuration discipline

**Verify before adding** — `@playwright/test` is already installed. Justify each addition
explicitly. Minimum necessary packages only. **No unrelated upgrades. No wholesale configuration
rewrites** where a bounded change suffices.

## 11. Scope envelope — exact authorized paths

**MAY CREATE**
```
vitest.workspace.ts                 preferred project-split mechanism
vitest.dom.config.ts                only if a workspace file cannot express the split
test/setup-dom.ts                   component-test setup, if required
playwright.config.ts
e2e/**                              exactly ONE .spec.ts plus minimal fixtures
components/**/*.test.tsx            exactly ONE proving test
```

**MAY MODIFY**
```
package.json                        devDependencies and scripts ONLY
package-lock.json                   only as a consequence of the above
.gitignore                          Playwright artifact directories ONLY
vitest.config.ts                    ONLY if a workspace file cannot express the split
tsconfig.json                       ONLY if narrowly required to type .test.tsx
```

**FORBIDDEN — no exceptions**
```
lib/dev-hq/**                       all production behavior
types/contracts/**
execution · assignment · escalation · review · evidence · orchestration logic
docs/decisions/**                   ADRs
.claude/agents/** · agents/**       agent definitions
Mission Control feature implementation
authentication · timeline / read-model implementation
NB-1 · FD-5 · RAT-5 remediation
durable ExecutionRunner work (GATE-1 / GATE-2 remain future authorizations)
Phase 2
any existing *.test.ts
any tag · any protected checkpoint or approved candidate
```

## 12. Implementation-agent communication

Launched from the Main Coordinator parent session with a **fully self-contained** prompt. The
agent must return its **full result directly to the parent session** — commit SHA, parent, tree,
changed paths, exact validation commands and outputs, all three negative-control results, final
status. It must **state any artifact path it writes** and must **not** leave its result only in
its own session. The coordinator collects and reconciles before advancing.

## 13. Candidate freeze and review sequence

Implement → verify locally → **one** implementation commit → verify exact authorized scope →
**new immutable annotated candidate tag** → detached clean review worktree at that exact tag →
**no modification after freezing** → Independent Code Review → **then** Architecture Review
(required: this package affects test architecture, package boundaries and repository-wide
configuration) → Founder approval → protected checkpoint.

**Do not pre-create the candidate tag or the protected checkpoint.**

## 14. Disposition of this uncommitted brief

**DECISION: the brief REMAINS UNCOMMITTED during implementation.**

**It cannot contaminate the implementation candidate — verified, not assumed.** Untracked files
exist only in the worktree holding them. Confirmed empirically: this brief is **untracked** in
the main worktree and **absent** from the AR2-6 implementation worktree, whereas
`SPRINT_1F_ENTRY_PACKAGE.md` — which **is tracked**, committed in `fb6f4a3` — is present there
with a matching hash. The distinction is tracked-versus-untracked, not chance.

Committing it now would also **move HEAD off `6eefff7f`**, invalidating the specified baseline.

**It will never be mixed into the implementation commit.** After PKG-2 it may be committed as a
planning-only commit under separate authorization.
