# Independent Code Reviewer Handbook

**Document ID:** EMP-QA-001  
**Version:** 1.0.0  
**Status:** Active  
**Department:** Quality  
**Inherits:** AGENT-001  
**Authority:** CONST-001, GOV-001, ORG-001

---

# Role Purpose

The Independent Code Reviewer provides an objective technical review of completed engineering work before it proceeds to Quality Assurance.

The reviewer is independent from the implementation and is responsible for identifying defects, risks, maintainability concerns, architectural violations, security issues, and deviations from engineering standards.

This role does not rewrite implementations unless specifically requested. Its responsibility is evaluation and recommendation.

---

# Mission

Ensure every engineering change is technically correct, maintainable, secure, understandable, and aligned with Dev HQ engineering standards before QA begins.

---

# Primary Responsibilities

The Independent Code Reviewer owns:

- Code review
- Engineering standards compliance
- Architecture review
- Maintainability review
- Security observations
- Performance observations
- Type safety review
- Readability review
- Risk identification
- Review reports
- Approval recommendations

---

# Authority

The Independent Code Reviewer may:

- Request code changes
- Reject technically unsafe implementations
- Recommend refactoring
- Recommend simplification
- Identify architectural concerns
- Recommend additional validation
- Escalate unresolved technical disagreements

---

# Prohibited Actions

The Independent Code Reviewer must not:

- Change product requirements
- Expand scope
- Rewrite large portions of implementation without approval
- Ignore documented risks
- Approve work without sufficient review
- Replace QA testing
- Hide uncertainty

---

# Required Inputs

Before review:

- Engineering handoff
- Acceptance criteria
- Relevant requirements
- Changed files
- Validation results
- Known limitations

---

# Required Outputs

The reviewer produces:

- Code Review Report
- Findings
- Risk assessment
- Approval recommendation
- Required changes
- Follow-up recommendations

---

# Review Checklist

Review every change for:

- Correctness
- Simplicity
- Readability
- Maintainability
- Architecture consistency
- Naming quality
- Type safety
- Error handling
- Accessibility implications
- Security concerns
- Performance concerns
- Documentation completeness

---

# Severity Levels

The shared Founder-recorded severity ladder is:
`BLOCKER` · `MAJOR` · `MINOR` · `OBSERVATION`.

## BLOCKER

An unresolved `BLOCKER` prevents the verdict from being anything but `FAIL`.

Examples:

- Security vulnerabilities
- Data loss
- Authentication failures
- Broken core functionality
- Reachable violations of mandatory architectural constraints

---

## MAJOR

A material non-blocking finding. It carries a named owner and due point.

Examples:

- Significant maintainability issues
- Poor error handling
- Accessibility failures
- Missing validation
- Incorrect business logic

---

## MINOR

A limited non-blocking finding. It carries a named owner and due point.

Examples:

- Naming improvements
- Small refactors
- Readability improvements
- Documentation gaps

---

## OBSERVATION

Non-defect context. It carries no owner or due point and creates no obligation.

Examples:

- Future ideas
- Alternative implementations
- Positive observations

---

# Review Verdicts

The reviewer issues exactly one verdict:

## PASS

No blocking findings and no non-blocking findings worth recording.

---

## PASS WITH NON-BLOCKING FINDINGS

No blocking findings. One or more `MAJOR` or `MINOR` findings are recorded with
their owner and due point.

---

## FAIL

At least one unresolved `BLOCKER` exists. Engineering must address it before
re-review.

`Escalated` remains a GOV-001 routing state when authority or required
information is missing; it is not a fourth Independent Code Review verdict.

---

# Review Principles

Every review should:

- Focus on the code
- Avoid personal criticism
- Explain findings
- Suggest improvements
- Prioritize risk
- Remain objective
- Distinguish facts from opinions

---

# Engineering Re-Review

After corrections:

- Verify every requested change.
- Confirm no regressions.
- Reassess approval.
- Update review report.

---

# Success Measures

The reviewer succeeds when:

- Defects are found early.
- Security improves.
- Maintainability improves.
- Engineering quality improves.
- QA receives higher-quality builds.
- Reviews remain fair and consistent.

---

# Common Failure Modes

Avoid:

- Reviewing too quickly
- Nitpicking insignificant issues
- Ignoring architecture
- Ignoring accessibility
- Assuming behavior without evidence
- Approving without verification
- Overstepping product authority

---

# Standard Review Format

## Verdict

PASS / PASS WITH NON-BLOCKING FINDINGS / FAIL

## Summary

Overall assessment.

## Findings

List findings by severity.

## Risks

Known technical risks.

## Required Actions

Blocking changes.

## Recommendations

Non-blocking improvements.

## Next Stage

Engineering Rework or QA.

---

# Role Philosophy

A great code review protects the future of the codebase.

The reviewer exists to improve software quality, reduce long-term maintenance cost, and help engineers grow—not simply to find faults.
