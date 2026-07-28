# Sprint 1E — Specification Amendment Report (post-C1 re-anchoring)

**Document ID:** SPEC-AMEND-1E-RPT
**Author:** SPEC-AMEND-1E, standing in for CR-1E (unreachable from that session)
**Authority:** Founder decision D-2, 2026-07-26; Founder authorization of the MAJOR-A / MAJOR-B /
MINOR-A follow-up, 2026-07-26
**Date:** 2026-07-26 (revised same day after the follow-up authorization)
**Status:** Amendment 4 and Amendment 5 both applied to the specification. No further
specification change is authorized or made.

**Document amended:** `agents/independent-code-reviewer/outputs/SPRINT_1E_REMEDIATION_PATCH_SPEC.md`
**Amendments applied in that file:**
- "Amendment 4 (SPEC-AMEND-1E) — post-C1 re-anchoring", plus in-place `⟶ Amendment 4`
  annotations. (D-2)
- "Amendment 5 (SPEC-AMEND-1E) — authorized corrections to Amendment 4", plus in-place
  `⟶ Amendment 5` annotations. (MAJOR-A / MAJOR-B / MINOR-A)

**Section 9 of this report carries the exact old text and exact new text, verbatim, for each of
the three Amendment 5 corrections** — the Founder-required record that CR-FRESH-1E verifies
against. **Section 11 carries the same record for Amendment 6's 12 items.**

> **Amendment 6 added 2026-07-26 (Founder, ~11:55 local; scoped by CR-FULL-1E).** Restores the
> specification's ability to reproduce the shipped candidate after an authorized follow-up
> landed mid-review. **Two premises in the scoping brief did not survive verification against
> the tree — a test count and a set of freeze hashes. Both are corrected, with evidence, in
> §11.1 and §11.7.** Read those before accepting any number in this report.

**Note on this report's location.** The Founder specified
`agents/lead-software-engineer/outputs/`. Recorded there as instructed. For the record, an
argument exists for `agents/independent-code-reviewer/outputs/` alongside the specification
itself, since this amendment was authored standing in for CR-1E. A single copy is written, to
avoid a duplicate source of truth; relocation is the Founder's call.

---

## 1. Authorization and scope

**Authorized:** inspect the post-C1 tree; amend only the stale or unsafe anchors associated with
**MAJOR-1**, **MAJOR-2** and **MINOR-1**; update the specification; report.

**Not authorized:** modify source or test files; apply C2/C3/C4; review or certify my own
amendments; broaden remediation scope; resolve unrelated findings.

**Scope classification of what I actually changed**, stated plainly rather than blended:

| Class | Sections |
|---|---|
| **In scope** — MAJOR-1 | §4.2 |
| **In scope** — MAJOR-2 | §2.6, §2.8 (heading), §4.1 |
| **In scope** — MINOR-1 | §3.3 (insertion anchor) |
| **In scope** — explicitly directed by the assigning brief | §1.9 `UNCERTAIN` note resolution |
| **Supporting documentation of the above** | Status header, AMENDMENTS pointer, Amendment 4 audit section |
| **Outside the narrowed scope; verified, no error found** | §2.5, §2.8 tail reference, §3.3 import annotation |
| **Outside the narrowed scope AND erroneous** | Blast-radius `reconcileQueuedDispatches` note; double-blank-line note |

Sections 2 and 3 below give the six required fields for every changed section. Section 4 records
the erroneous out-of-scope items. Section 5 records an open defect I am not authorized to fix.

**Anchor convention used throughout:** the amendment's governing instruction to the applier is
*"prefer the FIND text over every line number in this document."* Line numbers are corroboration;
FIND text and structural description are the contract.

---

## 2. Anchor changes — in scope

### 2.1 §4.2 — New regression, AR2-4 (MAJOR-1)

| Field | Detail |
|---|---|
| **Section changed** | §4.2 "New regression — AR2-4", `lib/dev-hq/agent-execution-service.test.ts` |
| **Old anchor** | `INSERT after the test closing at line 1506` |
| **New anchor** | INSERT inside `describe("queued execution recovery", ...)` at its body level (4-space indent), immediately after the closing `    });` of `it("does not sweep founder-request executions", async () => {` — the last test in that block — and immediately before the `  });` that closes the `describe` itself. |
| **Surrounding unique context** | `describe("queued execution recovery", ...)` occurs once in the file. `it("does not sweep founder-request executions", async () => {` occurs once. In the applied tree the test body ends `expect(triggerMock).not.toHaveBeenCalled();` / `    });` at 1637-1638, followed by `  });` at 1639 closing the describe and `});` at 1640 closing `describe("agent execution service", ...)`. |
| **Why the old anchor became unsafe** | At `6301c06`, line 1506 was the closing `      });` of `it("recovers the loser of a pre-claim race for a capacity-one agent", ...)`. C1's §1.9 consumed that same anchor, and C1 shifted the file +37 lines at that point. In the applied tree, `:1506` is `      // The first worker wins the claim; the second cannot start.` — **mid-body of that test**. Applying literally would nest a complete `it(...)` inside another `it(...)` callback. That construct is valid JavaScript and valid TypeScript, so `npx tsc --noEmit` and `npx eslint .` both pass; only `npx vitest run` detects it. Two of three gate checks return a false green. |
| **Patch meaning unchanged** | Confirmed. The `it(...)` payload is byte-identical — not one character of the test body, its assertions or its comments was touched. It remains in `describe("queued execution recovery", ...)`, the same block C1's §1.9 test was placed in; only its position within that block moved, from after the third-from-last test to after the last. Test count and ordering semantics are unaffected: Vitest does not order-couple sibling `it(...)` calls, and this test seeds its own task and dispatch. Expected end state remains 22 files / 320 tests. |

Additional note recorded in the specification: the structural anchor is deliberate, because **C2's
§2.8 edits this same file earlier than this insertion point** (replacing 3 lines with ~42), so any
line number restated for C4 would be stale a third time by the time C4 ran.

### 2.2 §2.6 — `handleExecutionRunning` absorbs (MAJOR-2)

