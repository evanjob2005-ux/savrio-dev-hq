# Sprint 1F Package B — Pull Request Validation Repair — Closure Record

**Author:** Main Coordinator. Documentation only; this file changes no executable behaviour.
**Date:** 2026-07-27
**Approved candidate:** `candidate-1f-pkgb-2`
**Status:** Founder-approved, both gates closed, active line advanced.

---

## 1. Package brief and authorized scope

**Objective.** Repair the `Pull Request Validation` workflow so it stops failing on
every pull request, without weakening the validation it performs.

**Authorized files — two, and only two:**

| File | Purpose |
|---|---|
| `docs/company/ORGANIZATION.md` | close the unbalanced Markdown fence |
| `.github/workflows/pr.yml` | fence-parser hardening, then BOM remediation |

**Explicitly out of scope and not done:** ruleset or branch-protection changes ·
making `Validate Pull Request` required · `frontend-tests.yml` · lockfile or npm
toolchain metadata · dependency-vulnerability remediation · deferred PKG-2 or
PKG-3 findings · ICR/AR integration findings · the `SPRINT_1F_FOLLOWUP_REGISTER.md`
governance correction · Track B · Mission Control · authentication · Phase 2 ·
worktree cleanup beyond Package B's own artifacts.

## 2. Identities

| Item | Value |
|---|---|
| Active-line base (pre-Package-B) | `0b229b7f8232e77df40b171399a6fea2f2c0fab6`, tree `c22f70b6bf13a29eb98766e8d2f3c68e3beae69e` |
| Candidate tag | `candidate-1f-pkgb-2`, annotated |
| Tag object | `04b28025090512f51eee8bcdf1e18b8dda851c3b` |
| Peeled commit | `38703aa3c67d8bd49902c78b701bdb9503544cb0` |
| Tree | `da1e7a7f4f714a3186933d81d129f87bf48d5eb4` |
| Parent | `07f5fc1099d8426491371239680e2da50af63be3` |
| Superseded candidate | `candidate-1f-pkgb-1`, object `83fd509ef93e9520b12b07a684c9f687ad76a55f`, commit `07f5fc1099d8426491371239680e2da50af63be3` — **retained, unmoved, not deleted** |

**Approved history — three commits, never amended, squashed, rebased, or cherry-picked:**

| # | Commit | Tree | Subject |
|---|---|---|---|
| 1 | `4b5d8a0d22e3274cc8b8bf3fcf181f9a7b64c858` | `68fa772a7a5580b7987b4886ccbc6ac645afafcc` | `docs(company): close the organization-chart Markdown fence` |
| 2 | `07f5fc1099d8426491371239680e2da50af63be3` | `299c90d2da340340a3abc286fc4aea5250a16d8d` | `ci(pr): count Markdown fence lines instead of a byte sequence` |
| 3 | `38703aa3c67d8bd49902c78b701bdb9503544cb0` | `da1e7a7f4f714a3186933d81d129f87bf48d5eb4` | `ci(pr): read Markdown as utf-8-sig so a BOM cannot hide a fence (PKGB-01)` |

## 3. The original defect — an unclosed fence

`docs/company/ORGANIZATION.md` opened a `` ```text `` fence at line 256 to hold the
reporting-structure chart and reached EOF at line 287 without closing it. Under the
then-production predicate `text.count("\n```") % 2 != 0` it counted **1** — odd —
and failed. It was the **only** failing file among **149** tracked Markdown
documents.

**Pre-existing.** Introduced by `97169c2 docs: establish Dev HQ governance and
agent standards` and present at the former integration base `d5e50e5`. Caused by
neither PKG-2, PKG-3, AR2-6, nor the Sprint 1F integration. It surfaced only
because the PKG-3 validation pull requests were the first pull requests ever
opened against this repository and their changed set included the file.

**The validator was correct and the document was wrong**, so the document is what
changed: one closing fence appended, nothing removed or reworded.

### Historical-failure attribution — corrected

> **16 of the 17 prior Pull Request Validation failures were caused by the unclosed
> fence in `docs/company/ORGANIZATION.md`. Run `30231210129` failed for unrelated
> missing pull-request sections.**

This supersedes any earlier statement that the fence defect caused all 17. Verified
live: run `30231210129`'s failing step is `Validate pull request description`, with
annotations `Missing required pull request section: ## Summary / ## Type of Change /
## Changes Made / ## Testing / ## Checklist`. That run never reached the Markdown
validation step.

