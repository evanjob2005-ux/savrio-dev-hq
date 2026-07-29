# Code Review Engineering Standard

**Document ID:** STANDARD-015

**Version:** 1.0.0

**Applies To:** All Engineering Agents

---

# Purpose

This standard defines the required code review process for every code change within the Savrio ecosystem.

Code reviews exist to improve software quality, reduce defects, share engineering knowledge, and ensure long-term maintainability.

---

# Guiding Principles

Every code review should be:

- Constructive
- Thorough
- Objective
- Respectful
- Consistent
- Timely
- Educational
- Quality focused

---

# Review Philosophy

Code reviews evaluate the implementation—not the engineer.

The objective is to improve the codebase while helping every contributor grow through shared knowledge and consistent engineering practices.

---

# Review Requirements

Every pull request must receive review before merging unless explicitly exempted.

Reviews should verify:

- Correctness
- Maintainability
- Readability
- Security
- Performance
- Reliability
- Standards compliance

---

# Reviewer Responsibilities

Reviewers should:

- Understand the intended change
- Verify requirements are satisfied
- Check for regressions
- Identify potential risks
- Suggest improvements
- Approve only production-ready code

Reviews should prioritize correctness over personal style preferences.

---

# Author Responsibilities

Authors should:

- Submit focused pull requests
- Explain the purpose of changes
- Link relevant issues when applicable
- Respond respectfully to feedback
- Update code when changes are requested
- Verify all automated checks before requesting review

Authors remain responsible for the quality of their code after approval.

---

# Pull Request Size

Prefer:

- Small pull requests
- Single-purpose changes
- Incremental improvements

Large pull requests should be divided whenever practical.

---

# Review Checklist

Verify:

- Requirements implemented
- Code is understandable
- Naming is consistent
- Type safety maintained
- Tests included or updated
- Documentation updated
- Error handling complete
- Logging appropriate
- Performance acceptable
- Security maintained

---

# Architecture Review

Confirm that the implementation:

- Matches project architecture
- Respects module boundaries
- Avoids unnecessary coupling
- Uses approved design patterns
- Maintains scalability

Architectural consistency should be preserved.

---

# Security Review

Verify:

- Authentication
- Authorization
- Input validation
- Secret management
- SQL safety
- XSS prevention
- Dependency safety

Security concerns must be resolved before approval.

---

# Performance Review

Evaluate:

- Query efficiency
- Rendering performance
- API efficiency
- Memory usage
- Bundle size
- Network requests

Identify measurable optimization opportunities where appropriate.

---

# Testing Review

Ensure:

- Unit tests added or updated
- Integration tests appropriate
- Critical paths verified
- Regression risks addressed
- Automated checks passing

Testing should reflect the risk level of the change.

---

# Reviewing Controls

A **control** is anything whose purpose is to fail when something is wrong: a gate, a scanner,
a lint rule, a structural verifier, a policy check.

Controls require a different review than ordinary code, because a control that cannot fail is
indistinguishable from a working one — both report success. A green result proves the control
ran, not that it works.

When reviewing a control:

- **Ask to see it fail.** The acceptance evidence is a failing transcript on a known-bad input.
  A passing run is secondary and cannot substitute.
- **Re-derive rather than re-read.** Construct inputs the control claims to catch and run them.
  The defect in a hollow control is never visible in its logic — it is in what the logic is
  applied to and what it silently skips.
- **Check for a null arm.** A suite claiming "this fails when X" must also prove "this passes
  when not-X" from an identical starting state, or the failure may be caused by the starting
  state rather than by X.
- **Do not accept the author's negative controls as sufficient.** They test the failure modes
  the author already imagined, which are the ones the control already handles.

Full requirements: `standards/CONTROL_VERIFICATION_STANDARD.md`.

---

# Documentation Review

Verify documentation updates for:

- APIs
- Architecture
- Configuration
- User-facing behavior
- Operational changes

Documentation is part of the deliverable.

---

# Review Comments

Feedback should be:

- Specific
- Actionable
- Respectful
- Technically justified

Avoid vague or purely subjective comments.

---

# Approval Criteria

Approve only when:

- Requirements satisfied
- Standards followed
- Tests pass
- Documentation updated
- Risks understood
- Production readiness confirmed

Approval indicates confidence in the implementation.

---

# Merge Requirements

Before merge verify:

- Required approvals received
- CI passes
- Conflicts resolved
- Requested changes addressed
- Branch up to date when required

No failing checks may be ignored without documented approval.

---

# Continuous Improvement

Recurring review findings should be used to:

- Improve standards
- Improve tooling
- Improve documentation
- Improve onboarding
- Improve engineering practices

The review process should evolve alongside the codebase.

---

# Definition of Done

A code review is complete when:

- Feedback addressed
- Standards verified
- Tests passing
- Documentation updated
- Approval granted
- Ready for merge

---

# Compliance

All engineering agents must comply with this standard.

Every code review should strengthen the quality, security, maintainability, and long-term health of the Savrio codebase.