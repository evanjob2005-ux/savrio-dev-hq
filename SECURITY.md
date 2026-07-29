# Security Policy

**Version:** 1.0.0

**Project:** Savrio Engineering Operating System

---

# Purpose

Security is a foundational engineering principle for every Savrio product.

Every engineer and AI agent is responsible for protecting user data, application integrity, and infrastructure.

Security is not a single phase of development—it is incorporated throughout the entire software lifecycle.

---

# Security Principles

The Savrio platform follows these core principles:

- Least privilege
- Defense in depth
- Secure by default
- Privacy by design
- Fail securely
- Continuous monitoring
- Responsible disclosure

---

# Reporting Security Issues

If a potential security vulnerability is discovered:

1. Do not publicly disclose the issue.
2. Document the vulnerability.
3. Assess potential impact.
4. Notify the project maintainers.
5. Create a private remediation plan.
6. Validate the fix before release.
7. Publish a security notice if appropriate.

---

# Sensitive Information

Never commit:

- API keys
- OAuth credentials
- Service account keys
- Database passwords
- Private certificates
- Encryption keys
- Access tokens
- Session secrets
- Production credentials
- Personal user data

Sensitive information belongs in secure secret management systems.

## Automated credential scanning

The `Credential and Artifact Audit` job in `.github/workflows/security.yml`
scans every tracked file on each push and pull request. It runs high-confidence
rules for private key blocks and AWS, Google, Slack and GitHub token shapes, plus
a generic rule that flags any 16-or-more character quoted value assigned to a
name containing `secret`, `token`, `password`, `passwd`, or `api_key`. A separate
rule covers unquoted `.env`-style assignments and credentials embedded in URLs.

The generic rule judges the **value**, not the file. Test files are scanned like
everything else, because a real staging password pasted into a spec file is a
real leak. A value is exempt only if it announces itself as a fixture — a
`test-`, `fake_`, `example.`, `mock-` or similar prefix **and** a shape that
looks synthetic: lowercase, no unusual symbols, no long opaque segment, no
hex-like blob. `test-internal-token` is exempt; `test-account-Xy9$kL2mQp` is not.

## Suppressing a false positive

When the scanner flags a value that is genuinely not a credential, **suppress
that line — do not edit the scanner.** Add the pragma on the flagged line or the
line directly above it:

```ts
// scanner:allow-secret documented fixture for the token-rotation test
const TOKEN = "aaaaaaaaaaaaaaaaaaaa";
```

The reason is not optional. This exists because the alternative — widening a
regex to clear one false positive — has already caused a real defect here: an
earlier change disabled the generic rule for all test files to silence two
fixtures, and independent review demonstrated four real credentials that then
passed undetected. A pragma keeps every suppression a reviewable line in a diff
with an author attached; a regex edit silently weakens the rule for everyone.

If you find yourself adding several pragmas to the same file, that is a signal
the values belong in a fixture module or an environment variable, not that the
rule is wrong.

---

# Environment Variables

All secrets must be stored in environment variables.

Examples:

```
OPENAI_API_KEY

SUPABASE_SERVICE_ROLE_KEY

DATABASE_URL

STRIPE_SECRET_KEY
```

Secrets should never appear in:

- Source code
- Git history
- Documentation
- Screenshots
- Logs
- Pull requests

---

# Authentication

Authentication systems should:

- Use secure providers
- Validate every request
- Protect sessions
- Prevent privilege escalation
- Support account recovery
- Expire sessions appropriately

---

# Authorization

Authorization must follow least privilege.

Users should only access resources they are explicitly permitted to access.

Never trust client-side authorization alone.

All authorization must be enforced on the server.

---

# API Security

Every API should:

- Validate all inputs
- Sanitize user data
- Authenticate requests
- Authorize actions
- Rate limit abuse
- Return safe error messages
- Log important events

---

# Database Security

Databases should:

- Enforce Row Level Security where applicable
- Use parameterized queries
- Avoid dynamic SQL
- Encrypt sensitive information
- Backup regularly
- Restrict administrative access

---

# AI Security

AI systems should:

- Validate prompts
- Filter unsafe inputs
- Validate model outputs
- Prevent prompt injection
- Protect API credentials
- Log failures appropriately

Generated content should never automatically execute code.

---

# Dependency Management

Dependencies should:

- Be actively maintained
- Receive security updates
- Be scanned for vulnerabilities
- Avoid unnecessary packages

Outdated or abandoned dependencies should be replaced when practical.

---

# Logging

Logs should never contain:

- Passwords
- API keys
- Authentication tokens
- Personal financial data
- Medical information
- Sensitive personal information

Logs should contain enough information to diagnose issues without exposing confidential data.

---

# Encryption

Sensitive information should be encrypted:

- In transit
- At rest
- During backup when appropriate

Industry-standard cryptographic algorithms should always be used.

---

# Access Control

Administrative access should be limited to authorized maintainers.

Access should be reviewed periodically.

Unused accounts should be removed promptly.

---

# Incident Response

If a security incident occurs:

1. Identify the issue.
2. Contain the impact.
3. Preserve evidence.
4. Investigate the cause.
5. Implement remediation.
6. Verify the fix.
7. Document lessons learned.
8. Improve processes to prevent recurrence.

---

# Security Reviews

Security should be reviewed during:

- Architecture planning
- Code review
- Testing
- Deployment
- Production monitoring

High-risk features should receive additional review.

---

# Third-Party Services

Before integrating external services:

- Review documentation
- Evaluate security practices
- Minimize requested permissions
- Verify data handling policies
- Limit stored credentials

---

# Continuous Improvement

Security is an ongoing process.

The engineering team should regularly:

- Update dependencies
- Review permissions
- Audit infrastructure
- Improve monitoring
- Refine security documentation
- Learn from incidents

---

# Compliance

All contributors, including AI agents, are expected to follow this security policy.

Protecting user trust is a shared responsibility across the entire engineering organization.