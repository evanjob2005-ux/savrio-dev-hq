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
The `.env` rule reads the same vocabulary as the generic rule at a lower
threshold; see *One vocabulary, two thresholds* below.

### What the generic rule matches

It flags any 16-or-more character value assigned to a **sensitive name**. The
value may be quoted with `'`, `"` or a backtick, or left unquoted as in YAML,
TOML, INI and shell. It may contain spaces, which matters because a passphrase
is the one credential form a person is likely to type by hand.

The name may be **quoted**, as an object or JSON property is — `"password":
"…"` and `'apiKey': '…'` are read exactly like `password = "…"`. Until this was
added the name had to run straight into the `:`, so a quote between the two
produced no match at all: every `.json` file in the repository was outside the
rule, and quoting one property name was a complete bypass in TypeScript too.

A quoted name is also allowed shapes a bare identifier cannot have: it may begin
with a digit and it may contain spaces (up to four space-separated components,
so that it describes a property name rather than a sentence of prose sitting in
front of a colon). Binding the quoted form to the identifier charset meant a JSON
key such as `2fa_secret` produced **zero** matches while `secret` was caught —
one digit at the front of a key was a complete bypass, and `2fa`, `oauth2` and
`x509` names are exactly where a leading digit occurs.

### How a name is judged

The name is split into words on `_`, `-`, `.`, `$`, spaces, camelCase boundaries
— including the boundary inside an acronym run, so `APIToken`, `JWTSecret` and
`DBPassword` split the same way `apiToken` does — and **letter/digit
boundaries**, so `PASSWORD1` splits to `password` + `1`. Without that last
boundary a single digit adjacent to the word fused into it and switched the rule
off for the line: `PASSWORD` was caught and `PASSWORD1` was not, `API_KEY_2` was
caught and `API_KEY2` was not. Writing `API_KEY1` beside `API_KEY2` is what a key
rotation looks like, so the gap sat on the spelling a credential acquires exactly
when it is being replaced. The boundary *splits* rather than strips digits, so
`monkey2` still yields `monkey`.

Each word is then **decomposed** into vocabulary terms if it splits *entirely*
into them, so `authtoken` is read as `auth` + `token`. Without this, coverage
depended on whether the author reached for a separator: `apiToken`, `API_TOKEN`
and `auth_token` were caught while `apitoken`, `authtoken`, `accesstoken`,
`secretkey` and `privatekey` were all missed. That is a property of house style,
not of risk — and it is not hypothetical, because ngrok's configuration file
spells the key `authtoken`, so a committed `ngrok.yml` was invisible end to end.

This is **not** substring matching. A word is decomposed only if nothing is left
over, so `tokenizer` (leaves `izer`), `monkey` (leaves `mon`), `keyboard` (leaves
`board`), `bypass` and `passthrough` all stay opaque and are compared whole.

A name is sensitive when:

- any term is `secret`, `token`, `password`, `passwd`, `pwd`, `pass`,
  `passphrase`, `credential`, `cred` or `dsn` (plurals included); or
- any term is `key` **and** another term qualifies it as a credential rather
  than a lookup key: `api`, `private`, `signing`, `sign`, `encryption`,
  `encrypt`, `access`, `auth`, `service`, `role`, `master`, `session`,
  `refresh`, `bearer`, `webhook`, `publishable`, `ssh`, `deploy`, `host`.

`apikey` used to be listed as an unconditionally sensitive word and no longer is.
Its presence was the evidence that the list was being patched by example rather
than by rule — `APIKEY` was caught only because someone had written that one
fused spelling down by hand, while the identical shape in `apitoken` and
`secretkey` was missed. It is now reached by decomposition, like every other
compound.

