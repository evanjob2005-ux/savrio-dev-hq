# Sprint 1E Remediation — Candidate `3daf0790…` Freeze Record

**Status:** FROZEN FOR INDEPENDENT CODE REVIEW. **UNCOMMITTED. UNSTAGED.**
**Created:** 2026-07-26 · new artifact; no existing record was modified.

**Supersedes for sequencing:** `CANDIDATE_FINAL_FREEZE.md` (`ffc805f6…`) and
`CANDIDATE_C1_FREEZE.md` (`9d56ed51…`). Both remain in the evidence package as
**historical evidence for their own candidates only**. Neither certifies this tree.

---

## 1. Identity

| Item | Value |
|---|---|
| **Full-candidate hash** | **`3daf07906d685c91458668c3956354097ba03f6cc8c6c6c73287c0f78236c3f4`** |
| Diff scope | `git diff -- lib/ types/` |
| HEAD | `fe7fab1252df8a20fcfd1e1852cf70e5d85ecf39` |
| Protected baseline tag | `sprint-1e-baseline` → `62f629128e5092f593ff494cd729fe516694bbde` (**unmoved**) |
| Branch | `validation/sprint-1e-overnight-2026-07-26` |
| Diffstat | **+557 / −35**, 10 files |
| **Staged** | **0 files** |
| Frozen artifact | session scratchpad `CANDIDATE_3daf.diff` |

**⚠️ UNCOMMITTED.** No remediation commit exists. Nothing may be staged or committed
until Independent Code Review → Architecture Review → Founder Approval all complete.

---

## 2. Contents

| Unit | Defects | Status |
|---|---|---|
| C1 | AR2-1, X1 (partial), X3, X4, X2 | Applied |
| C2 | F1, X2b, D1 | Applied |
| C3 | F4, D2 | Applied |
| C4 | AR2-4 | Applied |
| Follow-up 1 | **MAJOR-1** — surviving X1 decline path (sixth emission site) | Applied |
| **Follow-up 2** | **MAJOR-2** — false-assurance in the MAJOR-1 regression test | **Applied** |
| Documentation | Comment corrections 9–10; Amendment 6 corrections | Applied |

---

## 3. Modified files — 10, all in scope

```
 lib/dev-hq/adapters/dev-execution-runner.test.ts |   2 +-
 lib/dev-hq/adapters/dev-execution-runner.ts      |   7 +-
 lib/dev-hq/agent-execution-service.test.ts       | 292 ++++++++++++++++++++++-
 lib/dev-hq/agent-execution-service.ts            | 136 ++++++++++-
 lib/dev-hq/constants.ts                          |  10 +
 lib/dev-hq/escalation-service.ts                 |   7 +-
 lib/dev-hq/execution-manager.test.ts             |  75 +++++-
 lib/dev-hq/execution-manager.ts                  |  43 +++-
 lib/dev-hq/review-service.ts                     |   8 +-
 types/contracts/execution-runner.ts              |  12 +-
 10 files changed, 557 insertions(+), 35 deletions(-)
```

No ADR modified. No configuration modified. **0 leaked build artifacts.**

### Per-file SHA-256

| SHA-256 | File |
|---|---|
| `7c10c0a73edf29d9bb65aeaa91e4ce558e026e27cc771cf1ab3cda28aaa741c9` | `lib/dev-hq/constants.ts` |
| `8ae02cdae14d337237198ec8dfcb314c0ac467e99da832b08bf4f0ea9f99aa3a` | `lib/dev-hq/agent-execution-service.ts` |
| `89d5dd7b7c9288b76954290069aa8fadcbdcaeae74b08b7ec6bc9a24dc817f64` | `lib/dev-hq/agent-execution-service.test.ts` |
| `f5857d412fdcc31800bf8c4e7c55692aba95a8a8b666e7793a1d0788c2c80907` | `lib/dev-hq/execution-manager.ts` |
| `77cac31bdcadcb38daa5c097876de7795a69e3b992a77421cfbd4a19f2900645` | `lib/dev-hq/execution-manager.test.ts` |
| `284b97d23ab331878c14ed6e0c883635a1ab099d50e7cb5806d354764d58cb1c` | `lib/dev-hq/review-service.ts` |
| `6231cbab6ede7e81b35f372e202f83b2a66a33474737e68151de7115b4918f7f` | `lib/dev-hq/escalation-service.ts` |
| `765a7ea15fa2605bc0fdf487cc636d11729426470a7d5e44c8e9364e8feb101f` | `types/contracts/execution-runner.ts` |
| `bc7eab76ab37c48f4df8d1567d3a91a4a95ca78d03b0dde3f4243e868a3d2ea7` | `lib/dev-hq/adapters/dev-execution-runner.ts` |
| `d9418f68892f941f89e94819b5568e4e14e5efa45af51cac12c31c22563a5477` | `lib/dev-hq/adapters/dev-execution-runner.test.ts` |

