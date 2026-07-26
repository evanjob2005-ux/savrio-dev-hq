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