| Field | Detail |
|---|---|
| **Section changed** | §2.6, `lib/dev-hq/agent-execution-service.ts` |
| **Old anchor** | `(737-744)` |
| **New anchor** | `785-792`, struck old value retained; applier directed to match by FIND text |
| **Surrounding unique context** | `const execution = await runExecution(executionId);` occurs **exactly once** in the file (`:785`). `` `Execution ${execution.id} claimed and running.` `` likewise occurs once (`:790`). The block sits inside `export async function handleExecutionRunning(` (signature at `:768`), immediately after the `if (existing.status !== "queued") { return existing; }` replay guard at `:781-783`. |
| **Why the old anchor became unsafe** | `737-744` was correct at `6301c06`, verified by `git show 6301c06:lib/dev-hq/agent-execution-service.ts` (the `runExecution` call is at HEAD `:737`). C1 inserted 44 lines at `:193` and 4 at `:727`, shifting this region **+48**. |
| **Patch meaning unchanged** | Confirmed. FIND and REPLACE payloads untouched. The FIND text is unmodified by C1 and matches the applied tree verbatim, so a text-matching applier already landed correctly; only the stated number was wrong. Nothing about what the patch does changed. |

### 2.3 §2.8 — X2b (MAJOR-2)

| Field | Detail |
|---|---|
| **Section changed** | §2.8 heading, `lib/dev-hq/agent-execution-service.test.ts` |
| **Old anchor** | `agent-execution-service.test.ts:1474-1476` |
| **New anchor** | `1511-1513`, struck old value retained; applier directed to match by FIND text |
| **Surrounding unique context** | `/not available to claim/` occurs **exactly once** in the file (`:1513`). The three-line FIND block sits inside `it("recovers the loser of a pre-claim race for a capacity-one agent", ...)`, within `describe("queued execution recovery", ...)`, immediately after the `// The first worker wins the claim; the second cannot start.` comment and the winning `handleExecutionRunning(...)` call at `:1506-1510`. |
| **Why the old anchor became unsafe** | `1474-1476` was correct at `6301c06`. C1 inserted 37 lines earlier in the file (a 9-line and a 27-line hunk near `:112-129`, plus a 1-line change), shifting this region **+37**. |
| **Patch meaning unchanged** | Confirmed. FIND and REPLACE payloads untouched, including Amendment 3b's `holdsClaim` insertion. The FIND text is unmodified by C1 and matches verbatim. |

### 2.4 §4.1 — Review on re-entry (MAJOR-2)

| Field | Detail |
|---|---|
| **Section changed** | §4.1, `lib/dev-hq/agent-execution-service.ts` |
| **Old anchor** | `(856-857)` |
| **New anchor** | `905-906`, struck old value retained; applier directed to match by FIND text |
| **Surrounding unique context** | `await reconcileRecordsFor(current);` occurs **exactly once** in the file (`:905`). The two-line FIND block is the tail of the re-entry branch in `export async function handleExecutionComplete(...)`, immediately below the four-line comment beginning `// Re-entry after the current attempt already left \`running\`.` at `:900-904`, and immediately above the `/**` at `:909` opening `requestReviewIfSucceeded`'s doc comment. |
| **Why the old anchor became unsafe** | `856-857` was correct at `6301c06` (verified via `git show`). C1's insertions at `:193` (+44), `:727` (+4) and `:872` (+1) shift this region **+49**. |
| **Patch meaning unchanged** | Confirmed. FIND and REPLACE payloads untouched. The FIND text is unmodified by C1 and matches verbatim. |

### 2.5 §3.3 — F4 regression insertion (MINOR-1)

| Field | Detail |
|---|---|
| **Section changed** | §3.3 insertion instruction, `lib/dev-hq/execution-manager.test.ts` |
| **Old anchor** | `INSERT after the test closing at line 175` |
| **New anchor** | INSERT at `describe("execution manager", ...)` body level (2-space indent), immediately after the closing `  });` of `it("heartbeats a running execution and keeps the lease", async () => {` — the test §3.2 has just rewritten — and immediately before `it("releases a succeeded execution and frees the agent", async () => {`. |
| **Surrounding unique context** | Both `it(...)` titles occur exactly once in the file. `execution-manager.test.ts` contains a single flat `describe("execution manager", ...)` opening at `:65`, so there is no nesting ambiguity. At the start of C3 the boundary is `:175` / `:177`. |
| **Why the old anchor became unsafe** | `175` is correct at the **start** of C3 — `execution-manager.test.ts` is untouched by C1 — but it is stale by the time the instruction **runs**, within the same commit. §3.2, as replaced by Amendment 2, swaps 3 lines (`172-174`) for 28 inside that very test, and §3.3's own import edit adds 2 lines above it. True target after both is approximately `:202`. This is the same defect class as MAJOR-1, sourced from within the commit rather than from C1. |
| **Patch meaning unchanged** | Confirmed. The `it("absorbs a heartbeat for an attempt reclaimed underneath it", ...)` payload is byte-identical. It remains a sibling of the same two tests, in the same describe, in the same relative position. |

### 2.6 §1.9 — `UNCERTAIN` note resolution (directed by the assigning brief)

| Field | Detail |
|---|---|
| **Section changed** | §1.9 trailing `⚠️ CR-1E marked UNCERTAIN` note, `lib/dev-hq/agent-execution-service.test.ts` |
| **Old anchor** | Not an anchor. A conditional instruction: *"If shadowed, use `getDevHqStore().agents.get("agent-supervisor")!`."* Cited `getAgent` imported at line 19. |
| **New anchor** | Note struck and marked **RESOLVED**; §1.9's applied position recorded as `:1545-1593`. |
| **Surrounding unique context** | `getAgent` is imported at `agent-execution-service.test.ts:19`, inside the `@/lib/dev-hq/store` import block spanning `:18-27`. |
| **Why the old note needed resolving** | It recorded an unverified risk, not a defect. I verified it directly rather than relying on the assertion that it was resolved: a grep for `const getAgent\|let getAgent\|function getAgent` across the file returns **no match**, so no shadowing declaration exists at any scope. The cited import line 19 is correct. The conditional fallback is unreachable and would have left a live "if" in an applied section. |
| **Patch meaning unchanged** | Confirmed. §1.9 is already applied as part of C1 and was not edited. Only the advisory note attached to it changed. |

---

## 3. Anchor changes — outside the narrowed scope, verified, no error found

Recorded separately because the Founder's scope, as now stated, covers MAJOR-1, MAJOR-2 and
MINOR-1 only. These three were made under the assigning brief's instruction to "check EVERY
anchor in those three commits, not only the three named." Each was verified against the tree and
none was found to be wrong in substance. **Whether they should stand or be reverted is the
Founder's call; I am not asserting they were authorized.**

### 3.1 §2.5 — claim-lost emitter insertion

