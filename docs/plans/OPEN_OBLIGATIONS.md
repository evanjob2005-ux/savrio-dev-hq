# Open Obligations Register

**Document ID:** OBL-001
**Created:** 2026-07-28
**Status:** Active
**Owner:** Founder (reassignment permitted)

---

## Purpose

Work that is known, accepted, and **not yet done**. Every item here was
identified by a named review or verification step and deliberately deferred
rather than dropped. Nothing in this register is a defect in working behaviour;
each is a gap between what a control claims and what it currently enforces, or a
follow-up whose right time has not arrived.

This register exists because the alternative is a review finding living only in
a pull request comment, where it is invisible six weeks later. An item leaves
this file when it is done and its proof is recorded, not when it stops being
mentioned.

**Ordering is by consequence, not by severity label.** The first two items
determine whether the security gates keep meaning what they say.

---

## Repository and platform settings

| ID | Obligation | Why it matters | Proof of completion |
|---|---|---|---|
| **OBL-01** | Raise `required_approving_review_count` back to **1** in the `Sprint 1F active line protection` ruleset once a second reviewer exists. | Lowered to 0 on 2026-07-28 because the single collaborator is also the author of every pull request, and GitHub does not permit self-approval — the requirement was unsatisfiable, not protective. At 0, nothing human gates a merge. | Ruleset shows `required_approving_review_count: 1` and a merged pull request carries an approval from someone other than its author. |
| **OBL-02** | Re-enable Renovate `automerge` for non-major devDependencies **only after** OBL-01. | Currently `false`. With a 0-approval gate on a public repository, auto-merge would put a compromised build-tooling release into the default branch unattended. | `renovate.json` sets `automerge: true` and the ruleset requires a review. |
| **OBL-04** | Enable code-owner review enforcement in the ruleset. | `.github/CODEOWNERS` assigns `@evanjob2005-ux` to 31 paths, but assignment is not enforcement. Until this is on, the protected files named in Binding Operating Kernel rule 9 are not actually gated. | Ruleset shows `require_code_owner_review: true`. |

---

## Security controls — the two that matter most

| ID | Obligation | Why it matters | Proof of completion |
|---|---|---|---|
| **OBL-05** (RR-05) | The guard rule's message claims `rejectInternalDevRequest` must be called **as the first statement**; the rule does not enforce ordering. Each `pattern-not` opens with `...`, so a handler doing unauthenticated work *before* the guard still matches the exclusion and is not reported. | A route could delete data before authenticating and pass the gate that exists to prevent exactly that. No fixture covers this class, so the positive control would not catch a regression either. | A fifth fixture with pre-guard work, detected by the rule; or the message softened to match what is enforced. |
| **OBL-06** (RR-03) | `.env` credential detection still has name-coverage gaps beyond those closed on 2026-07-28. | Template `.env.*.example` files are exempt from the filename rule, so variable-name coverage is the only control on their contents. | A fixture template carrying a real value for each uncovered variable shape fails the job. |
| **OBL-07** (RR-02) | The `scanner:allow-secret` pragma is honoured but undocumented outside the workflow. | An escape hatch nobody knows about is an escape hatch nobody uses; the next false positive becomes a rule weakening, which is how the original CR-01 defect was introduced. | Documented in `SECURITY.md` or the testing standard. |
| **OBL-08** (RR-07) | `.semgrep/fixtures/*.ts` are deliberately defective and escape `tsc` only because TypeScript's include globs do not descend into dot-directories. | Renaming `.semgrep/` to a non-dotted path would silently pull four broken files into the build. The exemption is incidental, not declared. | An explicit `exclude` entry in `tsconfig.json`. |

---

## Build and test infrastructure