`API_KEY`, `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `sshKey`,
`DEPLOY_KEY` and `SENTRY_DSN` are all matched. Name length is not bounded: a
sensitive word counts wherever it appears, including at the start of a very long
identifier.

`key` deliberately does **not** count on its own. React's `key` prop,
`idempotencyKey` and `PENDING_DISPATCH_STORAGE_KEY` are ordinary identifiers,
and a rule that flagged every one of them would be muted rather than obeyed.

### One vocabulary, two thresholds

The scanner used to carry **two word lists that disagreed**. The list above
judged quoted and unquoted assignments, while the `.env` rule carried a separate
regex alternation that already treated `AUTH`, `DSN`, `SALT`, `PRIVATE`,
`ACCESS`, `REFRESH` and `SK` as sensitive. A word added to close a gap therefore
closed it in one rule and left it open in the other, which is why `SENTRY_DSN`
was caught in a `.env` file and missed in a TypeScript file for the same value.

Both rules now read one vocabulary, so there is one place to add a word. They
still apply **different thresholds** to it, and that difference is now deliberate
rather than accidental: in a `.env` file every name names a configuration value,
so a bare `KEY`, `AUTH`, `SESSION`, `PRIVATE`, `SALT` or `SK` is almost certainly
a credential; in source code `key`, `access` and `session` are ordinary words,
and flagging every one of them is how a rule gets muted. The `.env` rule also
matches the unambiguous terms as substrings rather than whole words, which is
what it always did — `MYSECRETVALUE` is caught there and would not be in source.

### Values that are skipped

Three shapes are skipped because they are not credentials at all: a value
containing `${`, which is interpolated at runtime rather than committed; an
unquoted value that is program syntax rather than data — `body.callbackToken,`
is a property being passed along, not a secret being written down; and a
dependency specifier such as `^3.0.0 || ^4.0.0`.

The dependency-specifier exemption applies **only inside a dependency manifest or
lockfile** (`package.json`, `package-lock.json`, `yarn.lock`, `Cargo.toml`,
`go.mod`, `requirements.txt` and the like). It exists because reading quoted names
brought lockfiles into scope, where the property name is a *package* name:
`"js-tokens"` splits to a sensitive word while its value is a version range. That
justification is true in a lockfile and false everywhere else, and applying it to
the value in *every* file was a regression that made three credential shapes the
scanner had previously caught invisible: an API token whose value was an opaque
string prefixed with `1-`, the same string prefixed with a semantic version and a
hyphen, and a twenty-digit all-numeric token. (Described rather than spelled out,
for the reason given further down: an assignment written literally here is flagged
by the very rule it illustrates.)

The prerelease tail accepted any twenty characters, and a bare integer counted as
a version. Both are now tight: the numeric core requires at least one dot, and
the tail must be dot-separated identifiers that are each numeric or short and
lowercase — `-beta.1` and `-canary.20260729` pass, an opaque token does not.

Stated plainly: inside a manifest, a value that genuinely parses as a set of
dotted numeric versions is still exempt under any name. A credential of that shape
*and* at least sixteen characters long does not occur in practice, and the pragma
below clears it if one ever does.

### The header exemption is decided on the value

`DEV_HQ_INTERNAL_TOKEN_HEADER` holds `x-dev-hq-internal-token`: the wire name of
the header a token travels in, not the token. So a name mentioning `header` is
exempt — but only when its value is genuinely the wire name of **that** header:
lowercase, hyphen-separated, no segment long or opaque enough to carry entropy,
**and every meaningful segment of the value is a word of the name itself**.

The name alone is never enough, and this is not a hypothetical distinction. When
the exemption was decided on the name — and decided before the sensitive words
were consulted — `SECRET_HEADER`, `API_KEY_HEADER` and `AUTH_HEADER_PASSWORD`
were all exempt no matter what they held. Appending one word to any identifier
switched the entire generic rule off for that line. A word that makes something
a credential must not be cancellable by a word sitting next to it.

Shape alone was not enough either. A constant named `SECRET_HEADER` holding
`correct-horse-battery-staple` is lowercase, hyphen-separated and free of long
or hex-like segments, so it satisfied every shape test — while being a strong
passphrase rather than a header. Requiring the value's words to come from the
name closes that: a constant naming a header is named after the header it holds.

Two consequences worth stating plainly. A value made *entirely* of words already
in its own identifier still passes; such a value has no secrecy left, because
the name discloses it. And a short property name that does not spell its header
out — a `tokenHeader` property holding `x-dev-hq-internal-token` — **will** be
flagged. That is a false positive, and the pragma below is how to clear it; the
rule is not pre-weakened for a shape this repository does not currently use.

(Both examples in this section are written as prose rather than as assignments
on purpose. Spelled out literally they are flagged by the very rule they
describe — this document is scanned like every other tracked file.)

The generic rule judges the **value**, not the file. Test files are scanned like
everything else, because a real staging password pasted into a spec file is a
real leak. A value is exempt only if it announces itself as a fixture — a
`test-`, `fake_`, `example.`, `mock-` or similar prefix **and** a shape that
looks synthetic: lowercase, no unusual symbols, no long opaque segment, no
hex-like blob. `test-internal-token` is exempt; `test-account-Xy9$kL2mQp` is not.

### How this scanner is known to work

A green scan proves nothing on its own: "no credentials found" is exactly what a
scanner that matches nothing also prints. This job ran for two rounds with no
acceptance evidence of any kind — checkout and the scanner, nothing else — and
was bypassed in both of them.

The `Verify the credential scanner detects known-bad inputs` step is the fix. It
runs before the real scan and:

- lifts the scanner **out of the workflow file with PyYAML**, so the thing under
  test is the thing CI runs rather than a copy that can drift;
- writes known-bad inputs into a throwaway Git repository **at run time**. They
  are never committed, because committing them would mean either a permanently
  red scan or an excluded directory — and a scanner with an excluded directory
  has a published bypass;
- asserts the exact `path -> label` mapping, not a count, so the wrong rule
  firing twice cannot stand in for the right one firing once;
- includes a **null arm**: known-good inputs in the same tree that must produce
  no finding, and a second tree of only known-good inputs on which the scanner
  must exit 0. Without it, a scanner mutated to flag everything passes;
- exits **2**, distinctly from a violation, when it cannot evaluate — for
  instance if the scanner step is renamed and can no longer be located.

The known-bad set covers every historical bypass found in this scanner: the
`_HEADER` escape, `key` reachable only when qualified, the acronym run, quoted
property names, the digit fused to the sensitive word, run-together words, quoted
names outside identifier shape, the two divergent word lists, and the
version-range regression. Re-introducing any one of them turns the step red. When
you change the scanner, the obligation is not to make this step pass — it is to
add the input that would have caught the defect you are fixing.

**One claim per fixture file, and this is not tidiness.** The scanner reports one
`Generic secret assignment` finding per file however many lines matched, so a
fixture holding five sensitive names is satisfied by whichever name still works
and the other four are asserted by nothing. Round four was first written that way,
and two separate mutations of the fix passed the control before the fixtures were
split — removing `ssh`, `deploy` and `host` from the vocabulary left `sshKey`,
`DEPLOY_KEY` and `hostKey` undetected while `passphrase` in the same file kept it
red. The control asserted an exact `path -> label` mapping the whole time and
still measured nothing, because the *fixture* was the coarse thing. Every term
added to the vocabulary has its own file; a term that could not be given one was
not added.

Two arms are needed for the version-range exemption specifically, because either
one alone leaves half of it untested. `bad/value/genuine-range.ts` and
`good/package-lock.json` hold the **identical** value and differ only in the file
they sit in, which pins the exemption to the file kind. `bad/manifest/*/package.json`
holds an opaque secret *inside* a manifest, which is the only place the tightened
version pattern is load-bearing — the first pair stays red on file kind alone and
cannot notice the pattern being loosened.

See `standards/CONTROL_VERIFICATION_STANDARD.md` for why this is required of
anything whose job is to fail.

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