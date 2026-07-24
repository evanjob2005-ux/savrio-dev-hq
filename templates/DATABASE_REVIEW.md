# Database Review Template

**Template ID:** TMP-008

**Version:** 1.0.0

**Owner:** Database Architect

---

# Review Information

## Review ID

DB-XXX

---

## Feature or Change

Describe the database-related change.

---

## Reviewer

Name or AI role conducting the review.

---

## Date

YYYY-MM-DD

---

## Related Documents

- Product Brief
- Technical Plan
- Architecture Decision Record
- Security Review (if applicable)
- Migration Files

---

# Executive Summary

Provide a concise summary including:

- Overall assessment
- Major findings
- Recommendation

---

# Scope

Describe what is included in this review.

Examples:

- Schema changes
- New tables
- New columns
- Relationships
- Indexes
- Constraints
- Migrations
- RLS policies
- Stored procedures
- Views

---

# Schema Review

Verify:

- Naming conventions followed
- Relationships correct
- Constraints appropriate
- Data types appropriate
- Nullable fields justified
- Primary keys correct
- Foreign keys enforced

---

# Migration Review

Verify:

- Migration reversible
- Existing data preserved
- Downtime minimized
- Validation steps included
- Rollback documented
- Tested successfully

---

# Performance Review

Review:

- Query efficiency
- Index usage
- Join performance
- Table scans
- Expected growth
- Storage impact

---

# Security Review

Verify:

- Row Level Security (RLS)
- Least privilege
- Permissions
- Sensitive data protection
- Audit requirements
- Data access policies

---

# Data Integrity

Verify:

- Referential integrity
- Duplicate prevention
- Required constraints
- Transaction safety
- Consistency maintained

---

# Backup & Recovery

Confirm:

- Backup compatibility
- Restore compatibility
- Recovery risks
- Rollback readiness

---

# Findings

Document each finding separately.

## Finding

Description

### Severity

- Critical
- High
- Medium
- Low

### Risk

Describe the potential impact.

### Recommendation

Describe the corrective action.

Repeat as necessary.

---

# Positive Observations

Highlight good database design decisions.

---

# Required Changes

List blocking issues.

---

# Recommendations

List non-blocking improvements.

---

# Overall Decision

Choose one:

- Approved
- Approved with Recommendations
- Changes Required
- Rejected

---

# Approval

Database Architect

Date

Version