## 4. Parser hardening (commit 2)

The predicate counted the byte sequence `"\n```"`, which has two demonstrated
defects, both reproduced by execution before the change:

| Defect | Probe | Old behaviour |
|---|---|---|
| **False positive** | balanced fence opening on line 1 | no preceding newline → counted 1, odd → **rejected** |
| **False negative** | indented unclosed fence | fence not at column 0 → counted 0, even → **accepted** |

Replaced with `fences = len(re.findall(r"(?m)^[ \t]*```", text))`. Policy, severity,
failure message, step name, job name, emitted check name and permissions all
unchanged; `re` is stdlib, so no dependency was added.

## 5. PKGB-01 BOM remediation (commit 3)

With `encoding="utf-8"` a leading byte-order mark survives as `U+FEFF` at index 0.
The predicate is line-anchored and `U+FEFF` is neither space nor tab, so a fence
opening on line 1 of a BOM-prefixed file is invisible.

Reproduced against the predicate **and encoding extracted from
`candidate-1f-pkgb-1` itself**, not a hand copy:

| Input | Count | Result |
|---|---|---|
| BOM + **balanced** line-1 fence | 1 (odd) | **rejected** — false positive |
| BOM + **unclosed** line-1 fence | 0 (even) | **accepted** — false negative |

**Three tracked documents carry a UTF-8 BOM:** `docs/company/COMPANY_CONSTITUTION.md`,
`docs/company/CORE_VALUES.md`, `docs/company/ORGANIZATION.md`. None opens a fence on
line 1, so **zero tracked files were actively failing**. This was a latent defect
closed before it could bite, not an outage fix.

**Remediation:** the `.md` reader becomes `encoding="utf-8-sig"`. The YAML and JSON
readers deliberately remain `encoding="utf-8"`. Exactly one of the five `open()`
calls in the step changed.

## 6. Local control results

Run against logic extracted from the shipped successor file, so the tests exercise
shipped code rather than a copy.

**Positive — all pass:** ordinary balanced · balanced on line 1 · indented balanced ·
**BOM + balanced line 1** · CRLF balanced.

**Negative — all correctly rejected:** ordinary unclosed · indented unclosed ·
unclosed on line 1 · **BOM + unclosed line 1** · three recognized fences.

**Sweep:** all **149** tracked Markdown files pass (previously 1 failed).

**Static:** PyYAML parses the workflow · embedded Python byte-compiles ·
`actionlint` **1.7.7** exit 0 · `git diff --check` exit 0 · worktree clean.

### Method statement — required for accuracy

> **Old-versus-new parser comparisons were local executions against the extracted
> prior predicate, not live CI A/B runs.**

No CI run ever executed the old parser against the BOM probes. Claims of
discrimination between candidate 1 and candidate 2 rest on local execution of both
predicates over identical bytes, plus live runs of the **new** parser only.

## 7. Live pull-request controls

### PR #3 — https://github.com/evanjob2005-ux/savrio-dev-hq/pull/3 (candidate 1)

