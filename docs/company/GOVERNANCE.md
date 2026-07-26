# Dev HQ Governance

**Document ID:** GOV-001  
**Version:** 1.0.0  
**Status:** Active  
**Authority:** CONST-001

---

# Purpose

This document defines how Dev HQ makes decisions, approves work, controls scope, resolves conflicts, and enforces company policy.

---

# Decision Classes

## Strategic Decisions

Examples:

- Company direction
- Product portfolio
- Major partnerships
- Major spending
- New departments
- Constitutional amendments

**Owner:** CEO

## Product Decisions

Examples:

- Feature priorities
- Target users
- Product requirements
- Acceptance criteria
- Major user experience changes

**Owner:** CEO or delegated Product Owner

## Design Decisions

Examples:

- User flows
- Interaction patterns
- Information hierarchy
- Visual systems
- Responsive behavior

**Owner:** Design within approved product requirements

## Technical Decisions

Examples:

- Architecture
- Implementation approach
- Libraries
- Component structure
- Internal interfaces

**Owner:** Engineering within approved scope and standards

## Operational Decisions

Examples:

- Workflow sequencing
- Handoff readiness
- Review routing
- Compliance enforcement
- Process correction

**Owner:** Director of Operations

## Release Decisions

Release approval may require:

- Engineering validation
- Constitutional Review
- Operations Review
- Code Review
- QA approval
- Security approval for high-risk work
- CEO approval for major releases

---

# Scope Control

Every task must define:

- Objective
- In-scope work
- Out-of-scope work
- Acceptance criteria
- Responsible owner
- Required reviewers
- Required validations

An employee or agent must not expand scope without approval.

A proposed scope change must include:

- Requested change
- Reason
- Impact on time and complexity
- Risks
- Affected systems
- Recommended decision

The CEO or delegated Product Owner approves product scope changes.

Operations records and communicates approved changes.

---

# Approval States

Work may receive one of the following decisions:

## Approved

The work satisfies the review requirements and may proceed.

## Approved with Limitations

The work may proceed with documented non-blocking limitations.

## Changes Required

The work must return to the responsible owner for correction.

## Rejected

The work materially conflicts with requirements, governance, or company standards.

## Escalated

The reviewer lacks authority or sufficient information, and the decision must be made by a higher authority or specialist.

---

# Role Boundaries

Codex should not approve its own unreviewed implementation when independent review is required.

QA reports observed behavior and does not silently rewrite product requirements.

---

# Implementation Review and the Commit Gate

This section governs review of *implemented* work on its way into permanent
history. It is distinct from WF-006 Architecture Review, which governs how a
proposed architecture is decided *before* implementation and produces an ADR.
WF-006 decides what to build; this section decides whether what was built may
be committed.

## Official Review and Approval Order

1. **Approved scope and Founder decision.** Work may not begin until the
   objective, in-scope and out-of-scope work, acceptance criteria, owner,
   required reviewers, and required validations are defined, and any governing
   Founder decision is recorded.
2. **Planning and implementation.** Owned by the Lead Software Engineer.
3. **Implementation validation and tests.** The implementer runs the required
   validation and records the exact commands and results, including anything
   not validated.
4. **Independent Code Reviewer review.**
5. **Remediation of unresolved code-review blockers**, followed by re-review of
   the corrections.
6. **Architecture Reviewer review.**
7. **Remediation of unresolved architecture blockers**, followed by re-review of
   the corrections.
8. **Founder approval**, where mandatory under the rules below.
9. **Commit.**
10. **Push or release**, under the release authority in Decision Classes and the
    applicable release workflow.

Code review precedes architecture review deliberately. Architecture review is
the more expensive judgment, and it should be spent on work whose line-level
defects are already resolved. Running the two concurrently is permitted only
when Operations records the decision and both verdicts are obtained before the
commit gate.

## Review Authority

**Founder decision authority.** The Founder holds final strategic, product, and
scope authority. A Founder decision cannot be overridden or relitigated by any
agent. An agent that identifies risk in a Founder decision must record that risk
once, then proceed under the decision. The single exception is a decision that
would require an unauthorized or prohibited action; that must be escalated
rather than performed.

**AI Agent Orchestrator routing responsibility.** The Orchestrator determines
which reviews are required, routes work to reviewers in the order above, and
confirms every required verdict exists before the commit gate. The Orchestrator
does not set, revise, or overrule a verdict.

**Lead Software Engineer authority.** Owns technical implementation and
application architecture within approved scope and standards, decides how
approved requirements are implemented, and owns remediation of review findings.
Holds no review authority over their own work.

**Independent Code Reviewer authority.** Owns line-level defect detection,
maintainability, and standards compliance. Issues an approve or reject decision
on implementation quality. Does not decide architecture, product, or scope.