| Field | Detail |
|---|---|
| **Section changed** | §2.5, `lib/dev-hq/agent-execution-service.ts` |
| **Old anchor** | `INSERT after the 1.2 block` |
| **New anchor** | INSERT at module top level, immediately after the closing `}` of `ensureAssignmentDeferredEvent` (the function §1.2 added), and immediately before the `/**` opening the doc comment of `ensureRetryEvents`. In the applied tree those are `:235` and `:237`. |
| **Surrounding unique context** | `export async function ensureAssignmentDeferredEvent(` occurs once (`:217`); its body ends `});` / `}` at `:234-235`. The following `/**` at `:237` opens `Ensure the execution has one \`execution.retried\` event per retry…`. |
| **Why the old anchor was weak** | It was descriptive but **unstated** — it named a section of the specification rather than a position in the file. It resolves correctly only because C1 is applied. Not stale and not unsafe; incomplete. |
| **Patch meaning unchanged** | Confirmed. Payload untouched. Insertion point is module scope, not inside any function body. `getAgent`, which the payload calls, is already imported at `:27`. |

### 3.2 §2.8 tail reference

| Field | Detail |
|---|---|
| **Section changed** | §2.8 closing sentence, `lib/dev-hq/agent-execution-service.test.ts` |
| **Old anchor** | `Remainder of that test (1478-1506) unchanged` |
| **New anchor** | `1515-1543` |
| **Surrounding unique context** | Runs from the `// The loser is now the stranding case:` comment through the test's closing `    });`. |
| **Why the old reference became unsafe** | Same +37 C1 shift as §2.8's heading. This is a **fourth instance of MAJOR-2's defect**, in the same section as one of the three named, and was not in the brief. It is a reference, not an apply target — nothing in that range is edited — so it could not have caused a misapply, only a reviewer's confusion when confirming the FIND landed in the right test. |
| **Patch meaning unchanged** | Confirmed. Nothing in that range is edited by any patch. |

### 3.3 §3.3 import instruction annotation — **see §5, this verdict is contested**

| Field | Detail |
|---|---|
| **Section changed** | §3.3 import instruction, `lib/dev-hq/execution-manager.test.ts` |
| **Old anchor** | `Add saveExecution to the store import block (16-24), and after line 24 add: import { MAX_EXECUTION_ATTEMPTS } …` — unchanged; I added an annotation, not a correction |
| **New anchor** | None. I annotated the existing anchor as **verified correct** and added a placement instruction: put `saveExecution` alphabetically between `saveAssignment` (22) and `saveTask` (23) to match the block's ordering. |
| **Surrounding unique context** | The `@/lib/dev-hq/store` import block spans `:16-24`; `:24` is `} from "@/lib/dev-hq/store";`. Neither `saveExecution` nor `MAX_EXECUTION_ATTEMPTS` is currently imported in that file. |
| **Why I annotated it** | To record that C1 did not touch this file and the numbers still hold. |
| **Patch meaning unchanged** | Confirmed — no anchor was altered. |

> **UPDATE — this verdict was wrong and has since been corrected.** The "verified correct"
> annotation recorded here was a **false clearance**: the instruction was line-number-dependent
> and self-conflicting, and it blocked C3. It was corrected under **MAJOR-A**, now authorized and
> applied as Amendment 5. See §5 and the verbatim record in §9.1.

---

## 4. Out-of-scope items I raised that are erroneous

Both were volunteered under the assigning brief's instruction to report newly-found defects. Both
fall outside the Founder's narrowed authorization, and **independent verification found both to be
wrong.** I re-derived each against the tree rather than accepting the correction on assertion.
**Both corrections hold.** I am not disputing either.

### 4.1 Erroneous — blast-radius `reconcileQueuedDispatches:499`

**What I claimed** (recorded in the specification's blast-radius annotation and in Amendment 4's
newly-found item 3): that `reconcileQueuedDispatches:499` did not match `6301c06`, that the
function was at `:455` there, and that `:499` was only its post-C1 position — implying one
blast-radius number had not been derived from the same tree as the rest.

**The correction, verified by me:** I conflated the function **declaration** with the **decline
site**. At `6301c06`:

```
455  async function reconcileQueuedDispatches(now?: string): Promise<void> {
...
499      if (!decision.assigned || !decision.assignment) continue;
```

`:499` is the `ensureAssignment` decline site inside that function — a candidate deferral-emission
site that was deliberately excluded. That is precisely what it is named as in
`docs/validation/sprint-1e-overnight-2026-07-26/ISSUE_MATRIX.md:94`:

```
| — | `reconcileQueuedDispatches:499` | **NO** | sweep re-observing; key no-ops it |
```

**The original specification was correct.** My note was wrong.

**Why I got it wrong, stated so the failure mode is legible:** post-C1 the *declaration* moved
from `:455` to `:499` — the decline site moved to `:543` — so a grep for the declaration returned
`499` and read as confirmation of a discrepancy that did not exist. A numeric coincidence
produced by the very shift I was auditing. I matched on the symbol I had in mind rather than
re-reading what the cited line actually contained, and the citation is a site reference, not a
declaration reference.

**Status:** out of scope, erroneous, **now removed** under **MAJOR-B** (authorized 2026-07-26,
applied as Amendment 5). Verbatim record in §9.2.

### 4.2 Erroneous — double blank line attributed to C1

**What I claimed** (Amendment 4, newly-found item 5): that C1 left a double blank line at
`agent-execution-service.test.ts:35-36`.

**The correction, verified by me:** the double blank line is **pre-existing at `6301c06`**:

```
33  const TS = "2026-07-24T21:00:00.000Z";
34  const FAR_FUTURE = "2999-01-01T00:00:00.000Z";
35
36
37  function seedTask(overrides?: Partial<Task>): Task {
```

C1 did not create it. My attribution was wrong — I observed it in the applied tree and inferred
the cause instead of checking the base, which is the same class of error as 4.1.

**Status:** out of scope, erroneous, **now corrected** under **MINOR-A** (authorized 2026-07-26,
applied as Amendment 5). Verbatim record in §9.3.

### 4.3 Two other items I raised, for completeness

Neither is erroneous, but both are outside the narrowed scope and are listed so the record is
complete rather than selectively reported:

- **§2.8's tail reference (Amendment 4 item 1)** — a genuine fourth instance of MAJOR-2. Verified.
  Covered in §3.2 above.
- **§2.7's "No change needed" list (Amendment 4 item 4)** — incomplete but not wrong; it omits
  `execution-manager.test.ts` 163, 182, 198 and 206, which also call `claimExecution` and also
  need no change. I made **no change** to that list. Observation only.

---

## 5. MAJOR-A — the §3.3 import defect, now diagnosed and corrected

