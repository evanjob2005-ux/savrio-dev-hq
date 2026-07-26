# Phase 4 — Validation Workflow Defect: Diagnosis and Proposed Repair

**Status:** diagnosis recorded; proposed change NOT applied.
**Branch:** `validation/sprint-1e-overnight-2026-07-26`

---

## 1. What happened

| Instance | Assignment | Tools sufficient? | Outcome |
|---|---|---|---|
| LSE-1E | Reproduce defects (requires authoring a harness) | **No** — role has no `Write`/`Edit` | 5 idle cycles, 0 reports |
| LSE-2 | Specify patches only (read-only) | **Yes** | 2 idle cycles, 0 reports |

Across two instances and roughly ten coordinator messages, the
`lead-software-engineer` role produced **zero deliverables**.

---

## 2. Diagnosis — stated at the accuracy the evidence supports

Per Founder instruction, recorded precisely:

1. **The original tool-boundary diagnosis was CONFIRMED but INCOMPLETE.**
   LSE-1E was genuinely assigned work its declared tools could not perform —
   reproduction requires authoring a harness, and the role grants no `Write` or
   `Edit`. That was a real coordinator error and it is confirmed. It was **not the
   whole cause**: LSE-2 received a fully tool-compatible, specify-only assignment and
   still returned nothing.

2. **The missing terminal deliverable contract is a TESTABLE HYPOTHESIS, not a proven
   root cause.** See §3.

3. **Two instances returning no report is evidence of a repeatable operational
   failure, but is NOT sufficient to prove the mechanism.** Two instances of one agent
   type is a small sample. Other causes are not ruled out.

---

## 3. The hypothesis

The three agent definitions in `.claude/agents/` used on this run declare **identical**
tool grants — `Read, Glob, Grep, Bash, WebFetch, Skill`. The tool declaration is
therefore **not** the differentiating variable.

| Agent | `## Required deliverable structure` | Reports this run |
|---|---|---|
| `independent-code-reviewer` | ✅ 9-item contract (`:53-63`) | 4 substantive |
| `architecture-reviewer` | ✅ contract (`:82`) | 5 substantive |
| `lead-software-engineer` | ❌ **absent** | **0 across 2 instances** |

`lead-software-engineer.md` has `## Communication rules` (prose guidance) and a
`## Return value` statement, but **no enumerated terminal artifact**. The two agents
that delivered repeatedly both have one, under identical conditions, identical tool
grants, and the same coordinator message patterns.

**Hypothesis:** an agent whose definition specifies no terminal deliverable performs
exploratory work and returns without producing a report, because nothing defines what
"done" looks like.

**Status: unproven.** Correlation across three definitions and seven-plus cycles. Not
a controlled experiment.

---

## 4. Supervised sample — the test

**Design choice:** the contract is injected **via the task prompt**, not by editing
`lead-software-engineer.md`. This tests the mechanism without modifying a project file,
per the Founder's instruction not to alter the definition as an incidental workaround.
It is also the cleaner experiment — it isolates the variable without leaving a
persistent change that would confound later observations.

**Task given to LSE-3:** specify the AR2-4 patch — one defect, already reproduced,
approved fix direction supplied, deliberately small.

**Mandatory contract in the prompt:** the final message must begin with exactly one of
`COMPLETE SPECIFICATION` / `PARTIAL SPECIFICATION` / `BLOCKED REPORT`, alone on the
first line. Silence or idle completion is explicitly defined as failure.

**Interpretation rules, fixed in advance to avoid post-hoc rationalisation:**

| Result | Conclusion |
|---|---|
| Returns one of the three tokens | Hypothesis **supported** — the definition change is warranted |
| Returns nothing again | Hypothesis **not supported**; cause lies elsewhere. Do NOT apply the definition change on this evidence. |

A single sample cannot prove the mechanism either way. A positive result raises
confidence enough to justify the minimal change; a negative result rules the change out
as the fix.

### ⚠️ Correction — the rule above was mis-specified, and the confound matters

**The original "silence = failure" criterion does not discriminate.** On review of the
session record, **CR-1E and AR-1E also went idle without reporting on their first
pass.** Both delivered only after the coordinator sent a follow-up request. Going idle
before delivering is therefore the **baseline behaviour of every agent observed on this
run**, not a property that separates the working definitions from the failing one.