**Architecture Reviewer authority.** Owns the architectural verdict: ADR
compliance, boundaries, orchestration ownership, mandated purity, concurrency,
replay convergence, crash recovery, idempotency, stale-read and stale-write
prevention, lifecycle consistency, persistence implications, drift, hidden
coupling, scope enforcement, and scalability observations. May block the commit
gate. Does not decide product requirements, scope, or priority, and does not
perform line-level code review in place of the Independent Code Reviewer.

## Separation of Implementation and Review

Implementation ownership and review authority may never rest with the same agent
for the same work.

- A reviewer must not review work it produced, planned, or directed.
- A reviewer must not edit, implement, or apply a fix to the work under review.
  Reviewers recommend; the responsible owner implements.
- The Architecture Reviewer is read-only. Its git access is inspection only:
  `status`, `diff`, `log`, and `show`.
- The Independent Code Reviewer is independent from implementation and does not
  rewrite the implementation it reviews.
- Remediation returns to the responsible owner, never to the reviewer who raised
  the finding.

A review produced by the agent that produced the work is not a review, and does
not satisfy the commit gate.

## Separation of Code Review and Architecture Review

| Independent Code Reviewer | Architecture Reviewer |
| --- | --- |
| Does the code do what it says? | Is the structure right, and does it hold under failure? |
| Defects, typing, error handling, readability | Boundaries, ownership, invariants, concurrency, recovery |
| Standards compliance | ADR compliance |
| Approve or reject | PASS / PASS WITH NON-BLOCKING FOLLOW-UPS / FAIL |

A pass from one is not a pass from the other. Neither verdict may be cited to
soften, substitute for, or waive the other.

## When Architecture Review Is Mandatory

Architecture review is required when the work:

- Changes or relies on a decision recorded in an ADR
- Adds or changes a contract, port, adapter, or service boundary
- Changes a lifecycle, state machine, or terminal-state rule
- Introduces or changes concurrency, retry, replay, reconciliation, or recovery
  behavior
- Changes idempotency, keying, or record-identity semantics
- Changes what a public or browser-readable read model exposes
- Changes persistence behavior or the assumptions a durable adapter must meet
- Is delivered under a Founder scope decision that defers part of the work

Architecture review is not required for documentation-only changes, dependency
bumps with no behavioral change, or work Operations records as out of the
categories above.

## When Founder Approval Is Mandatory

Founder approval is required before commit when the work:

- Changes approved product requirements, acceptance criteria, or scope
- Requires an exception to a standard or to this document
- Introduces a new paid service or major dependency
- Carries an unresolved security, privacy, legal, or production risk
- Conflicts with the Constitution or with an existing Founder decision
- Lacks a clear authorized owner

Release-level approval requirements are governed separately under Decision
Classes.

## Verdict Vocabulary

The Architecture Reviewer issues exactly one verdict, from exactly these three:

- **PASS** — no blockers, and no follow-ups worth recording.
- **PASS WITH NON-BLOCKING FOLLOW-UPS** — no blockers; recorded follow-ups
  remain.
- **FAIL** — at least one unresolved blocker.

No other verdict string is valid. A verdict may not be qualified, hedged, or
combined.

`FAIL` requires at least one unresolved blocker. A `FAIL` carrying none is
invalid and must be reissued.

These map onto Approval States as follows: `PASS` and `PASS WITH NON-BLOCKING
FOLLOW-UPS` are *Approved* and *Approved with Limitations* respectively; `FAIL`
is *Changes Required*. A reviewer lacking authority or information issues
*Escalated* rather than any of the three.

## Commit-Gate Rules

Work may pass the commit gate only when all of the following hold:

- Every required review has been performed and its verdict recorded.
- No unresolved blocker exists in any required review.
- Required Founder approval, where mandatory, has been obtained and recorded.
- Required validation has been run, and its results and gaps recorded.
- Any non-blocking follow-ups have been explicitly recorded.

Work carrying an unresolved blocker cannot pass the commit gate. There is no
score, threshold, or majority: one unresolved blocker is sufficient to stop the
commit.

`PASS WITH NON-BLOCKING FOLLOW-UPS` permits commit **only** when the follow-ups
are explicitly recorded in a durable location. An unrecorded follow-up has not
been accepted; it has been lost, and the verdict does not authorize commit.

## Blocker Resolution and Re-Review

- A blocker is resolved when the responsible owner has corrected it and the
  reviewer that raised it has verified the correction.
- A blocker is not resolved by explanation, by disagreement, by the passage of
  time, or by a later reviewer declining to repeat it.
- A blocker resolved during a review, with the resolution verified, is no longer
  unresolved and does not force `FAIL`. The review must record that it was
  raised and how it was closed.
- Re-review after remediation is mandatory and is limited to the corrections and
  anything they affect. It does not reopen settled findings.
- Material change to the work after a verdict invalidates that verdict. The
  review must be redone.

## Prohibition on Bypassing a Failed Review

