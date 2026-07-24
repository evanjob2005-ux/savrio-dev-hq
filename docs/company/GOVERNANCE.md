# Dev HQ Organization

**Document ID:** ORG-001  
**Version:** 1.0.0  
**Status:** Active  
**Authority:** CONST-001

---

# Leadership Structure

## Founder and CEO

**Assigned to:** Evan

The Founder and CEO owns:

- Company vision
- Product direction
- Major priorities
- Final product decisions
- Constitutional approval
- Major releases
- Department creation
- Strategic partnerships
- Final escalation authority

## Director of Operations

**Assigned to:** ChatGPT

The Director of Operations owns:

- Workflow coordination
- Constitutional enforcement
- Task routing
- Department coordination
- Scope protection
- Handoff review
- Approval tracking
- Operational decisions
- Escalation to the CEO

---

# Departments and Roles

## Product and Experience

### Product Owner

**Current owner:** CEO with Operations support

Responsibilities:

- Define product goals
- Define users and problems
- Approve requirements
- Set priorities
- Approve scope changes
- Define acceptance criteria

### Product and UX Designer

**Assigned to:** Claude Design

Responsibilities:

- User flows
- Information architecture
- UX recommendations
- Interaction behavior
- Design specifications
- Design critique
- Design handoff

### Visual UI Designer

**Assigned to:** v0

Responsibilities:

- Interface concepts
- Visual layouts
- Component presentation
- Responsive design concepts
- Rapid visual prototypes

v0 output is a design and implementation aid, not automatically approved production code.

---

## Engineering

### Lead Software Engineer

**Assigned to:** Claude Code

Responsibilities:

- Technical planning
- Architecture
- Feature implementation
- Refactoring within approved scope
- Integration
- Engineering validation
- Technical handoff

### Associate Software Engineer

**Assigned to:** GitHub Copilot

Responsibilities:

- In-editor code assistance
- Repetitive implementation
- Tests and documentation
- Small scoped corrections
- Boilerplate generation

Copilot must not independently redefine architecture, requirements, or product scope.

---

## Code Quality

### Independent Code Reviewer

**Assigned to:** Codex

Responsibilities:

- Review implementation independently
- Identify defects and regressions
- Evaluate maintainability
- Verify scope compliance
- Verify required corrections
- Distinguish blocking from non-blocking findings

Codex should not approve its own unreviewed implementation when independent review is required.

---

## Quality Assurance

### QA Engineer

**Assigned to:** Gemini

Responsibilities:

- Functional testing
- Regression testing
- Visual inspection
- Browser behavior review
- Acceptance-criteria validation
- Defect reporting
- Release-readiness recommendation

QA reports observed behavior and does not silently rewrite product requirements.

---

## Research

### Research Analyst

**Assigned as needed**

Responsibilities:

- Technical research
- Product research
- Competitive analysis
- Source evaluation
- Evidence summaries
- Risk and uncertainty reporting

---

## Security

### Security Engineer

**Assigned as needed**

Responsibilities:

- Threat modeling
- Authentication and authorization review
- Secrets management review
- Dependency and supply-chain review
- Data protection
- Security findings and remediation guidance

---

## Data and Database

### Database Architect

**Assigned as needed**

Responsibilities:

- Data modeling
- Schema review
- Database migrations
- Authorization policies
- Data integrity
- Query performance
- Backup and recovery considerations

---

## Reliability

### Reliability Engineer

**Assigned as needed**

Responsibilities:

- Logging
- Monitoring
- Error tracking
- Performance monitoring
- Incident response
- Recovery planning
- Production health review

---

# Reporting Structure

```text
Founder and CEO
|
+-- Director of Operations
|
+-- Product and Experience
|   +-- Product Owner
|   +-- Product and UX Designer
|   +-- Visual UI Designer
|
+-- Engineering
|   +-- Lead Software Engineer
|   +-- Associate Software Engineer
|
+-- Code Quality
|   +-- Independent Code Reviewer
|
+-- Quality Assurance
|   +-- QA Engineer
|
+-- Research
|   +-- Research Analyst
|
+-- Security
|   +-- Security Engineer
|
+-- Data and Database
|   +-- Database Architect
|
+-- Reliability
    +-- Reliability Engineer

# 3. Create the governance document

```powershell
@'
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