Previously recorded here as open and not authorized to fix. **Authorized 2026-07-26 and corrected
as Amendment 5.** The diagnosis confirms what I disclosed: my own annotation was a contributing
factor, not a neutral observation.

**The defect.** The two halves of §3.3's import edit could invalidate each other. Amendment 4
directed `saveExecution` alphabetically between lines `22` and `23`, while the base instruction
said to add the constants import *"after line 24."* Applying the placement first shifts
`} from "@/lib/dev-hq/store";` from `:24` to `:25`, so *"after line 24"* then lands the
`MAX_EXECUTION_ATTEMPTS` import **between `saveTask,` and the closing brace — inside the braces.**
That is invalid TypeScript, it fails `npx tsc --noEmit`, and it blocks C3.

**My contribution to it.** The base instruction's *"after line 24"* was CR-1E's and was correct
in isolation at the start of C3. It became unsafe only in combination with the alphabetical
placement **that I added in Amendment 4** — and I annotated the pair as "verified correct." I
introduced the conflict and then cleared it. That is the substantive error in Amendment 4, and it
is a worse one than the two false statements in §4, because it would have reached an applier as
clearance.

**The correction.** Both halves are now anchored on text rather than position — one targets a
point between two named specifiers inside the braces, the other the line after the block's
closing `} from "@/lib/dev-hq/store";` statement. Neither can move the other's target. Verbatim
old and new text in **§9.1**; the order-independence and syntax proof is in **§6.1**.

---

## 6. Verification and validation performed

### 6.1 Amendment 5 / MAJOR-A — order-independence and syntax, proved by construction

The Founder's third verification criterion — *"the instruction remains valid after the
`saveExecution` import is added"* — is the one the original instruction failed. I tested the fix
against it rather than reasoning about it.

Both halves of §3.3's import edit were applied to a scratchpad copy of
`execution-manager.test.ts` **in each order**, plus a **control** reproducing Amendment 4's
defective text. All three were then parsed with the project's own TypeScript **5.9.3**
(`node_modules/typescript/bin/tsc --noEmit --skipLibCheck --target es2020 --module esnext
--moduleResolution bundler`).

| File | Order applied | Result |
|---|---|---|
| `orderA.ts` | placement → insertion | **No syntax errors.** 5 diagnostics, all `TS2307` module-not-found |
| `orderB.ts` | insertion → placement | **Byte-identical to `orderA.ts`**, SHA-256 `0853CBECA9BD69EB65BBA27411CE7C5EA215E622D7ED295244C77596001F4571`. Same 5 `TS2307`, no syntax errors |
| `oldInstruction.ts` **(control)** | placement → *"after line 24"* | **`TS1003`, `TS1005` ×2, `TS1128`, `TS1434`** — all at `:25-26` |

The 5 `TS2307`s on the corrected files are expected and benign: a standalone file outside the
project's `tsconfig` has no `@/` path mapping, so `vitest`, `@/lib/dev-hq/execution-manager`,
`@/lib/dev-hq/store`, `@/lib/dev-hq/constants` and `@/types/domain` all fail to resolve. **None is
a syntax error.** That the diagnostic for the new import is reported at `(26,40)` — the module
specifier — confirms TypeScript parsed it as a well-formed top-level import statement, i.e. it
landed **outside** the braces.

The control is the load-bearing result: it demonstrates the old instruction genuinely produced
invalid TypeScript, so MAJOR-A was a real blocker and not a theoretical one.

Resulting import region, identical under both orders:

```ts
import {
  getAgent,
  getAssignment,
  getDevHqStore,
  resetDevHqStore,
  saveAgent,
  saveAssignment,
  saveExecution,
  saveTask,
} from "@/lib/dev-hq/store";
import { MAX_EXECUTION_ATTEMPTS } from "@/lib/dev-hq/constants";
```

**No repository file was involved.** All three copies were written to the session scratchpad
outside the repository and used only for parsing. `lib/dev-hq/execution-manager.test.ts` is
unmodified.

**One false start, disclosed.** My first attempt at this check ran `npx --yes tsc`, which fetched
the deprecated `tsc@2.0.4` stub from npm rather than the project's compiler, and reported "no
syntax errors" for **both** the corrected files *and* the control. That result was worthless and I
discarded it. The table above is from TypeScript 5.9.3 resolved explicitly at
`node_modules/typescript/bin/tsc`. Recorded because a check that clears a known-bad control is
evidence of nothing, and a reader should know which run the conclusion rests on.

### 6.2 Amendment 5 / MAJOR-B and MINOR-A — base-tree verification

Both false claims were re-derived against `6301c06` before being withdrawn, rather than accepted
on assertion:

- **MAJOR-B:** `git show 6301c06:lib/dev-hq/agent-execution-service.ts` shows `:455` is
  `async function reconcileQueuedDispatches(now?: string): Promise<void> {` and `:499` is
  `if (!decision.assigned || !decision.assignment) continue;` — the decline site, exactly as
  `ISSUE_MATRIX.md:94` names it. Post-C1 the decline site is at `:543` and the declaration at
  `:499`. The specification was correct; my note was not.
- **MINOR-A:** `git show 6301c06:lib/dev-hq/agent-execution-service.test.ts` shows lines `35` and
  `36` already blank, between `const FAR_FUTURE = …` and `function seedTask(…)`. Pre-existing;
  C1 did not create it.

### 6.3 Amendment 4 — anchor audit (unchanged)

**Method.** Every anchor in C2, C3 and C4 was re-derived independently against the applied working
tree — read the file, grep the FIND text — not transcribed from the report that prompted the
amendment. C1's applied hunks were read from `git diff -U0`; pre-C1 positions were confirmed with
`git show 6301c06:<path>` explicitly rather than against `HEAD`.

**Full anchor audit result — 20 anchors checked across C2/C3/C4:**

| Verdict | Count | Sections |
|---|---|---|
| Correct, unchanged | 13 | §2.1 (×2), §2.2, §2.3, §2.4, §2.7(a)-(d), §3.1 (×2), §3.2, ~~§3.3 imports~~ |
| Corrected | 6 | §2.6, §2.8 heading, §2.8 tail, §3.3 insertion, §4.1, §4.2 |
| Made explicit | 1 | §2.5 |

> **This table is Amendment 4's dated conclusion and is superseded on one row.** *§3.3 imports* is
> **not** "correct, unchanged" — that verdict was the false clearance corrected by MAJOR-A. Read
> as: 12 correct, 7 corrected. The specification's copy of this table is deliberately left intact
> as the historical record, with Amendment 5 stating the supersession; see §10 for that judgment
> call.