A `FAIL`, or an unresolved blocker in any required review, may not be bypassed.
It may not be overridden by another agent, waived by the implementer, resolved
by re-routing to a different reviewer, or set aside because a schedule is
pressing.

The only permitted routes past an unresolved blocker are:

1. Correcting the work and passing re-review, or
2. A recorded Founder decision accepting the risk, subject to the Exceptions
   requirements in this document.

Bypassing a required review is grounds for Operations to pause or return the
work under Governance Enforcement.

## Prohibition on Re-Running a Reviewer for a Better Verdict

A review may not be rerun in the hope of a different result.

- Re-invoking a reviewer is permitted only after the work has materially changed,
  or when the prior review was demonstrably performed against the wrong scope or
  an incomplete review surface.
- Every invocation and its verdict must be recorded, including superseded ones.
  Discarding a verdict is falsification of the record.
- Disagreement with a verdict is resolved by evidence, or escalated under
  Conflict Resolution. It is not resolved by repetition.

## Evidence and Audit Requirements

Every review result must be evidence-based and auditable.

- Each finding cites an exact file path and line number or symbol name, and
  quotes the code.
- An asserted ADR, standard, or contract violation quotes the text being
  applied. A constraint may not be paraphrased into existence.
- Each finding is labeled a **confirmed defect** (the failing path was traced) or
  a **plausible risk** (it could not be fully verified), and never both.
- Validation may not be claimed unless it was performed and its output can be
  shown. Work not validated must be disclosed.
- Prior approvals and review reports are context, never proof.
- Review reports are Records under this document and must be retained with the
  work they gate.

## Reviewer Escalation

A reviewer escalates rather than deciding alone when scope is unclear or
disputed, a required input is unavailable, two governing documents conflict, an
ADR conflicts with a Founder decision, the decision owner is unclear, or a
security, privacy, data-loss, or production risk is identified.

Escalation follows Conflict Resolution and states the blocker, the facts, the
impact, the options, the recommended option, and the required decision owner.

## Exceptional and Emergency Handling

There is no separate emergency review path. Urgent work follows this section,
with two existing mechanisms available:

- **Exceptions**, as defined in this document, may waive a standard when the
  waiver records the standard, reason, scope, risks, compensating controls,
  expiration, and approver. An exception may not silently become permanent.
- **CEO override**, as defined under Governance Enforcement, may override an
  operational decision when the override and the accepted risk are documented.

Neither mechanism creates an unreviewed commit. Both produce a record, and both
remain subject to the evidence and audit requirements above.

## Scope Enforcement at Review

- A reviewer verifies the work stayed inside approved scope.
- Work the Founder explicitly deferred must be genuinely absent, not partially
  present. Partial presence of deferred work is a blocker.
- The absence of deferred work is never a defect and must not be reported as
  one.
- A reviewer must not broaden into future work or invent hypothetical
  requirements to justify a finding.
- Genuine out-of-scope discoveries are recorded separately with impact and
  priority. Discovery does not equal approval.

---

# Constitutional Review

Operations performs Constitutional Review for major handoffs.

The review records:

- Scope compliance
- Department-boundary compliance
- Validation honesty
- Security consideration
- Accessibility consideration
- Documentation completeness
- Required approvals
- Identified violations
- Final decision

A technically functioning implementation may still fail Constitutional Review.

---

# Operations Review

Operations Review determines whether the work is ready for the next stage.

It evaluates:

- Handoff completeness
- Requirement coverage
- Acceptance-criteria coverage
- Validation results
- Known limitations
- Workflow ownership
- Required review status
- Release risk
- Next action

Operations Review does not replace specialist technical review.

---

# Conflict Resolution

When a conflict occurs:

1. State the disputed decision clearly.
2. Identify the responsible decision class.
3. Identify the authorized owner.
4. Review requirements, standards, and evidence.
5. Attempt the smallest compliant resolution.
6. Escalate cross-functional disputes to Operations.
7. Escalate strategic, constitutional, or major product disputes to the CEO.

Agents must not hide disagreement or invent approval.

---

# Exceptions

An exception to a standard must include:

- Standard being waived
- Reason
- Scope of the exception
- Risks
- Compensating controls
- Expiration or review date
- Approver

Exceptions may not silently become permanent policy.

Recurring exceptions should trigger review of the underlying standard.

---

# Records

Major decisions should be recorded in one or more of the following:

- Product requirements
- Architecture decision records
- Task specifications
- Review reports
- QA reports
- Release approvals
- Constitutional precedents
- Retrospectives

The record must be clear enough that another employee can understand what was decided and why.

---

# Governance Enforcement

Operations may pause or return work when:

- Scope is unclear
- Required approval is missing
- Validation is incomplete
- Handoff information is misleading
- Department ownership is violated
- A constitutional conflict exists
- Release risk is unacceptable
- Required review was bypassed

The CEO may override an operational decision, but the override and accepted risk should be documented.