| ID | Obligation | Why it matters | Proof of completion |
|---|---|---|---|
| **OBL-09** (CR-12) | Regenerate and validate `package-lock.json`. | `npm@11.16.0` is pinned in **two** workflows to work around a lockfile that `npm 10.9.4` cannot install. It is a pin, not a repair, it is now load-bearing in two places, and it will drift. | Both pins removed and `npm ci` succeeding on the Node-bundled npm. |
| **OBL-10** (CR-13) | Replace `waitForLoadState("networkidle")` in `e2e/mission-control-viewport.spec.ts`. | Playwright discourages it, and Mission Control polls every 3 seconds. It passes today only because the 403s return instantly. It becomes flaky the moment the API is un-blocked — which is exactly what OBL-11 does. | Web-first assertions on rendered elements; suite green. |
| **OBL-20** | Add a runtime smoke test for the Trigger.dev realtime transport. **Close before deploying, not merely before merging.** | Review traced the reachable path more precisely than first recorded: the `socket.io` and `engine.io` *server* packages are provably never imported by this application (0 imports against a positive control finding 6 `socket.io-client` imports). The live path is `@trigger.dev/sdk` → `socket.io-client` → `engine.io-client` → **`ws` 8.17.1 → 8.21.1**, and that `ws` bump is the actual exposure. Narrower than feared, but still unproven: nothing in 392 unit tests, the build, or 8 e2e tests opens a realtime connection, so realtime is working-by-assumption. | A test that establishes a Trigger.dev realtime subscription, **asserts the transport negotiated to `websocket`** (a long-polling fallback would exercise `xmlhttprequest-ssl` and prove nothing), and receives an event. |
| **OBL-24** (A-09) | Add the audit re-proof to OBL-09's completion condition. | Regenerating the lockfile means re-resolving under a different resolver, and overrides interact with peer resolution — the exact mechanism the npm pin exists to work around. Also: the pin is applied in `ci.yml` and `frontend-tests.yml` but **not** in `dependencies.yml`. Whether npm 10.9.4 can build an ideal tree from this lockfile is unverified. | OBL-09 states the audit re-proof. (The npm-pin half is done: `dependencies.yml` now pins npm 11.16.0 like `ci.yml` and `frontend-tests.yml`.) |
| **OBL-25** | Re-attempt **ESLint 10** when `eslint-config-next` ships a compatible plugin set. | Blocked upstream, verified by execution: `eslint-config-next@16.2.11` bundles an `eslint-plugin-react` that calls `context.getFilename()`, removed in ESLint 10. Lint exits 2 with `TypeError: contextOrFilename.getFilename is not a function`. Its peer range declares `eslint: >=9.0.0`, which is **wrong**. Worth re-attempting because ESLint 10 shrinks the overrides block from 10 parents to 5 — `eslint-config-next` becomes the single parent needing a `minimatch` pin. | `npm run lint` exits 0 on ESLint 10, and the override block reduces accordingly. |
| **OBL-26** | Re-attempt **TypeScript 7** when `typescript-eslint` supports it. | Blocked upstream, verified by execution: `tsc --noEmit` passes cleanly under TS 7.0.2, but lint exits 2 with `typescript-eslint does not support TS 7.0`. Tracking: typescript-eslint#10940. The type-checking half is already ready; only the lint integration blocks. | `npm run lint` and `tsc --noEmit` both exit 0 under TypeScript 7. |
| **OBL-27** | Reconsider the npm 11.16.0 pin now that CI runs Node 24. | The pin exists because Node 22 bundles npm 10.9.4, which cannot resolve this lockfile. Node 24 bundles npm 11.x, so the pin in three workflows may now be unnecessary. Folds into OBL-09 and OBL-24. | `npm ci` succeeds on Node 24's bundled npm with all three pins removed. |
| **OBL-11** | Close the Mission Control exit-gate evidence gap. | `proxy.ts` fails the whole `/api/dev-hq/*` surface closed in production and the e2e harness serves a production build, so **live progress, approvals, and blockers are never exercised**. The gate is partially evidenced: shell, layout, and viewport only. | E2E covering approval and blocker paths against a live data layer. |
| **OBL-21** | Evaluate an `@opentelemetry/core` override to `^2.8.0`. | All 13 remaining production advisories are **one advisory counted thirteen times**: GHSA-8988-4f7v-96qf, unbounded memory allocation in W3C Baggage propagation, moderate, CVSS 5.3. The other twelve carry no advisory of their own and inherit it. Below the gate threshold and correctly not blocking, but it is the sole remaining production root cause. | OTel 1.x → 2.x spans eleven packages; needs the same test treatment the high-severity overrides received before it lands. |

---

## Provenance and governance