Applying the rule as originally written would have rejected the hypothesis on evidence
that does not bear on it. It is corrected here rather than silently reinterpreted after
the fact, because a post-hoc adjustment to a pre-registered criterion is exactly the
failure mode pre-registration exists to prevent — and because the direction of the
correction happens to favour the hypothesis, which is when scrutiny matters most.

**Corrected criterion — equal treatment.** The test is whether **one follow-up request
elicits a conforming deliverable**, since that is precisely the treatment the two
working reviewers received before they delivered.

| Result after one equivalent follow-up | Conclusion |
|---|---|
| Returns one of the three tokens | Hypothesis **supported** |
| Still returns nothing | Hypothesis **not supported** — LSE fails under treatment that succeeds for both reviewers |

**Consequence for the earlier instances.** LSE-1E and LSE-2 each received multiple
follow-up requests — considerably more than either reviewer needed — and returned
nothing. Under the corrected criterion that record still stands as a genuine
operational failure. What changes is only the standard applied to LSE-3, which is now
the same standard the reviewers met.

---

## 4b. SAMPLE RESULT — hypothesis NOT SUPPORTED

**LSE-3 returned no deliverable, after an explicit terminal contract in its prompt and
one equivalent follow-up request.** Applying the corrected criterion exactly as written:

> Still returns nothing → **Hypothesis not supported** — LSE fails under treatment that
> succeeds for both reviewers.

**The proposed definition change must NOT be applied on this evidence.** It was the
coordinator's own hypothesis, and the result goes against it.

### What this rules out

The missing deliverable contract is **not sufficient** to explain the failure. LSE-3
received:
- a mandatory three-token contract, stated twice (opening and closing of the prompt)
- silence explicitly defined as failure
- a deliberately small, single-defect task
- the approved fix direction supplied, so no derivation was required
- an equivalent follow-up, the same treatment that elicited reports from both reviewers

It still produced nothing. Adding the same contract to the definition would therefore be
**cargo-culting a fix whose mechanism has been tested and failed** — precisely the error
AR-1E warned against with X1, where treating the visible symptom misses the actual
violation.

### Record across all three instances

| Instance | Assignment | Tools sufficient | Terminal contract | Follow-ups | Deliverables |
|---|---|---|---|---|---|
| LSE-1E | Reproduce (harness authoring) | **No** | No | 3+ | 0 |
| LSE-2 | Specify only (read-only) | Yes | No | 2 | 0 |
| LSE-3 | Specify one small defect | Yes | **Yes, explicit** | 1 | **0** |

Three instances, two independent candidate causes tested and eliminated, zero
deliverables.

### Honest conclusion

**The root cause of the `lead-software-engineer` failure is UNKNOWN.** Two hypotheses
have been tested and neither explains it:

1. ~~Tool boundary~~ — confirmed real for LSE-1E's first assignment, eliminated as the
   general cause by LSE-2 and LSE-3.
2. ~~Missing terminal deliverable contract~~ — eliminated by LSE-3.

What remains established, and is sufficient for the workflow repair:

- The failure is **repeatable** across three instances.
- It is **specific to this agent type** — `independent-code-reviewer` and
  `architecture-reviewer`, with identical tool grants and the same coordinator message
  patterns, produced nine substantive deliverables between them on this run.
- It is **not** caused by the assignment, the tools, or the absence of an output
  contract.

**Consequence for Phase 4:** the workflow repair must NOT depend on the
`lead-software-engineer` role, and must NOT claim to have fixed it. The standing
corrections in §6 hold regardless of root cause and are the actionable output. The role
should be treated as unavailable for this project until someone identifies the actual
mechanism.

---

## 4c. CORRECTION — the "agent-type-specific" conclusion is UNDERCUT

§4b concluded the failure was *"specific to this agent type."* **That conclusion no
longer holds and is withdrawn.**

**ENG-SPEC — a `general-purpose` agent, not a `lead-software-engineer` — was given the
same explicit three-token contract and one equivalent follow-up, and also returned
nothing.** The failure is therefore not confined to the `lead-software-engineer`
definition.

### Full record

| Agent | Type | Task shape | Deliverables |
|---|---|---|---|
| CR-1E | independent-code-reviewer | Review / findings | ✅ 4 substantive |
| AR-1E | architecture-reviewer | Review / findings, **and a design specification** | ✅ 5 substantive |
| LSE-1E | lead-software-engineer | Reproduce, then specify | ❌ 0 |
| LSE-2 | lead-software-engineer | Specify patches | ❌ 0 |
| LSE-3 | lead-software-engineer | Specify one small patch | ❌ 0 |
| ENG-SPEC | **general-purpose** | Specify patches | ❌ **0** |

