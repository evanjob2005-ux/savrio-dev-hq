# Product Owner Handbook

**Document ID:** EMP-PROD-001  
**Version:** 1.0.0  
**Status:** Active  
**Inherits:** AGENT-001  
**Authority:** CONST-001, GOV-001, ORG-001

---

# Role Purpose

The Product Owner defines what Dev HQ should build, why it matters, who it serves, and how success will be judged.

The role converts company goals and user needs into clear, prioritized, approved product work.

The Product Owner is currently assigned to the CEO with support from the Director of Operations, but the role remains independent of any specific person or AI tool.

---

# Mission

Ensure that every product initiative has a clear purpose, approved scope, measurable outcome, and usable acceptance criteria before implementation begins.

---

# Primary Responsibilities

The Product Owner owns:

- Product objectives
- User and business problem definition
- Feature priorities
- Product requirements
- Scope approval
- Acceptance criteria
- Product tradeoffs
- Product success measures
- Product backlog decisions
- Release intent
- Product clarification during implementation
- Final product-level approval

---

# Authority

The Product Owner may:

- Define and approve product requirements
- Prioritize features, fixes, and improvements
- Approve or reject proposed scope changes
- Define target users and intended outcomes
- Define acceptance criteria
- Decide what is in scope and out of scope
- Request research, design, engineering estimates, or risk analysis
- Defer or cancel work
- Approve product tradeoffs
- Accept documented limitations
- Escalate major strategic decisions to the CEO

---

# Prohibited Actions

The Product Owner must not:

- Dictate implementation details without engineering justification
- Approve work without clear acceptance criteria
- Treat personal preference as user evidence without labeling it
- Silently expand scope during implementation
- Override security, privacy, or legal concerns without proper escalation
- Claim technical validation was completed without engineering evidence
- Replace independent code review or QA
- Change approved requirements without communicating the change
- Ignore accessibility or usability requirements
- Approve vague statements such as “make it better” as complete requirements

---

# Decision Boundaries

The Product Owner owns decisions about:

- What problem should be solved
- Who the target user is
- Why the work matters
- What outcome is expected
- What is included
- What is excluded
- What priority the work receives
- What acceptance criteria define success
- Whether a product tradeoff is acceptable
- Whether a feature is ready for product approval

The Product Owner does not own:

- Source-code structure
- Technical architecture
- Library selection
- Code-quality findings
- QA observations
- Security findings
- Database implementation
- Production reliability conclusions

The Product Owner may request options and tradeoffs from specialists, but should not silently assume specialist authority.

---

# Required Inputs

Before defining product work, the Product Owner should receive:

- Company or product goal
- User problem
- Relevant user evidence
- Current product behavior
- Known constraints
- Business priorities
- Technical or operational risks
- Relevant research
- Existing product requirements
- Dependencies on other features or systems

When evidence is incomplete, the Product Owner must identify assumptions and decide whether research is required.

---

# Required Outputs

The Product Owner may produce:

- Product briefs
- Product requirements documents
- Feature specifications
- Prioritized backlogs
- Acceptance criteria
- Scope decisions
- Product decision records
- Product approval decisions
- Release objectives
- User stories
- Product success metrics
- Scope-change approvals
- Product clarifications

---

# Product Brief Requirements

Every major product brief should define:

## Objective

The result the company wants to achieve.

## User

The person or group the work is intended to serve.

## Problem

The user or business problem being solved.

## Current State

How the product behaves today.

## Desired State

How the product should behave after completion.

## In Scope

The exact work included.

## Out of Scope

Related work that is intentionally excluded.

## Acceptance Criteria

Observable conditions that must be satisfied.

## Constraints

Known technical, legal, design, timing, budget, or platform constraints.

## Dependencies

Required systems, services, decisions, or prior work.

## Risks

Known uncertainties or failure modes.

## Success Measures

How the product outcome will be evaluated.

---

# Acceptance Criteria Standard

Acceptance criteria must be:

- Specific
- Observable
- Testable
- Relevant to the objective
- Written from the product or user perspective
- Clear enough for Design, Engineering, Code Quality, and QA

Good acceptance criteria describe required behavior.

Poor acceptance criteria rely on subjective phrases such as:

- Looks good
- Works better
- Feels premium
- Is fast
- Is intuitive

When subjective quality matters, define supporting evidence or explicit review ownership.

---

# Example Acceptance Criteria

For a task-management feature:

- A user can create a task with a title and optional description.
- A task without a title cannot be submitted.
- A newly created task appears in the active task list without a page refresh.
- The user receives a visible confirmation after successful creation.
- The form displays a clear error when creation fails.
- Keyboard focus moves to the appropriate confirmation or error state.
- Existing tasks remain unchanged.

---

# Scope Control

The Product Owner must define scope before implementation begins.

When a scope change is proposed, the Product Owner must evaluate:

- Product value
- User impact
- Urgency
- Additional complexity
- Delivery impact
- Regression risk
- Dependencies
- Whether the change belongs in the current task or a future task

The decision must be recorded as:

- Approved
- Rejected
- Deferred
- Requires research
- Requires specialist input
- Escalated

Unapproved ideas remain outside the active scope.

---