---

## 4. Delta since `ffc805f6…` — exactly two files

Verified by per-file hash comparison against the `ffc805f6…` freeze record. **Eight of
ten files are byte-identical.** Only these changed:

| File | Change |
|---|---|
| `lib/dev-hq/agent-execution-service.ts` | **Comment-only** — see §5 |
| `lib/dev-hq/agent-execution-service.test.ts` | MAJOR-2 regression test added (+77 lines) |

---

## 5. CONFIRMED: the source delta is comment-only

Verified mechanically by extracting the per-file hunk from both frozen diff artifacts and
filtering the delta for non-comment added lines. **Result: zero executable code changed.**

The delta is exactly two documentation corrections:

1. `"it is the condition the five call sites share"` → **`"the six"`**
2. Site enumeration extended: `"sites 2 and 6 cannot, being enclosed by a queued check"` →
   **`"sites 2, 3 and 6 cannot"`**, with an added note that site 3
   (`reconcileQueuedDispatches`) opens its loop with
   `if (execution.status !== "queued") continue;` and is therefore enclosed exactly as
   sites 2 and 6 are — closing the gap AR-1E's ruling table left between sites 2 and 4.

**No production behaviour changed beyond the previously approved remediation.**

---

## 6. MAJOR-2 — the defect, the test, and the negative control

### The defect

The MAJOR-1 regression test asserted `toHaveLength(1)` after a sweep that runs **both**
the reclaim loop and `reconcileQueuedDispatches`. Both emit for the same
`(execution, attempt)`, and the dedupe key collapses them to one event — so the assertion
was satisfied by **either** source. Deleting the reclaim loop's emission left the test
green. It had stopped detecting the defect it existed to pin.

### The new test

`lib/dev-hq/agent-execution-service.test.ts:1623` —
*"emits the requeue deferral from the reclaim loop, before the sweep runs"*

The two sites cannot be separated by capacity — they decline for the same reason in the
same sweep. They **can** be separated by **order**: the reclaim loop emits inline as it
processes each execution, and only afterwards does `handleExecutionReclaim` call
`reconcileQueuedDispatches`. With two stranded executions the deferrals therefore
**interleave** with the `reclaimed` events. If the reclaim-loop emission is deleted, both
deferrals are written later by the sweep — after every `reclaimed` event — and the
ordering inverts.

Discriminating assertion:
```ts
expect(Math.min(...deferralIdx)).toBeLessThan(Math.max(...reclaimedIdx));
```

### Negative-control result — EXECUTED, not reasoned

| Step | Result |
|---|---|
| Backup taken, hash verified | `8ae02cdae14d337237198ec8dfcb314c0ac467e99da832b08bf4f0ea9f99aa3a` |
| Mutation | Line 1137 (reclaim-loop emission, site 6) commented out — **only that line** |
| Test result under mutation | **FAILED — `AssertionError: expected 6 to be less than 5`** |
| Restore | From hash-verified backup |
| **Post-restore file hash** | **`8ae02cda…` — BYTE-IDENTICAL ✅** |
| **Post-restore candidate hash** | **`3daf0790…36c3f4` — restored exactly ✅** |
| Positive control after restore | **PASSED** |

The failure mode is exactly the inversion the test predicts, which demonstrates **real
negative-control protection** rather than a test that merely passes on the current
implementation.

---

## 7. Gate results — all five pass

| # | Gate | Result |
|---|---|---|
| 1 | `npx tsc --noEmit` | **exit 0**, no diagnostics |
| 2 | `npx eslint .` | **exit 0**, no diagnostics |
| 3 | Targeted remediation tests | **3 files, 97 tests passed** |
| 4 | `npx vitest run` | **22 files, 322 tests passed** |
| 5 | `npx next build` | **exit 0**, compiled successfully, 18/18 static pages, all routes |