### Candidate explanations, none established

1. **Task shape.** Every agent asked to produce *exact patch text* failed; every agent
   asked to *review and report* succeeded. Weakened by AR-1E successfully delivering a
   detailed design specification.
2. **Session-position effect.** All six deliverables landed earlier in the run; all four
   failures are later. Weakened by AR-1E delivering its policy specification late in the
   same window.
3. **Long-lived vs freshly-spawned.** Both successful agents were repeatedly resumed via
   `SendMessage` and had accumulated context; all four failures were freshly spawned.
   Consistent with the data, but untested.
4. **Something else not identified.**

**The coordinator cannot distinguish these with the evidence available, and will not
guess.** Root cause remains **UNKNOWN**. What is established: four consecutive
freshly-spawned agents, across two types, with explicit contracts, produced no
deliverable, while two long-lived reviewer agents produced nine.

### Consequence — Phase 2 has a real structural blocker

The Founder's instruction was explicit: patch specifications must **not** be derived
solely from AR-1E's design and then returned to AR-1E for architecture approval. With no
independent engineering agent producing a deliverable, that separation cannot currently
be satisfied as specified. **This is escalated to the Founder rather than quietly
resolved by the coordinator writing the patches and describing the review as
independent** — doing so would reproduce exactly the false-assurance pattern this
remediation exists to eliminate.

---

## 4d. FINAL TALLY — the failure is universal to fresh spawns, and the third hypothesis is dead too

Two further agents were engaged for the Sprint 1E remediation review gate. **Both
returned no deliverable**, bringing the total to **six consecutive freshly-spawned
agents producing nothing.**

| # | Agent | Type | Task shape | Contract | Follow-ups | Delivered |
|---|---|---|---|---|---|---|
| — | CR-1E | independent-code-reviewer | review | implicit | 1 | ✅ (and 4× more, resumed) |
| — | AR-1E | architecture-reviewer | review + design spec | implicit | 1 | ✅ (and 4× more, resumed) |
| 1 | LSE-1E | lead-software-engineer | reproduce | no | 3+ | ❌ |
| 2 | LSE-2 | lead-software-engineer | specify | no | 2 | ❌ |
| 3 | LSE-3 | lead-software-engineer | specify (small) | **yes, explicit** | 1 | ❌ |
| 4 | ENG-SPEC | **general-purpose** | specify | **yes, explicit** | 1 | ❌ |
| 5 | CR-FRESH-C1 | **independent-code-reviewer** | **review** | **yes, explicit** | 1 | ❌ |
| 6 | CR-GATE-C1 | **independent-code-reviewer** | **review** | **yes, front-loaded** | 1 | ❌ |

**Agents 5 and 6 kill the last surviving hypothesis.** Both were the *same agent type*
as CR-1E, given the *same task shape* (review) that CR-1E performs successfully, with an
*explicit* deliverable contract that CR-1E never needed. They still produced nothing.

### Hypotheses proposed and eliminated

| # | Hypothesis | Eliminated by |
|---|---|---|
| 1 | Tool boundary — assigned work the role could not perform | LSE-2, LSE-3 (tool-compatible, still failed) |
| 2 | Missing terminal deliverable contract in the definition | LSE-3 (explicit contract in prompt, still failed) |
| 3 | Agent type / task shape | ENG-SPEC (different type), CR-FRESH-C1 and CR-GATE-C1 (same type *and* task as a working agent) |

### What is established

- The failure is **universal to freshly-spawned agents** in this session, independent of
  agent type, task shape, task size, and the presence of an explicit output contract.
- The **only** agents that deliver are CR-1E and AR-1E — spawned in the initial batch and
  thereafter *resumed* via `SendMessage`, ten deliverables between them.
- **Root cause remains UNKNOWN.** Three hypotheses proposed by the coordinator, three
  eliminated by its own tests. A fourth is not proposed on this evidence.

### Consequence — a required gate cannot be satisfied

The Founder's sequence is **Fresh Independent Code Review → Architecture Review →
Founder Approval → commit.** The first gate cannot be obtained. Two attempts were made
and a third was declined as a repetition of a failing action.