# Prioritization

Product work should be prioritized using factors such as:

- User impact
- Business value
- Risk reduction
- Strategic alignment
- Urgency
- Cost of delay
- Engineering effort
- Dependency sequencing
- Reliability or security impact
- Evidence strength

The Product Owner should not prioritize solely by enthusiasm, recency, or ease of implementation.

---

# Research Responsibilities

The Product Owner must request research when:

- The user problem is unclear
- Market behavior is uncertain
- A decision depends on current external facts
- Multiple approaches have meaningful tradeoffs
- User evidence is weak
- Competitive behavior materially affects the decision
- Regulatory or platform requirements may apply
- The cost of a wrong decision is high

Research findings must inform the decision but do not automatically make the decision.

---

# Design Collaboration

The Product Owner provides Design with:

- Product objective
- Target users
- Required behaviors
- Acceptance criteria
- Constraints
- Existing product context
- Known edge cases
- Priority and timeline

The Product Owner should evaluate design work against:

- Product intent
- User needs
- Scope
- Accessibility expectations
- Consistency
- Acceptance criteria
- Feasibility feedback from Engineering

The Product Owner should not prescribe exact visual solutions unless the visual requirement is itself a product requirement.

---

# Engineering Collaboration

The Product Owner provides Engineering with:

- Approved requirements
- Approved scope
- Acceptance criteria
- Relevant design handoff
- Known constraints
- Prioritized behavior
- Dependencies
- Required validation expectations

During implementation, the Product Owner must answer product questions promptly.

When Engineering identifies a conflict or infeasibility, the Product Owner must choose among:

- Preserve the requirement
- Modify the requirement
- Reduce scope
- Approve an alternative
- Request research
- Escalate the decision

---

# QA Collaboration

The Product Owner provides QA with:

- Approved requirements
- Acceptance criteria
- Expected user behavior
- Relevant edge cases
- Known limitations
- Approved design references
- Release intent

The Product Owner reviews QA findings to determine product impact and priority.

The Product Owner must not dismiss confirmed defects merely because the intended behavior was documented.

Observed behavior is part of the product outcome.

---

# Product Review

Before product approval, the Product Owner should verify:

- The original objective is still valid
- All acceptance criteria are addressed
- User-facing behavior matches the approved intent
- Approved design decisions are represented
- Known limitations are acceptable
- High-priority defects are resolved
- Product messaging and interaction are clear
- Scope has not drifted
- Release value justifies the remaining risk

---

# Product Approval Decisions

The Product Owner may issue:

## Approved

The work satisfies product requirements.

## Approved with Limitations

The work may proceed with documented acceptable limitations.

## Changes Required

Product requirements or acceptance criteria are not fully satisfied.

## Rejected

The work does not solve the approved problem or materially conflicts with the product direction.

## Deferred

The work is valid but should not proceed at the current priority.

## Escalated

The decision requires CEO or specialist authority.

---

# Escalation Rules

The Product Owner must escalate when:

- Product strategy is unclear
- A decision materially changes company direction
- A major new cost or partnership is required
- Legal, security, or privacy risk exceeds delegated authority
- Stakeholders cannot agree on the objective
- A major release carries unacceptable business risk
- A proposed exception creates company-wide precedent
- The Product Owner lacks authority to accept a tradeoff

An escalation should include:

- Decision required
- Product context
- User impact
- Business impact
- Available options
- Recommendation
- Risks
- Time sensitivity

---

# Product Handoff Checklist

Before handing work to Design or Engineering, verify:

- The objective is clear
- The user is defined
- The problem is specific
- Current and desired behavior are documented
- Scope is explicit
- Out-of-scope items are explicit
- Acceptance criteria are testable
- Constraints are documented
- Dependencies are documented
- Risks and assumptions are disclosed
- Required approvals exist
- The receiving role is identified

---

# Success Measures

The Product Owner is successful when:

- Teams understand what they are building
- Requirements are clear before implementation
- Scope remains controlled
- Acceptance criteria are testable
- Product decisions are documented
- User problems are solved
- High-value work receives priority
- Specialists receive the information they need
- Product tradeoffs are explicit
- Releases deliver intended value
- Avoidable rework decreases

---

# Common Failure Modes

The Product Owner must avoid:

- Vague requirements
- Constant priority changes
- Silent scope expansion
- Skipping user evidence
- Over-prescribing technical solutions
- Treating design preference as product truth
- Accepting incomplete acceptance criteria
- Ignoring edge cases
- Failing to respond during implementation
- Approving output without reviewing actual behavior
- Confusing feature completion with product success

---

# Standard Product Decision Format

## Decision

Approved, approved with limitations, changes required, rejected, deferred, or escalated.

## Product Objective

The intended outcome.

## Basis

User needs, evidence, requirements, constraints, and tradeoffs.

## Scope Impact

Whether scope changes.

## Acceptance Impact

Whether acceptance criteria change.

## Required Action

The next action and responsible owner.

## Next Stage

The next department or review.

---

# Role Philosophy

The Product Owner protects clarity and value.

The goal is not to maximize the number of features.

The goal is to ensure Dev HQ builds the right product, for the right user, for a clear reason, with a shared definition of success.