# Control Verification Standard

**Document ID:** STD-CTRL-001
**Version:** 1.0.0
**Status:** Active
**Authority:** Master Roadmap §8 (Reviewing Work That Enforces), §9 (How a gate is passed)

---

## Scope

This standard applies to **controls**: anything whose purpose is to fail when something is
wrong. Gates, linters, scanners, security rules, structural verifiers, policy checks, schema
validators, CI steps that assert a property.

It does not apply to ordinary application code. The distinction matters because ordinary code
and controls fail differently, and the difference is the entire subject of this document.

---

## The problem this exists to prevent

**A control that cannot fail is indistinguishable from a working control.** Both report
success. There is no observable difference between a scanner that finds nothing because the
codebase is clean and a scanner that finds nothing because it is looking at nothing.

For ordinary code, a green test means the code did what was asked. For a control, green is
*also* precisely what a control that does nothing produces. Running a control and seeing green
therefore establishes only that it ran.

This is not hypothetical. Three controls built in this repository on 2026-07-28 were each
found hollow by independent review, and each had been "verified" green by its author:

| Control | What it claimed | What it did |
|---|---|---|
| npm audit exception list | Fails on any high or critical advisory not explicitly accepted | Keyed on **package name**, so every future advisory in an accepted package — including a hypothetical CVSS 10.0 RCE in Next.js — passed silently |
| Workflow structure verifier | Compares step structure against the base branch | Collected five fields and compared one; printed `structure preserved` and exited 0 when the base ref failed to resolve, which is the default state under `actions/checkout` at `fetch-depth: 1` |
| Mutation harness for the above | Ten mutations, ten detections | Every case ran against an already-modified tree, so the verifier exited non-zero **before any mutation was applied**. Replacing all ten mutations with `pass` still produced eight passes |

The third is the instructive one: it was written specifically to prevent the second, by an
author who had just been burned, and it failed the same way. Diligence is not the remedy.

---

## Rules

### 1. A control is accepted on its failing transcript, not its passing one

Before a control is accepted, it must be shown going **red** on a known-bad input. That
transcript is the primary acceptance evidence; the passing run is secondary.

The reviewable question is not *"does it pass?"* but *"show me it fail."* The second question
cannot be answered by a hollow control.

### 2. Every causal claim requires a null arm

A suite asserting *"this fails when X is present"* must also assert *"this passes when X is
absent"* — from an **identical starting state**.

Without the null arm, a failure attributed to X may have been caused by the starting state, and
the suite reports success while measuring nothing. This is the specific defect that made the
mutation harness above worthless, and it is invisible without the control arm.

```
case: baseline, no mutation applied     -> MUST PASS
case: mutation X applied                -> MUST FAIL
```

If the first case is absent, the second proves nothing.

### 3. Controls are tested from the baseline they will run against

A check that will run against the default branch in CI is verified against the default branch —
not against the author's working tree with unrelated edits in it.

Measuring from a state that already differs from the reference is how a null result and a real
result become impossible to distinguish.

### 4. The author does not write the control's only negative controls

An author's mutations test the failure modes the author already imagined, which are by
construction the modes the control already handles.

This is the most load-bearing rule here, because it is the only one that still works when the
author is confident and wrong. Every hollow control listed above was approved by its author and
exposed by an independent party.

### 5. Absence of evidence fails closed, and says so

A control that cannot perform its comparison must exit with a distinct failure status and state
what it could not do. It must never report success.

Reserve a separate exit code for *"could not evaluate"* so a broken control is never mistaken
for a satisfied one:

```
exit 0  property holds
exit 1  property violated
exit 2  could not evaluate — missing input, unresolvable reference, parse failure
```

### 6. State the claim as a falsifiable sentence before building the check

Write down what the control detects, specifically enough to be wrong:

- Weak: *"fails on new risk"* — untestable, and satisfied by almost anything
- Strong: *"fails when a GHSA advisory appears that is not listed in the exception file"*

Vague claims permit testing something adjacent to the claim and calling it verified. The audit
exception list passed its author's tests because the claim was vague enough to be satisfied by
the wrong behaviour.

---

## Review checklist

For any change that adds or modifies a control:

- [ ] A failing transcript on a known-bad input is included in the evidence
- [ ] Negative controls include a null arm that must pass
- [ ] Negative controls run from the baseline the control will use in production
- [ ] At least one negative control was written by someone other than the author
- [ ] Inability to evaluate exits distinctly from property-violated, and is tested
- [ ] The claim is stated specifically enough to be falsified
- [ ] The reviewer re-derived rather than re-read: constructed inputs and ran them

---

## Note on the regress

"Who verifies the verifier?" terminates — but only at a **falsifiable claim about observable
behaviour that a human can check once by hand**: *this file is genuinely broken, and the tool
must report it.* Everything above that point is machinery, and machinery inherits the
assumptions of whoever built it.

That is why rule 4 matters most. A second party re-deriving is the only step in the chain that
does not inherit the author's assumptions.