| ID | Obligation | Why it matters | Proof of completion |
|---|---|---|---|
| **OBL-12** | Re-save `Viybd_HQ_Master_Roadmap_v10.4_Binding_Operating_Kernel.docx` to include the six repository deltas, and refresh its stale `dc:title`/`dc:description` (still say v10.3). | The repository file and the `.docx` differ by the kernel preamble insertion and amendments A-1..A-5. Until the source is re-saved, the "the `.docx` governs" rule is suspended for those six deltas. | Source hash re-registered with no suspension clause. |
| **OBL-13** | Add a CI check recomputing the roadmap body SHA-256 from the boundary to EOF and comparing it to the registration record. | The record's entire authority rests on that hash, and nothing currently prevents it going silently stale. | A failing build when the body changes without the hash. |
| **OBL-14** | Apply the `claude-design` → `design-engineer` rename to `docs/governance/CURRENT_PROGRESS_UPDATE.md` **when CPU-001 is next revised** — not before. | Classified as a dated evidence record and correctly left unedited, but the roadmap designates it the carrier of live implementation state while its header pins it to a superseded commit. The tension resolves on next revision, not by editing a snapshot. | CPU-001 revised, rename applied in the same pass. |
| **OBL-15** | Resolve the roadmap's authority tier (register **X-8**) and whether the Section 23 kernel supplements or overrides `AGENTS.md`. | `AGENTS.md` enumerates eight authority tiers and contains no roadmap tier, yet the roadmap asserts one. Both are Founder decisions. | Recorded decision in `AUTHORITY_AND_CONTRADICTION_REGISTER.md`. |
| **OBL-16** | Decide the **Savrio → Viybd** rename. | Roadmap v10.4 says Viybd throughout; `AGENTS.md`, the repository name, the Mission Control UI, and every other governed document say Savrio. | Recorded decision, and a coordinated pass if the answer is yes. |
| **OBL-17** | Preserve the roadmap conversion script or intermediate artifacts. | The registration record states two historical body hashes (`d789…`, `1720…`) that **cannot be reproduced** from this repository — no artifact preserves those file states. Both are recorded as unverified claims. | Conversion reproducible from a committed artifact. |

---

## Process

| ID | Obligation | Why it matters | Proof of completion |
|---|---|---|---|
| **OBL-18** | Reduce planning-artifact volume per sprint. | Sprint 1F carries **7,529 lines across ten planning documents** for work not yet shipped, including separate advisory, decision, and reconciled-decision records for a single track. Roadmap §9 now requires gates be proved by executable checks rather than prose; the artifact count has not yet followed. | A sprint completed with one entry package, one decision record, one validation report. |
| **OBL-19** | Create `handbooks/` files for the **9 of 19** `AGENT.md` role definitions whose referenced handbook does not exist. | Pre-existing and not worsened by recent work, but those roles operate without the standard they cite. Missing: associate-software-engineer, database-architect, independent-code-reviewer, lead-software-engineer, product-owner, qa-engineer, reliability-engineer, research-analyst, security-engineer. | Every `AGENT.md` handbook reference resolves. |

---

## Closed

| ID | Obligation | Closed | Evidence |
|---|---|---|---|
| OBL-03 | 42 npm advisories, 20 high/critical, 7 in production | 2026-07-28 | Resolved by eight `overrides`; 0 high / 0 critical at both scopes, no downgrades, no direct dependency changed. **Correction retained:** the first attempt claimed the fix was upstream-only and proposed accepting all 20 for 90 days — that claim was false and independent review disproved it by construction. |
| OBL-22 | Overrides had no exit path | 2026-07-28 | Overrides parent-scoped and folded into their parents' Renovate groups; a dedicated `matchDepTypes: ["overrides"]` rule labels override updates so accumulation is visible. Removal rule recorded in the `//overrides` note. |
| OBL-23 | Whole-tree audit did not run on pull requests | 2026-07-28 | `dependencies.yml` no longer skips `npm-audit` on `pull_request`; the proof is now bound to the candidate rather than running only after merge. |
| CR-01 | Credential scanner filtered by file kind | 2026-07-28 | Rewritten to judge value shape; 8 constructed bypass cases detected, 0 findings across 381 files |
| CR-02 | `.env` template widening left unquoted secrets unflagged | 2026-07-28 | Unquoted-assignment rule added; real value caught, empty and placeholder exempt |
| CR-03 | Renovate auto-merge unsafe | 2026-07-28 | `automerge: false`; carried forward as OBL-02 |
| CR-05 | Provenance record contradicted its own delta set | 2026-07-28 | Corrected to five amendments / six deltas; body hash re-derived independently |
| CR-06 | Guard rule had three false-negative classes | 2026-07-28 | All four handler shapes matched, bind-and-return enforced, positive control asserts fixture-to-rule mapping |
| CR-07 | E2E discarded every resource-load failure | 2026-07-28 | Structured response events; proven non-vacuous with a negative control |
| CR-08 | Rename left dead paths in forward-looking documents | 2026-07-28 | 30 → 7 references; remainder in dated evidence records only |
| CR-09/10/11 | Semgrep unpinned, unanchored, mislabelled severity | 2026-07-28 | Pinned to 1.145.0, patterns anchored, severity raised to ERROR |
| RR-01 | Placeholder prefix-anchoring exempted real credentials | 2026-07-28 | Prefix now paired with shape and entropy tests; four reviewer bypass cases detected |
| RR-04 | Positive control asserted a count, not a mapping | 2026-07-28 | Asserts the exact `(path, rule)` pair set |
| RR-06 | Console listener removed, trading one blind spot for another | 2026-07-28 | Restored unfiltered alongside structural response assertions |