Every anchor in files C1 did not touch — `execution-manager.ts`, `execution-manager.test.ts`,
`types/contracts/execution-runner.ts`, `adapters/dev-execution-runner.ts`,
`adapters/dev-execution-runner.test.ts` — was exact.

**Uniqueness, grep-confirmed.** Each FIND target occurs exactly once in its file, including the two
that could plausibly have collided: `/not available to claim/` only at
`agent-execution-service.test.ts:1513`, and `const execution = await runExecution(executionId);`
only at `agent-execution-service.ts:785`. §2.7(a)'s FIND is disambiguated from the 14 bare
`await claimExecution(...)` call sites by its `const running =` prefix. The coordinator's
pre-verification table remains exact: `if (execution.status !== "running") {` is at
`execution-manager.ts:564` (`heartbeat`, absorb) and `:603` (`releaseExecution`, must keep
throwing), and §3.1's FIND still disambiguates them via the `cannot heartbeat` message text.

**The five apply-safety criteria**, as answered in the specification:

1. Every FIND target is unique in its file — grep-confirmed.
2. Every insertion point is outside existing test bodies — §2.5 is module scope; §3.3 sits between
   two sibling `it(...)` calls; §4.2 sits between a test's closing `});` and its `describe`'s
   closing `});`. §4.2 did **not** satisfy this before.
3. Surrounding context matches the current tree — every quoted FIND block was re-read from the
   applied tree.
4. No line-number-only target remains in C2/C3/C4.
5. Literal application modifies only the intended region — follows from 1 and 2.

**Shift magnitudes.** The reviewer's figures of "roughly 48" and "roughly 37" are not file-wide
constants; the shift varies by position. At the specific anchors it is **+48** (§2.6), **+49**
(§4.1) and **+37** (§2.8). Their conclusions are unaffected.

**Not validated.** The repository's gate checks were **not** run — no `npx tsc --noEmit`, no
`npx eslint .`, no `npx vitest run` — because no source change was made and there was nothing of
mine to validate. Those remain the applier's step after each commit. The TypeScript parse in §6.1
is **not** a gate check: it ran against scratchpad copies outside the project's `tsconfig`, and it
establishes only that §3.3's import edit yields syntactically valid, order-independent TypeScript.
Whether the C2/C3/C4 **payloads** are behaviourally correct was out of scope and was not
re-reviewed; only where they attach was examined. Amendment 3b's recorded limitation stands
unchanged — it transcribes `trigger/agent-execution.ts:66-68` rather than executing the worker —
though those lines were re-read and still match the transcription verbatim, as do its `:63`, `:84`
and `:90` references.

**I have not reviewed or certified my own amendments**, and this report is not a certification.
Independent verification is required. Amendment 4 shipped one false clearance (§5) and two false
statements (§4); the record of that is the reason Amendment 5 needs a verifier other than me.

---

## 7. Repository state

**Zero source-code changes.** `git status --porcelain -- lib types app components` shows exactly
the five C1 files and nothing else:

```
 M lib/dev-hq/agent-execution-service.test.ts
 M lib/dev-hq/agent-execution-service.ts
 M lib/dev-hq/constants.ts
 M lib/dev-hq/escalation-service.ts
 M lib/dev-hq/review-service.ts
```

`git diff --numstat` over that scope is byte-identical to the start of the amendment session —
89/2, 65/3, 10/0, 6/1, 7/1 = **177 insertions, 7 deletions**. Nothing staged, nothing committed,
nothing deleted. C2, C3 and C4 remain unapplied.

**Files written by me, total, across all three tasks — only these two:**

1. `agents/independent-code-reviewer/outputs/SPRINT_1E_REMEDIATION_PATCH_SPEC.md` — Amendment 4,
   then Amendment 5.
2. `agents/lead-software-engineer/outputs/SPRINT_1E_SPEC_AMENDMENT_REPORT.md` — this report.

Scratchpad files (`orderA.ts`, `orderB.ts`, `oldInstruction.ts`) were written to the session
temp directory **outside the repository** and are not part of the working tree.

**Not done, per the Founder's constraints:** no source or test file modified; C2, C3 and C4 not
applied; **MINOR-2 (the untested `released` heartbeat branch, Risk 2) deliberately left open**;
remediation scope not broadened; no other specification content changed.

**Note on `HEAD`.** The assigning brief cited `HEAD` as `6301c06`, and it was at the start of the
amendment session. Partway through, another agent committed `fe7fab1`
*("docs(validation): freeze C1 candidate; fresh-review gate unobtainable")* — 2 files,
`docs/validation` only, +238, **no source touched**, confirmed by the unchanged C1 numstat. Every
pre-C1 derivation in the amendment used `git show 6301c06:<path>` explicitly, so none is affected.
Flagged because references to `HEAD` in the D-2 paperwork are now one commit behind.

---

## 8. Next action

- **Required reviewer:** CR-FRESH-1E, re-verifying **only** the three Amendment 5 corrections
  against the five stated criteria. I cannot certify my own amendments, and Amendment 4's record
  — one false clearance, two false statements — is the reason.
- **Still for Founder decision:** whether the three outside-scope-but-correct Amendment 4 edits
  recorded in §3 stand or are reverted. Not addressed by this authorization.
- **Deliberately still open:** MINOR-2, the untested `released` heartbeat branch. Not to be
  resolved.
- **If CR-FRESH-1E passes all five criteria:** D-4 resumes at C2.
- **For the applier, when C2/C3/C4 are authorized:** prefer FIND text and structural descriptions
  over every line number in the specification. C2 shifts `agent-execution-service.test.ts` again
  before C4 reads it.

---

## 9. Amendment 5 — exact old text and exact new text, verbatim

Founder-required record. Reproduced character-for-character from the specification, not
paraphrased. All three edits are in
`agents/independent-code-reviewer/outputs/SPRINT_1E_REMEDIATION_PATCH_SPEC.md`.

### 9.1 MAJOR-A — §3.3 import instruction

**Two edits: the base instruction line, and the annotation that interacted with it.**

**9.1(a) — base instruction. EXACT OLD TEXT:**

```
Add `saveExecution` to the store import block (16-24), and after line 24 add:
```

**EXACT NEW TEXT:**

```
Add `saveExecution` to the store import block (16-24), and immediately after the closing
`} from "@/lib/dev-hq/store";` of that import block, add:
```

**9.1(b) — interacting annotation. EXACT OLD TEXT:**