Actual counts reported from command output, not assumed.

**Test-count trajectory:** baseline 317 → C1 318 → C1–C4 320 → MAJOR-1 321 → **MAJOR-2 322.**

---

## 8. Audit findings

| Question | Answer |
|---|---|
| Diff contains only authorized changes? | **Yes** — 2 files changed since `ffc805f6…`; 8 byte-identical |
| New test targets MAJOR-2 correctly? | **Yes** — discriminates by emission order |
| Test fails under negative control? | **Yes** — executed, `expected 6 to be less than 5` |
| Production behaviour changed beyond approved remediation? | **No** — delta is comment-only |
| HEAD and `sprint-1e-baseline` unchanged? | **Yes** — `fe7fab1` / `62f6291` |
| Anything staged? | **No** — 0 files |
| Partial, duplicated, conflicting, out-of-order application? | **None** |
| Any change outside approved scope? | **No** |

---

## 9. Port change — carried disclosure

C2 widens `claimExecution` and `runExecution` to `Promise<Execution | null>` in
**`types/contracts/execution-runner.ts`**. ADR-0001 D7 designates those compare-and-set
semantics as *"a concurrency contract to meet"* for a future durable adapter — this is a
**port change, not an internal refactor**. Both prior reviewers supported it: a contract
promising an `Execution` from an operation that can legitimately lose a race is one no
future adapter could truthfully implement. **Deferred to AR2-6 by AR-1E's ruling:** making
`assignmentId` required on the three callback handlers belongs with this as one coherent
port revision, not split across packages.

---

## 10. Evidence manifest

| Artifact | Path |
|---|---|
| **This freeze (current)** | `docs/validation/sprint-1e-overnight-2026-07-26/CANDIDATE_3DAF_FREEZE.md` |
| Prior freeze — `ffc805f6…` (historical) | `docs/validation/sprint-1e-overnight-2026-07-26/CANDIDATE_FINAL_FREEZE.md` |
| Prior freeze — `9d56ed51…` (historical) + mutation addendum | `docs/validation/sprint-1e-overnight-2026-07-26/CANDIDATE_C1_FREEZE.md` |
| Fresh CR of `9d56ed51…` + post-review addendum | `docs/validation/sprint-1e-overnight-2026-07-26/FRESH_CR_1E_REVIEW.md` |
| Patch specification, amendments, AR rulings | `agents/independent-code-reviewer/outputs/SPRINT_1E_REMEDIATION_PATCH_SPEC.md` |
| Issue matrix, shared policy, port disclosure | `docs/validation/sprint-1e-overnight-2026-07-26/ISSUE_MATRIX.md` |
| Workflow diagnosis (7 fresh-spawn failures) | `docs/validation/sprint-1e-overnight-2026-07-26/WORKFLOW_DIAGNOSIS.md` |
| Overnight validation report | `docs/validation/sprint-1e-overnight-2026-07-26/VALIDATION_REPORT.md` |
| Run ledger | `docs/validation/sprint-1e-overnight-2026-07-26/RUN_LEDGER.md` |
| Overnight CR / AR reviews | `agents/*/outputs/SPRINT_1E_OVERNIGHT_*.md` |
| Frozen diff — current | scratchpad `CANDIDATE_3daf.diff` |
| Frozen diff — `ffc805f6…` | scratchpad `CANDIDATE_FINAL.diff` |
| Frozen diff — `9d56ed51…` | scratchpad `CANDIDATE_C1.diff` |

---

## 11. Required sequence — current position

1. ~~Freeze candidate `3daf0790…`~~ ✅ **this document**
2. **Independent Code Review of the entire candidate** ← next, from a separate clean session
3. Architecture Review
4. Founder Approval
5. Staging / commit / protected baseline

**Prior reviews do not certify this tree.** The `9d56ed51…` review covered C1 only and its
own addendum says so. No review has yet examined C2, C3, C4, MAJOR-1, or MAJOR-2.

**Reviewer instruction:** the MAJOR-2 test must be inspected **directly** and confirmed to
provide real negative-control protection rather than merely passing on the current
implementation. §6 records the coordinator's executed negative control; the reviewer should
verify that independently rather than accept it.
