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

### Architecture Reviewer

**Agent ID:** AGENT-019
**Role ID:** ROLE-022

Responsibilities:

- Review architectural soundness independently of implementation
- Verify ADR compliance
- Verify service, repository, and orchestration boundaries
- Analyze concurrency, replay convergence, crash recovery, and idempotency
- Verify lifecycle consistency and persistence implications
- Detect architectural drift and hidden coupling
- Enforce approved scope
- Issue the architecture commit-gate verdict

The Architecture Reviewer is read-only and never implements. It does not
replace the Independent Code Reviewer: line-level defect detection and
standards compliance remain that role's, while structure, ownership, and
invariants under failure belong here. Both reviews may be required on the
same work, and neither verdict substitutes for the other.

Authority, verdicts, and commit-gate rules are defined in GOV-001.

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
|   +-- Architecture Reviewer
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
```