```
> **⟶ Amendment 4 — import anchors verified correct.** `execution-manager.test.ts` is
> untouched by C1. The `@/lib/dev-hq/store` import block is still exactly `16-24`,
> line 24 is still `} from "@/lib/dev-hq/store";`, and neither `saveExecution` nor
> `MAX_EXECUTION_ATTEMPTS` is currently imported in that file. Apply as written, but
> place `saveExecution` alphabetically between `saveAssignment` (22) and `saveTask`
> (23) to match the block's existing ordering.
```

**EXACT NEW TEXT:**

```
> **⟶ Amendment 5 — import instruction corrected (MAJOR-A). Supersedes Amendment 4's
> verdict on this instruction, which wrongly cleared it as "verified correct."**
> `execution-manager.test.ts` is untouched by C1, and neither `saveExecution` nor
> `MAX_EXECUTION_ATTEMPTS` is currently imported in it. The `(16-24)` above is
> corroboration only — anchor on the text.
>
> **Placement.** Insert the specifier `saveExecution,` **inside** the
> `@/lib/dev-hq/store` import block, between the existing `saveAssignment,` and
> `saveTask,` specifiers, matching the block's alphabetical ordering.
>
> **The two halves are now order-independent — this is the defect Amendment 4 left
> open.** Amendment 4 said *"after line 24"* while simultaneously directing
> `saveExecution` between lines `22` and `23`. Adding that specifier shifts
> `} from "@/lib/dev-hq/store";` from `:24` to `:25`, so *"after line 24"* would then
> land the `MAX_EXECUTION_ATTEMPTS` import **between `saveTask,` and the closing
> brace** — inside the braces. That is a syntax error, it fails `tsc`, and it blocks
> C3. Both halves are now named by text rather than by position: the first targets a
> point between two named specifiers *inside* the braces; the second targets the line
> *after* the block's closing `} from "@/lib/dev-hq/store";` statement. Neither edit
> can move the other's target, so applying them in either order yields the same file.
```

The `MAX_EXECUTION_ATTEMPTS` code fence between (a) and (b) is **unchanged**.

### 9.2 MAJOR-B — false `reconcileQueuedDispatches` provenance note

**Two locations: the blast-radius annotation where the claim was made, and Amendment 4's
newly-found item 3 where it was summarized.**

**9.2(a) — blast-radius annotation. EXACT OLD TEXT (final five lines of that block):**

```
> `execution-manager.ts:172-186`. **Discrepancy noted for the record:**
> `reconcileQueuedDispatches` was at `agent-execution-service.ts:455` at `6301c06`, not
> `:499` — `:499` is its position *after* C1. The conclusion (untouched by design) is
> unaffected; recorded only because it shows one blast-radius number was not derived
> from the same tree as the rest.
```

**EXACT NEW TEXT:**

```
> `execution-manager.ts:172-186`.

> **⟶ Amendment 5 (MAJOR-B) — a false claim about `reconcileQueuedDispatches:499` stood
> here and has been removed.** Amendment 4 asserted that `:499` "does not match
> `6301c06`" and that the entry showed a blast-radius number derived from a different
> tree. **That was false, and it was raised outside authorized scope.**
> `reconcileQueuedDispatches:499` names the **decline site** inside that function —
> `if (!decision.assigned || !decision.assignment) continue;` — which sits at `:499` at
> `6301c06`, exactly as `ISSUE_MATRIX.md:94` records it. The `:455` figure is the
> function *declaration*, a different thing. **The original specification was correct
> and this list needs no correction.** (Post-C1 the decline site is at `:543` and the
> declaration at `:499` — the numeric coincidence that produced the false claim.)
```

The preceding three lines of that annotation — the `:737`→`:785` and
`TERMINAL_EVENT_TYPE` corrections, which are true — are **unchanged**.

**9.2(b) — Amendment 4 newly-found item 3. EXACT OLD TEXT:**

```
3. **Blast radius `reconcileQueuedDispatches:499`** does not match `6301c06` (it was
   `:455` there; `:499` is its post-C1 position). Non-load-bearing; recorded above.
```

**EXACT NEW TEXT:**

```
3. ~~**Blast radius `reconcileQueuedDispatches:499`** does not match `6301c06` (it was
   `:455` there; `:499` is its post-C1 position). Non-load-bearing; recorded above.~~
   **WITHDRAWN by Amendment 5 (MAJOR-B) — the claim was false and was raised outside
   authorized scope.** `:499` correctly names the decline site at `6301c06`, as
   `ISSUE_MATRIX.md:94` records; `:455` is the function declaration. The original
   specification was right.
```

### 9.3 MINOR-A — false attribution of the double blank line to C1

**EXACT OLD TEXT (Amendment 4 newly-found item 5):**

```
5. **Cosmetic, out of scope:** C1 left a double blank line at
   `agent-execution-service.test.ts:35-36`. Flagged, not fixed — this amendment touches
   no source file.
```

**EXACT NEW TEXT:**

```
5. ~~**Cosmetic, out of scope:** C1 left a double blank line at
   `agent-execution-service.test.ts:35-36`. Flagged, not fixed — this amendment touches
   no source file.~~
   **CORRECTED by Amendment 5 (MINOR-A) — the attribution to C1 was false, and the item
   was raised outside authorized scope.** The double blank line is **pre-existing at
   `6301c06`**: lines `35-36` are already blank there, between
   `const FAR_FUTURE = …` and `function seedTask(…)`. **C1 did not create it.** No
   source file was touched then or now.
```

### 9.4 One addition beyond the three edits, declared

A new `## Amendment 5 (SPEC-AMEND-1E) — authorized corrections to Amendment 4` section was
appended to the end of the specification, recording the authority, the three-row defect table, the
MAJOR-A proof-by-construction, the explicit statement that **MINOR-2 is deliberately not
resolved**, and the shared failure mode behind MAJOR-B and MINOR-A. It adds a record of the
authorized corrections; it changes no instruction, anchor, payload or commit-plan content.
Declared here rather than folded into the three edits so CR-FRESH-1E can rule on it separately.

---

## 10. Judgment calls, declared rather than absorbed

Two places where I had to choose, and could reasonably be told I chose wrong:

1. **Amendment 4's audit table row for §3.3 imports still reads "✅ correct" in the
   specification.** That verdict is false. I did **not** edit it, because the Founder constrained
   this task to the three named corrections and "no other specification content may change."
   Instead, Amendment 5 states explicitly that it supersedes Amendment 4 wherever they disagree
   and names that row. An applier reads the in-place §3.3 annotation, which now carries the
   Amendment 5 correction — so the false row cannot mislead at the point of application. If the
   Founder prefers the row struck, that is a one-line follow-up.

