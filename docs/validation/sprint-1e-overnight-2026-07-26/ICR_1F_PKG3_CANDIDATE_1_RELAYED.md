# Independent Code Review — Sprint 1F PKG-3, Candidate 1 — RELAYED FINDINGS ONLY

**Candidate:** `candidate-1f-pkg3-1` → commit `b7386f0521f296a5411e77e15d4dd385eb65691d`
**Date of record:** 2026-07-27
**Author of this file:** Main Coordinator

---

## ⚠ THIS IS NOT THE REVIEWER'S REPORT

**The PKG-3 Independent Code Review text does not exist in any form available to the
Main Coordinator.** This file is a custody record of the ICR's findings *as relayed
by the Founder*, not a preserved reviewer document. It must never be cited as
reviewer-authored text.

**What was searched, before this conclusion was drawn:**

| Search | Result |
|---|---|
| `find . -iname "*pkg3*"` across the repository | **zero** matches |
| `docs/validation/sprint-1e-overnight-2026-07-26/` | PKG-2 and Sprint 1E artifacts only |
| `agents/independent-code-reviewer/outputs/` | `CR_1F_TRACKA_CANDIDATE_1_REVIEW.md`, `SPRINT_1E_CODE_REVIEW.md`, `SPRINT_1E_OVERNIGHT_CR_REVIEW.md`, `SPRINT_1E_REMEDIATION_PATCH_SPEC.md` — **no PKG-3 file** |
| Working tree, untracked files | no PKG-3 review artifact |

**The Architecture Reviewer independently reached the same conclusion** and disclosed
it in its own §7:

> "The complete PKG-3 ICR report was not supplied inline and is not preserved in the
> repository (docs/validation/ contains PKG-2 artifacts only; no PKG-3 ICR file
> exists on any branch I can see). I therefore assessed the ICR findings solely from
> the summaries relayed in my instructions, independently and from primary evidence.
> **The ICR report text itself is UNVALIDATED. I did not defer to its severities.**"

**Consequences, stated plainly rather than glossed:**

1. **The ICR's verdict line is not on record.** No document or instruction stated it.
   The reconciliation therefore does **not** quote an ICR verdict, and no verdict has
   been inferred for it.
2. **The ICR's own worktree cleanliness, identity verification, probe removal, and
   validation commands are not on record.** They cannot be confirmed by the
   Coordinator. The Architecture Review's equivalents *are* on record and were
   verified.
3. **The ICR's NOTE texts are not on record** — only the count, 13, taken from the
   Architecture Review's §11 comparison table.
4. **Nothing below has been reconstructed, paraphrased into reviewer voice, or
   invented.** Where the substance is known it is because the Founder relayed it or
   the Architecture Reviewer restated it while disposing of it.

---

## Counts, as recorded by the Architecture Review §11 ("ICR (relayed)")

| Severity | Count |
|---|---|
| BLOCKER | **0** |
| MAJOR | **1** |
| MINOR | **5** |
| NOTE | **13** |

**Verdict: NOT ON RECORD.**

---

## MAJOR-1 — relayed substance

**No branch protection, no rulesets, no required status checks; a failing run blocks
nothing.**

Independently confirmed twice — by the Architecture Reviewer and by the Main
Coordinator — via `gh api …/branches/feature%2Fdev-hq-operating-system/protection`
→ `404 Branch not protected`, and `gh api …/rulesets` → `[]`.

Both gates agree: real, **outside the one-file candidate scope**, **not a
candidate-code defect**, **not grounds for re-freeze**, and acceptable only with a
mandatory post-integration repository-settings action.

---

## MINOR-1 through MINOR-5 — relayed substance

Each is stated as relayed and as restated by the Architecture Reviewer while
disposing of it. The ICR's own wording is unavailable.

| ID | Relayed substance | AR disposition |
|---|---|---|
| **MINOR-1** | `if-no-files-found: ignore` can yield a green upload step with no artifact and no warning; should be `warn` | **Valid, and upgraded from theoretical to empirically demonstrated.** NC-4, NC-5B and NC-6B each failed the E2E job, fired the upload step under `if: failure()`, and produced **0 artifacts** with the step reporting success and no warning — three real occurrences. Never converts red to green; diagnostics-quality. Follow-up, not remediation |
| **MINOR-2** | `if: always()` on hygiene means cancelled runs continue through hygiene; should be cancellation-aware | **Valid, very low impact.** Cannot produce a wrong verdict; slightly delays cancellation. `!cancelled()` is strictly more correct. Follow-up |
| **MINOR-3** | E2E preconditions check `playwright` but not `next`, though webServer invokes Next.js | **Valid as observation; risk assessed lower.** `npm run build` fails closed if `next` were absent, so the registry-fallback hazard is unreachable and no false green is possible. **Downgraded to NOTE** (AR N-10). Follow-up for diagnostic symmetry |
| **MINOR-4** | Concurrency cancellation was never directly exercised | **Valid and confirmed** — no run in the repository has conclusion `cancelled`. Should not gate approval, but the record must not claim it was proven. **NOT PROVEN** |
| **MINOR-5** | The tag annotation claims all six prior workflows trigger only on `main`/PRs to `main`, but `pr.yml` triggers on PRs to any branch and ran during validation | **Valid, and materially worse than stated.** `pr.yml`'s `on: pull_request:` declares `types:` with **no `branches:` filter**, and it ran **17 times during this campaign, failing every time**. Documentation correction — **mandatory**. No re-freeze, no tag replacement. See the correction record in the reconciliation |

---

## Obligation

**If the ICR text is recoverable** — from the reviewer session transcript or any other
custody — it should be preserved here as reviewer-authored material, replacing this
file's relayed summaries, and this notice removed. Until then the PKG-3 evidence set
carries **one** complete independent gate on record (the Architecture Review) plus
relayed findings from a second whose text was lost before preservation.

This is the third occurrence in Sprint 1F of an inline-only review nearly or wholly
lost before preservation (PKG-2 ICR, PKG-2 AR, PKG-3 ICR). The
review-brief correction already recorded in
[`SPRINT_1F_FOLLOWUP_REGISTER.md`](./SPRINT_1F_FOLLOWUP_REGISTER.md) addresses the
cause; this occurrence is evidence that it is not yet fully effective.