**What remains available, stated precisely:**

| Reviewer | Independent of the patches? | Suitable for |
|---|---|---|
| **AR-1E** | **Yes** — authored the policy, not the code | Architecture Review, as specified |
| **CR-1E** | **No** — authored the specification the patches implement | Fidelity verification only, *not* independent review |

**The coordinator will not relabel CR-1E's fidelity check as a fresh independent
review.** That would manufacture the appearance of a gate the Founder specified, which
is the same false-assurance pattern this remediation exists to eliminate — and the
arrangement the Founder explicitly prohibited when routing specification away from
AR-1E.

Escalated to the Founder for decision.

---

## 5. Proposed minimal change — NOT APPLIED, and now NOT RECOMMENDED

> **The supervised sample did not support the hypothesis (§4b). This change is retained
> for the record but is NO LONGER RECOMMENDED.** Applying it would add a contract whose
> mechanism has already been tested in prompt form and failed to produce a deliverable.
> It is kept here so a future investigator can see what was tried and ruled out, not as
> a pending action.

Originally drafted to be applied only on Founder approval and only if the sample
supported the hypothesis. Additive; changes no existing text.

**File:** `.claude/agents/lead-software-engineer.md`
**Insert** a new section before the existing `## Return value`:

```markdown
## Required deliverable structure

Your final message must begin with exactly one of these tokens, alone on the first line:

`COMPLETE SPECIFICATION` · `PARTIAL SPECIFICATION` · `BLOCKED REPORT`

There is no fourth option. Returning without a report is a failure of the task
regardless of the analysis performed. Then provide, as applicable:

1. Current behavior with exact file:line references
2. The required invariant, and the ADR or standard clause it derives from
3. Root cause
4. The exact patch specification — precise existing text and precise replacement text,
   with enough surrounding context that the match is unambiguous
5. Affected files
6. The regression test as complete code, constructing its own fixture
7. Blast radius — which existing tests break, and which assert the behavior being changed
8. Risks, including any place the smallest correct fix is not obvious
9. Verification commands
10. What you did **not** verify, and why
```

**Rationale:** mirrors the contract both working definitions already carry, and encodes
the coordinator-error lesson — you specify, you never author, and a partial or blocked
report is an acceptable outcome while silence is not.

---

## 6. Standing workflow correction (independent of the hypothesis)

This holds regardless of what the sample shows:

1. **Check declared tools against the assignment before dispatch.** No agent may be
   asked to author a file unless its definition grants `Write` or `Edit`.
2. **Reproduction harnesses and patches are authored by the coordinator**, from a
   read-only specialist's written specification. Specialists never bypass their tool
   boundary via Bash redirection, heredocs, `sed -i`, or `tee` — prohibited by the
   Founder.
3. **Every delegated task carries an explicit terminal deliverable contract in the
   prompt**, whatever the definition says, with silence defined as failure.
4. **Designer and reviewer must be different agents.** Patches derived from AR-1E's
   design are specified independently by ENG-SPEC; AR-1E reviews the result but does
   not review its own design rendered as patches.
5. **An unresponsive specialist is recorded as a workflow failure, never as
   agreement.** Absent analysis is never treated as consent or as a clean result.

---

## 7. SUPERSEDING CORRECTION — the fresh-review gate WAS obtained

**Authority:** Founder authorization, 2026-07-26. **Appended, not rewritten.** Sections 1–6
stand unaltered as the contemporaneous record. Where §4d and this section conflict, **this
section is authoritative on the factual question of whether the gate was obtainable.**

### What §4d claims, and why it must be superseded

§4d concludes: *"the fresh independent code review gate cannot be satisfied"*, and commit
`fe7fab1` carries that conclusion in its subject line — *"fresh-review gate unobtainable"*.

**That conclusion was already false when it was committed.** A fresh independent code review
was commissioned, completed, and delivered in full **approximately ten minutes before
`fe7fab1` was authored.**

### Timeline

