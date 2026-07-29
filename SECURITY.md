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
scans tracked files on each push and pull request. It runs high-confidence
rules for private key blocks and AWS, Google, Slack, GitHub and Stripe live-key
shapes, plus the generic rule described below.

Three exclusions apply, and are stated here because a scan's coverage is only
as honest as its stated limits: the workflow file itself is skipped so its
patterns do not match their own source, files over 2 MB are skipped, and files
that are not valid UTF-8 text are skipped. Everything else tracked by Git is
read in full.

Two further rules — unquoted `KEY=value` assignments in the `.env` keyword
style, and credentials embedded in URLs as `scheme://user:password@host` — run
**only on files whose name begins with `.env`**. They are not repository-wide.
Unquoted assignments elsewhere are covered by the generic rule below instead.

### What the generic rule matches

It flags any 16-or-more character value assigned to a **sensitive name**. The
value may be quoted with `'`, `"` or a backtick, or left unquoted as in YAML,
TOML, INI and shell. It may contain spaces, which matters because a passphrase
is the one credential form a person is likely to type by hand.

The name is split into words on `_`, `-`, `.` and camelCase boundaries, and is
sensitive when:

- any word is `secret`, `token`, `password`, `passwd`, `pwd`, `apikey` or
  `credential` (plurals included); or
- any word is `key` **and** another word qualifies it as a credential rather
  than a lookup key: `api`, `private`, `signing`, `sign`, `encryption`,
  `encrypt`, `access`, `auth`, `service`, `role`, `master`, `session`,
  `refresh`, `bearer`, `webhook`, `publishable`.

Matching is by whole word, not substring, so `monkey` and `keyboard` do not
count as `key`. `API_KEY`, `STRIPE_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY`
are all matched. Name length is not bounded: a sensitive word counts wherever
it appears, including at the start of a very long identifier.

`key` deliberately does **not** count on its own. React's `key` prop,
`idempotencyKey` and `PENDING_DISPATCH_STORAGE_KEY` are ordinary identifiers,
and a rule that flagged every one of them would be muted rather than obeyed.

Two shapes are skipped because they are not literals at all: a value containing
`${`, which is interpolated at runtime rather than committed, and an unquoted
value that is program syntax rather than data — `body.callbackToken,` is a
property being passed along, not a secret being written down.

### The header exemption is decided on the value

`DEV_HQ_INTERNAL_TOKEN_HEADER` holds `x-dev-hq-internal-token`: the wire name of
the header a token travels in, not the token. So a name mentioning `header` is
exempt — but **only when its value is genuinely shaped like a header name**:
lowercase, hyphen-separated, with no segment long or opaque enough to be
carrying entropy.

The name alone is never enough, and this is not a hypothetical distinction. When
the exemption was decided on the name — and decided before the sensitive words
were consulted — `SECRET_HEADER`, `API_KEY_HEADER` and `AUTH_HEADER_PASSWORD`
were all exempt no matter what they held. Appending one word to any identifier
switched the entire generic rule off for that line. A word that makes something
a credential must not be cancellable by a word sitting next to it.

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

The reason is not optional, and the scanner enforces that rather than trusting
it. A pragma with no reason after it suppresses nothing, and is itself reported
as a finding — wherever it appears, whether or not anything on that line was
flagged, so one cannot be planted in advance to disarm a future finding. State
the reason on the same line as the pragma.

This exists because the alternative — widening a
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