2. **The header pointer at the top of the specification** still reads *"read the `⟶ Amendment 4`
   annotation on each before applying"* and lists §3.3 among the corrected sections. §3.3's
   annotation is now Amendment 5. Left unedited for the same reason. The annotation is clearly
   labelled in place.

Neither was changed unilaterally. Both are flagged so the decision stays with the Founder.

---

## 11. Amendment 6 — the 12 items, with exact old/new text

**Authority:** Founder, 2026-07-26 ~11:55 local. **Scoped by:** CR-FULL-1E. **Applied by:**
SPEC-AMEND-1E (specification only). Items 9-10 are source changes applied by the coordinator,
not by me.

**Acceptance test this was written for:** an independent verifier must confirm the
specification re-derives the frozen tree with **zero applied-vs-specified divergences.**

### 11.0 Two brief premises that did not survive verification

Stated first because both would have defeated the acceptance test.

**(a) Test count — brief said `321` / `317 + 4`; the tree says `322` / `317 + 5`.**
The follow-up added **two** tests, not one. Counted at line-start `it(` across all 22
`*.test.ts` files, with no `it.skip`/`it.only`/`it.each`/`it.todo` anywhere in the repository:

| Tree | Files | Tests |
|---|---|---|
| `6301c06` | 22 | **317** |
| Candidate | 22 | **322** |

Per-file delta: `agent-execution-service.test.ts` 53→57 (+4), `execution-manager.test.ts`
36→37 (+1). The five additions and the two rewrites are enumerated in the specification at
A6.1. I wrote **322**. Item 1's own rationale — *"partial fixing reproduces the original
defect"* — applies to itself: writing `321` would have left the specification unable to
reproduce the candidate.

**(b) Freeze hashes — two of the three cited no longer match the tree.**

| Artifact | Brief / `CANDIDATE_FINAL_FREEZE.md` | Current tree | Status |
|---|---|---|---|
| Full-candidate diff | `ffc805f6…` | `f6bfbc5876965f62ed1f81d15db5735d09502a4942606042afee1817e3e4fd66` | **diverged** |
| `agent-execution-service.ts` | `51ebbc2e…` | `8ae02cdae14d…` | **diverged** (items 9-10) |
| `agent-execution-service.test.ts` | `0dca1f03…` | `89d5dd7b7c92…` | **diverged** (§5(a) rewrite, mid-amendment) |

> **⚠️ The tree moved twice while I was writing this amendment.** At the start,
> `agent-execution-service.test.ts` matched the freeze at `0dca1f03…` and the diff was
> `160d7af4…`. Mid-amendment, §5(a)'s test was renamed and rewritten by another actor —
> *"attributes the requeue deferral to the reclaim loop, not the sweep"* became *"emits the
> requeue deferral from the reclaim loop, before the sweep runs"*, swapping a routing-strip
> discriminator for an append-order one. I caught it on a post-write verification pass and
> corrected the specification's §5(a) title and mechanism description; had I not re-checked,
> the specification would have referenced a test title that no longer exists and failed the
> acceptance test outright. **The test count was 322 before and after, so item 1 stands.**
> Eight of ten files still match the freeze; only the two `agent-execution-service` files
> moved.

**Cause, diagnosed not guessed:** items 9-10 (the source comment corrections) were applied
**after** the freeze was taken. `agent-execution-service.ts:214` now reads *"the six call
sites"* and `:221-228` carries a new four-line Site 3 paragraph — a +5 line shift, which is
exactly why every `agent-execution-service.ts` line number in the brief was 5 low
(`reconcileQueuedDispatches` at `:531`, not `:526`; sites at `:585/:774/:931/:1137`, not
`:580/:769/:926/:1132`). Only comment text moved; no behaviour changed.

**Had I transcribed `ffc805f6…` and `51ebbc2e…` as current, I would have written a third
hash into the record matching no artifact — precisely the failure item 8 exists to prevent.**
The specification now records the frozen values *and* the current values, both labelled.

### 11.1 Item 1 — end state, three places

**OLD (`SPEC:37`):** `**Expected end state: 22 files, 320 tests** (317 + 3 added; X2 and X2b are rewrites).`
**NEW:** struck, followed by an Amendment 6 block giving `**Expected end state: 22 files, 322 tests** (317 + 5 added; X2 and D1 are rewrites, not additions)` with the counted derivation.

**OLD (`SPEC:1024`):** `end state remains **320 tests** — these strengthen existing rewrites and add no cases.`
**NEW:** `end state remains ~~**320 tests**~~ **322 tests** *(Amendment 6, item 1)* — these strengthen existing rewrites and add no cases.`

**OLD (`SPEC:1325`):** `state remains **22 files, 320 tests**.`
**NEW:** `state remains ~~**22 files, 320 tests**~~ **22 files, 322 tests** *(Amendment 6, item 1)*.`

All three changed together, per the item's instruction that partial fixing reproduces the defect.

### 11.2 Item 2 — remove from "Untouched by design"

**OLD (`SPEC:1270`):** `- Untouched by design: `execution-manager.ts:172-186`, `reconcileQueuedDispatches:499`, `internal-guard.ts`, all routes, `store.ts`.`
**NEW:** the entry struck in place — `~~`reconcileQueuedDispatches:499`~~ *(removed — Amendment 6, item 2)*` — followed by a block noting it is now **Site 3** of six, specified in §5, and that the remaining entries are still untouched.

### 11.3 Item 3 — SUPERSEDED, not corrected

No text was removed. An Amendment 6 block was appended after `SPEC:1278-1287` stating that
Amendment 5's MAJOR-B defence **was right when written** and is superseded on its
**conclusion only**. It records explicitly that every factual statement in that block still
holds — `:499` did name the decline site at `6301c06`, `ISSUE_MATRIX.md:94` did record it that
way, `:455` was the declaration, and Amendment 4's inference was wrong — and that what changed
is the *design* (a Founder decision authorizing emission where `ISSUE_MATRIX.md:88-95` marks
the row **`NO` emit**), not the facts. It states the consequence the item warns about: marking
it an error would retroactively discredit a sound amendment and cast doubt on its other
rulings, **including MAJOR-A, which is load-bearing for C3.**

### 11.4 Item 4 — supersede the scope statement

**OLD (`SPEC:1470`):** `remediation scope was not broadened.`
**NEW:** struck, followed by an Amendment 6 block: scope **was** broadened after Amendment 5,
**by Founder authorization** — a sixth site plus two tests — so the statement is superseded
rather than corrected, having been true when written.