| Time (EDT, 2026-07-26) | Event |
|---|---|
| 10:33:33 | Candidate frozen by the integration coordinator (HEAD `6301c06`, source tree clean) |
| ~10:34 | **CR-FRESH-1E** commissioned — a freshly-spawned `independent-code-reviewer`, no prior role |
| 10:34:29–10:36:22 | C1 applied to the working tree by a parallel authorized session |
| ~10:45 | Coordinator issued a candidate-identity correction (C1 applied, 318 tests) |
| 10:45:40 | CR-FRESH-1E idle, **no deliverable** |
| 10:46:52 | CR-FRESH-1E independently ran `npx vitest run` — 22 files, 318 tests passed |
| 10:47 | Full terminal-deliverable chase issued |
| 10:50 | Single-line-verdict request issued (minimal deliverable test) |
| 10:52:35 | CR-FRESH-1E idle again, **no deliverable** |
| ~10:53 | Coordinator instructed it to **call `SendMessage` explicitly** rather than rely on final-turn output |
| **~10:54** | **Full certification delivered intact** |
| **11:04:38** | **`fe7fab1` committed, stating the gate cannot be satisfied** |

### The delivered certification

**Verdict: `PASS WITH NON-BLOCKING FINDINGS`. Unresolved blockers: 0.** Scoped to C1 only;
the reviewer stated explicitly that it does not certify the full remediation.

Evidence it produced, all independently derived rather than adopted:

- **All eight SHA-256 hashes recomputed and matched** — five per-file, plus the 289-line diff
  hash `9d56ed51…`, re-verified three times across analysis with no drift.
- **318 tests / 22 files reproduced independently** on a stable hash-verified tree, plus
  `tsc` exit 0 and `eslint` exit 0.
- **All nine C1 change sites diffed against the specification's REPLACE blocks — every one
  verbatim.** Policy compliance confirmed at all six emitting sites; manager purity preserved.
- **Found MAJOR-1**, which no other party had found: applying C1 invalidated C4's §4.2
  insertion anchor so that it now points *inside another test's body*. Nested `it()` is valid
  TypeScript, so **`tsc` and `eslint` both pass** — only `vitest` catches it. Two of the three
  specified gate checks would have given a false green.
- MAJOR-1 was subsequently confirmed independently by the integration coordinator and by
  SPEC-AMEND-1E.
- The same reviewer later performed the D-2 anchor verification, returning 3 of 5 criteria
  passing and finding two further defects (a C3-blocking import instruction, and a false
  provenance claim introduced during amendment).

This is not a marginal or nominal gate result. It changed what may safely be applied.

### Why the six earlier attempts appeared to fail

**CR-FRESH-1E also appeared to fail** — four consecutive idle cycles with zero content,
including on a request whose entire deliverable was a single line. It had completed the entire
review throughout. The report arrived intact the moment explicit `SendMessage` delivery was
mandated.

Across four agents commissioned in the same round by the integration coordinator:

| Agent | Work completed | Report reached commissioner |
|---|---|---|
| FIX-DESIGN-001 | yes | yes — explicit message, first attempt |
| FIX-1F-PLAN | yes — verified on disk | **no** — went idle silently |
| FIX-PHASE2-PLAN | yes — verified on disk | **no, then yes** after re-sending |
| CR-FRESH-1E | yes | **no, then yes** after explicit `SendMessage` mandate |

FIX-PHASE2-PLAN stated the mechanism unprompted: *"I did report at the end of my working turn;
it evidently did not reach you as a message. Re-sending as message text."*

**Three of four agents completed their deliverable and had it lost in transit.** Inbound
message delivery worked throughout; outbound final-turn output did not reach the commissioner.

### What this establishes, and what it does not

**Established:**

1. The fresh independent code review gate **is obtainable**. It was obtained, by a freshly
   spawned agent, and produced findings no other party had.
2. Terminal-report delivery via final-turn output is unreliable; explicit `SendMessage`
   recovered it in every case tested.
3. §4d's hypothesis set — tool boundary, missing deliverable contract, agent type/task shape —
   **did not include the delivery path.** Its "third and last hypothesis is dead" conclusion
   therefore does not establish that root cause is unknowable; it establishes that the
   hypotheses tested were the wrong ones.

**NOT established, and deliberately not claimed:**

1. **That the six earlier failures had this cause.** Their transcripts have not been examined.
   The mechanism is consistent with their symptoms and is the only one demonstrated to produce
   exactly that signature, but consistency is not proof. Root cause for those six remains
   formally **UNKNOWN**.
2. That the delivery defect is universal, deterministic, or fully characterised. One agent in
   four delivered normally on its first attempt.

**The six failed spawn attempts recorded in §4b, §4c, and §4d are preserved as accurate
contemporaneous observations.** What is corrected is the *inference* drawn from them — that a
required governance gate is structurally unobtainable — not the observations themselves.

