# Security Review Template

**Template ID:** TMP-007

**Version:** 1.0.0

**Owner:** Security Engineer

---

# Review Information

## Review ID

SEC-XXX

---

## Feature or Change

Describe the feature, release, or system being reviewed.

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
- Code Review Report
- QA Report
- Architecture Decision Record (if applicable)

---

# Executive Summary

Provide a concise summary including:

- Overall security assessment
- Major findings
- Overall recommendation

---

# Scope

Describe what is included in this review.

Examples:

- Authentication
- Authorization
- APIs
- Database
- Infrastructure
- File uploads
- AI integrations
- Third-party services

---

# Authentication Review

Verify:

- Authentication required where appropriate
- Session management secure
- Password handling secure
- MFA supported if applicable
- Token handling appropriate

---

# Authorization Review

Verify:

- Least privilege
- Role enforcement
- Permission checks
- Resource ownership validation
- Access control consistency

---

# Data Protection

Verify:

- Sensitive data encrypted
- Secure transmission
- Secrets not exposed
- Personally identifiable information protected
- Secure storage practices

---

# Input Validation

Review:

- Form validation
- API validation
- SQL injection protection
- XSS protection
- Command injection prevention
- File upload validation

---

# API Security

Verify:

- Authentication
- Authorization
- Rate limiting
- Error handling
- Secure responses
- Sensitive information not exposed

---

# Infrastructure Security

Review:

- Environment variables
- Secrets management
- HTTPS enforcement
- Deployment configuration
- Logging configuration
- Monitoring

---

# Dependency Review

Check:

- Known vulnerabilities
- Deprecated packages
- Security advisories
- Package integrity

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

Highlight strong security practices observed.

---

# Residual Risks

Document any accepted risks remaining after review.

---

# Required Changes

List blocking issues that must be resolved before approval.

---

# Recommendations

List non-blocking security improvements.

---

# Overall Decision

Choose one:

- Approved
- Approved with Recommendations
- Changes Required
- Rejected

---

# Approval

Security Engineer

Date

Version