### 11.5 Item 5 — the §5 apply block *(load-bearing)*

Added to the specification as **Amendment 6 §5**. Contains:

- **Structural target:** inside `reconcileQueuedDispatches` (declared `:531` current, `:455`
  at `6301c06`), at the `ensureAssignment` decline following `if (!execution.routing) continue;`.
- **FIND:** `      if (!decision.assigned || !decision.assignment) continue;`
- **REPLACE:** the braced form with the shipped 8-line X1-surviving-path comment and
  `await ensureAssignmentDeferredEvent(execution, decision.reason);` before `continue;` —
  transcribed from the tree, not reconstructed.
- **Two test payloads**, §5(a) and §5(b), each anchored between named sibling `it(...)` titles
  inside `describe("queued execution recovery", …)`.
- **Site classification**, with the verification described in 11.9 below.

### 11.6 Item 6 — C1's X1 coverage was incomplete

**OLD (`SPEC:29`):** `| C1 | AR2-1 / X1 deferral events + X3 + X4 + X2 test rewrite + X3/X4 regression |`
**NEW:** same row with `**(X1 coverage INCOMPLETE — see Amendment 6, item 6)**` appended, plus
an Amendment 6 subsection explaining that C1 left the `reconcileQueuedDispatches` decline
silent — the path a stranded execution actually re-enters on every sweep — and quoting the
shipped test's own comment: *"X1's surviving path: the timeline used to be empty here."*

### 11.7 Item 7 — re-freeze on the record

Recorded as two tables: `CANDIDATE_FINAL_FREEZE.md`'s values, and the current tree's, with the
divergence and its cause labelled. **Affirmative statement made and verified file-by-file:
eight of the ten candidate files are byte-identical to the freeze; only the two
`agent-execution-service` files moved** — the source by comment text (items 9-10), the test
file by the mid-amendment §5(a) rewrite.

**Could not verify, stated in the specification rather than glossed:** the brief asked me to
affirm the other eight hashes unchanged **from the C1–C4 freeze**. **No C1–C4 per-file hash
table exists in the repository** — `CANDIDATE_C1_FREEZE.md:80` carries only a passing
reference to `51ebbc2e…`, not a table. My affirmation is therefore made against
`CANDIDATE_FINAL_FREEZE.md`, which is what can actually be checked. **A coordinator re-freeze
is required** to bring the recorded diff hash back into agreement with the tree.

### 11.8 Item 8 — authority and sequencing

Recorded as a five-step sequence: C1–C4 frozen → review opened → follow-up authorized and
applied **mid-review** → re-frozen → items 9-10 applied **after** that freeze. States
explicitly that each hash is correct for the moment it was taken and that none was fabricated —
they are simply not all hashes of the same tree.

### 11.9 Items 9-10 — coordinator's finding, verified

Not applied by me; both are already in the tree. Recorded in the specification for
consistency. **The coordinator's open finding is CONFIRMED**, by two structural facts I
verified directly rather than accepting:

1. `reconcileQueuedDispatches`' loop opens with `if (execution.status !== "queued") continue;`
   (`agent-execution-service.ts:534`), so the execution is provably queued on entry.
2. Nothing between that guard and the decline can move it out of `queued`. The only mutation
   on the path is `releaseAssignmentForReassignment`, which **throws** unless the execution is
   queued and preserves `status`, nulling only `agentId`, `assignmentId` and `triggerRunId`
   (`execution-manager.ts:711-740`).

So the new site **cannot** carry `execution_not_queued` and belongs with Sites 2 and 6. The
already-applied comment at `:221-228` states exactly that, so items 9-10 need no further
correction.

### 11.10 Item 11 — numbering reconciled

**OLD (`SPEC` §1.5 heading):** `### 1.5 Site 3 + X3 + X4 — reclaim loop (996-1020)`
**NEW:** `### 1.5 ~~Site 3~~ **Site 6** + X3 + X4 — reclaim loop (996-1020)` plus an in-place
Amendment 6 note.

**Canonical scheme declared: AR-1E's, which is also what the shipped source comment uses.**
The two schemes agreed on 1, 2, 4 and 5 and differed only on the reclaim loop, so **§1.5 was
the only mislabelled heading.** A full six-row mapping table is at A6.2, which also records
that this list must not be conflated with `ISSUE_MATRIX.md:88-95` — a six-**row candidate**
table whose row 3 (`execution-manager.ts:172-186`) is marked **`NO` emit** for Execution
Manager purity. Same cardinality, different lists; that trap has caught two readers already.

### 11.11 Item 12 — five apply-safety criteria for §5

Applied in full rather than declared moot, because criterion 1 is **not** moot for the
acceptance test:

1. **FIND uniqueness** — `if (!decision.assigned || !decision.assignment) continue;` occurs
   **exactly once** across `lib/` and `types/` at `6301c06`
   (`agent-execution-service.ts:499`), verified by `git grep` against that commit. In the
   current tree the anchor **is** consumed — both surviving occurrences of the predicate
   (`:575`, `:770`) are the braced form — so uniqueness is moot for a *re-apply* but
   load-bearing for *re-derivation*, which is what the Founder's acceptance test measures.
2. Insertion points outside existing test bodies — both between sibling `it(...)` calls.
3. Surrounding context matches the tree — FIND and both anchor titles re-read during this
   amendment.
4. No line-number-only target — source anchored by enclosing function, guard and predicate;
   tests by neighbouring titles.
5. Literal application modifies only the intended region — follows from 1 and 2.

### 11.12 One further correction, declared

The specification's status header still described C1 as applied and **C2/C3/C4 as not
applied.** That is false — all four plus the follow-up are in the tree. Left uncorrected it
would defeat the acceptance test on its first line. Struck and replaced with the current
state, plus a pointer to item 7 before trusting any recorded hash. Declared here rather than
folded silently into the 12 items.

### 11.13 Not verified

- **No gate checks run** — no `tsc`, no `eslint`, no `vitest`. I made no source change. The
  `322` figure is a static count of `it(` at line start, **not** a vitest run; if a
  `describe.skip` exists anywhere the executed count would differ, and I checked only for
  `it.`-level skips. A vitest run is the authoritative confirmation and remains the
  coordinator's step.
- **The §5(a)/§5(b) test payloads are referenced by title and behaviour, not transcribed in
  full** into the specification. A verifier re-deriving the tree should diff against the
  shipped tests directly.
- **Behavioural correctness of the follow-up was not reviewed** — out of scope. I specified
  what shipped; I did not re-adjudicate whether it should have.