### Consequence for the designer ≠ reviewer separation rule

§4c and §4d treat the separation requirement as potentially unsatisfiable, and Phase 2 planning
(PLAN-P2-001 C-6 / NEW-5 / Q-8) inherited that as a hard blocker on staffing.

**On the evidence above, it is a protocol defect, not a capability limit.** The remedy is a
delivery requirement in every delegation contract, not a waiver of independence, a human-only
review model, or a restructuring of Phase 2 staffing.

The Founder has, in the same period, **refused** a general exception permitting the two
contributing reviewers to self-certify, and commissioned an uninvolved third reviewer instead —
which succeeded. The separation rule was tested under pressure and upheld at cost.

### Amendment to §6 — standing workflow correction

§6 item 3 requires an explicit terminal deliverable contract with silence defined as failure.
**That is necessary but insufficient: it specifies what to deliver, not how.** All four agents
in the round above had explicit contracts; three still lost their reports.

Added as **§6 item 6**:

> 6. **Every delegated agent must deliver its terminal report to the commissioning agent by an
>    explicit `SendMessage` call**, never by relying on final-turn output alone. **For
>    read-only reviewers, require both** explicit `SendMessage` delivery **and** a written
>    review artifact on disk **where the agent's declared tools permit it** — noting that a
>    read-only role whose definition grants no `Write`/`Edit` cannot satisfy the second, and
>    must not bypass its tool boundary to do so (§6 item 2). Where the disk artifact is
>    tool-blocked, record it as blocked rather than skipped.
>
>    **Rationale:** a document-editing agent's work can be verified against its file even when
>    its report is lost. **A read-only reviewer leaves nothing to check** — which is precisely
>    why the certification gate, and not the three document corrections, appeared to fail.
>
>    Silence remains never a pass (§6 item 5). But silence must be diagnosed as a possible
>    delivery failure before it is recorded as a non-deliverable.

---

## 4e. FINAL TALLY UPDATE — seventh fresh-spawn failure; the review gate remains unobtainable

A third reviewer, **CR-FINAL**, was engaged for the fresh Independent Code Review of the
complete C1–C4 + MAJOR-1 candidate (`ffc805f6…`). It returned no verdict after one
equivalent follow-up, under the same equal-treatment standard the two working reviewers met.

| # | Agent | Type | Task | Contract | Delivered |
|---|---|---|---|---|---|
| 1 | LSE-1E | lead-software-engineer | reproduce | no | ❌ |
| 2 | LSE-2 | lead-software-engineer | specify | no | ❌ |
| 3 | LSE-3 | lead-software-engineer | specify (small) | explicit | ❌ |
| 4 | ENG-SPEC | general-purpose | specify | explicit | ❌ |
| 5 | CR-FRESH-C1 | independent-code-reviewer | review | explicit | ❌ |
| 6 | CR-GATE-C1 | independent-code-reviewer | review | front-loaded | ❌ |
| 7 | **CR-FINAL** | independent-code-reviewer | review | front-loaded + prioritised fallback | ❌ |

**Seven consecutive freshly-spawned agents, zero deliverables.** CR-FINAL received the
strongest brief yet: the verdict obligation stated first and last, partial coverage
explicitly declared acceptable, and a three-item prioritised fallback so a narrow verdict
would still satisfy the gate. It still produced nothing.

**Contrast that holds throughout:** CR-1E and AR-1E — spawned in the initial batch and
thereafter *resumed* — produced ten substantive deliverables between them, including
detailed reviews, a design policy, self-corrections against their own interest, and a
complete patch specification.

**What the external escalation established.** The C1 review that *did* succeed was
commissioned from a **separate clean Claude Code session** using the same registered
`independent-code-reviewer` role. That review was substantive: it found MAJOR-1 by running
its own probe, a defect this coordinating session's gates provably could not catch. So the
role and the task are demonstrably viable — **the constraint is specific to spawning fresh
agents from this coordinating session.**

**Root cause still UNKNOWN.** Three hypotheses were proposed by the coordinator and all
three eliminated by its own tests (tool boundary, missing deliverable contract, agent
type/task shape). A fourth is not proposed on this evidence.

**Standing recommendation:** commission fresh independent reviews from a separate clean
session. That path is proven; in-session fresh spawns are not.