| Control | Probe | Run | Result |
|---|---|---|---|
| P-1 positive | — | `30274533456` | **success** — "Changed structured and Markdown files are valid." First success in the workflow's history |
| P-1 required checks | — | `30274533198` | `Unit and Static Validation` + `End-to-End Smoke` **success** |
| N-1 ordinary unclosed fence | `fc72519a` | `30274751594` | **failure** — `Unbalanced Markdown code fences (```).` |
| N-2 indented unclosed fence | `b5f9660c` | `30274836181` | **failure** — annotation `path=docs/_pkgb-fence-probe.md` |
| N-3 / P-2 balanced fence on line 1 | `208d2d15` | `30274946220` | **success** |
| Final clean, head `bc73ca2b` | — | `30275039391`, `30275039621` | all three checks **success** |

### PR #4 — https://github.com/evanjob2005-ux/savrio-dev-hq/pull/4 (candidate 2, BOM)

| Control | Probe | Run | Result |
|---|---|---|---|
| **Positive BOM** | `4649ed72` | `30280571362` | **success** — BOM + balanced line-1 fence accepted |
| **Negative BOM** | `b5158b7d` | `30280658421` | **failure** — annotation `path=docs/_pkgb2-bom-probe.md msg=Unbalanced Markdown code fences (```).` |
| Final clean, head `9e300d74` | — | `30280768824`, `30280771338` | `Validate Pull Request`, `Unit and Static Validation`, `End-to-End Smoke` all **success** |

**Permissions as executed** (from the run logs): `Contents: read`, `Metadata: read`,
`PullRequests: read`. **Zero** comments, labels, reviews, secret uses, or write
actions across every run.

## 8. Tree equivalence and probe exclusion

| Branch | Final tree | Candidate tree | Identical |
|---|---|---|---|
| `validation/1f-pkgb-prfix` | `299c90d2da340340a3abc286fc4aea5250a16d8d` | `299c90d2…` (candidate 1) | **YES** |
| `validation/1f-pkgb2-bom` | `da1e7a7f4f714a3186933d81d129f87bf48d5eb4` | `da1e7a7f…` (candidate 2) | **YES** |

All five probe commits — `fc72519a`, `b5f9660c`, `208d2d15`, `4649ed72`,
`b5158b7d` — were reverted, and **none is an ancestor of the candidate**, verified
individually with `git merge-base --is-ancestor`. Neither
`docs/_pkgb-fence-probe.md` nor `docs/_pkgb2-bom-probe.md` appears in any tree of
the candidate. The range `0b229b7f…..38703aa3…` contains **exactly the three
approved commits**.

## 9. Review gates

### Independent Code Review — `APPROVE`

**Reviewer: Codex, acting directly in a separate reviewer session.**

**0 BLOCKER · 0 MAJOR · 0 MINOR · 0 NOTE.**

Independently verified: all candidate identities · the exact three-commit history ·
the exact one-file successor delta · correct `utf-8-sig` behaviour · unchanged
parser policy · unchanged security and permissions · live positive and negative BOM
controls · final validation-tree equivalence · absence of probe commits and files ·
the corrected 16-of-17 historical-failure attribution.

**Independence statement.** This gate was satisfied by a genuinely separate reviewer
session on a different model. It was **not** satisfied by the implementation session
or the Main Coordinator. An earlier requested AGENT-008 subagent **returned no
review output**; the review performed in the main session at that time was accepted
as **supplemental technical evidence only and did not satisfy the independent-review
role**. That failed subagent was not retried.

### Architecture Review — `APPROVE WITH NON-BLOCKING FINDINGS`

**0 blocking findings.**

| ID | Finding |
|---|---|
| `AR-PKGB2-F01` | Future JSON BOM policy or diagnostic clarification |
| `AR-PKGB2-F02` | `actionlint` was unavailable in the architecture reviewer's environment |
| `AR-PKGB2-F03` | Administrator bypass remains available through the pre-existing ruleset |
| `AR-PKGB2-F04` | Keep `Validate Pull Request` non-required until a later soak and governance decision |
| `AR-PKGB2-F05` | ICR was outstanding at the time of Architecture Review; now closed by the Codex review |

**Accepted limitations, not defects:** lightweight parity validator rather than
CommonMark · tilde fences unsupported · known nested and indented-literal
limitations · pathological double-BOM case · non-UTF-8 decode errors remain
codec-level.

## 10. Founder decisions

1. **Do not create `candidate-1f-pkgb-3`.** The candidate is accepted as-is.
2. **`Validate Pull Request` stays non-required** during Package B closure.
3. **Ruleset `19824646` is not modified.**
4. Promotion of `Validate Pull Request` to a required check is tracked as a
   **separate governance decision after real-PR soak time**.
5. The JSON BOM diagnostic item is recorded as a **deferred workflow-hardening note**.
6. The existing **administrator bypass model is accepted** for this advancement, and
   any bypass use is recorded.
7. **No accepted lightweight-parser limitation is implemented** in this package.

## 11. Repository enforcement state — unchanged by this package

| Property | Value |
|---|---|
| Ruleset | `19824646` "Sprint 1F active line protection", `enforcement: active` |
| Required contexts | exactly `Unit and Static Validation`, `End-to-End Smoke` |
| **`Validate Pull Request` required?** | **No** — deliberately, per Founder decision 2 and `AR-PKGB2-F04` |
| Bypass actor | `RepositoryRole` id 5 (admin), `bypass_mode: always` — pre-existing |
| Pull request rule | 1 approval, dismiss stale, require last-push approval, require thread resolution |
| Other rules | `deletion` and `non_fast_forward` blocked |

`Validate Pull Request` is **pull-request-only** and is **not expected to run on a
direct protected-branch update**. No run of it was manufactured or dispatched for
the advancement.
