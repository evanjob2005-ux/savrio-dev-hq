# Versioning Policy

**Version:** 1.0.0

**Project:** Savrio Engineering Operating System

---

# Purpose

This document establishes the versioning strategy for all components of the Savrio ecosystem.

Consistent versioning makes changes easier to understand, review, test, deploy, and support.

---

# Scope

This policy applies to:

- Savrio Web Application
- Savrio Mobile Application
- Dev HQ
- AI Agents
- Engineering Standards
- Handbooks
- Workflows
- Templates
- Playbooks
- Checklists
- Runbooks
- Architecture Decision Records (ADRs)
- Supporting Documentation

---

# Semantic Versioning

Savrio follows Semantic Versioning (SemVer):

```
MAJOR.MINOR.PATCH
```

Example:

```
2.5.3
```

---

# Major Version

Increase the **MAJOR** version when introducing breaking changes.

Examples:

- Major architecture redesign
- Breaking API changes
- Database migrations requiring manual intervention
- Significant authentication redesign
- Large workflow changes

Example:

```
1.4.7

↓

2.0.0
```

---

# Minor Version

Increase the **MINOR** version when adding backward-compatible functionality.

Examples:

- New application features
- New AI capabilities
- Additional engineering standards
- New dashboards
- Expanded workflows

Example:

```
2.1.4

↓

2.2.0
```

---

# Patch Version

Increase the **PATCH** version for backward-compatible fixes.

Examples:

- Bug fixes
- Documentation improvements
- Typo corrections
- Performance optimizations
- Minor UI improvements

Example:

```
2.2.3

↓

2.2.4
```

---

# Dev HQ Versioning

The Dev HQ repository has its own independent version.

Major releases indicate significant improvements to the engineering operating system.

Example roadmap:

```
1.0.0

1.1.0

1.2.0

2.0.0
```

---

# AI Agent Versioning

Every AI agent maintains its own version.

Example:

```
Lead Software Engineer

v1.0.0

↓

v1.1.0
```

Increment versions when:

- Responsibilities change
- Capabilities expand
- Decision-making logic improves
- Prompt structure is updated

---

# Handbook Versioning

Handbooks should include a version number.

Update versions when:

- Procedures change
- Standards evolve
- Responsibilities are modified

---

# Engineering Standards

Each engineering standard should maintain its own version.

Examples:

```
React Standard

1.3.0

API Standard

2.0.0

Security Standard

1.5.1
```

---

# Workflows

Workflow documents should be versioned whenever execution steps change.

Minor revisions should not require major version increments unless the workflow becomes incompatible with previous guidance.

---

# Templates

Templates should receive version updates when:

- Structure changes
- Required sections change
- Best practices evolve

---

# Architecture Decision Records (ADRs)

Architecture Decision Records are immutable historical documents.

Do not modify the original decision after approval.

Instead:

- Create a new ADR
- Reference the previous ADR
- Explain why the decision changed

---

# Release Tags

Repository releases should use Git tags.

Examples:

```
v1.0.0

v1.1.0

v2.0.0
```

---

# Pre-release Versions

Development builds may use:

```
1.0.0-alpha.1

1.0.0-beta.1

1.0.0-rc.1
```

Where:

- alpha = early development
- beta = feature complete, testing
- rc = release candidate

---

# Documentation Versioning

Documentation should include a version when it defines long-term engineering processes.

Minor editorial updates may not require version changes.

---

# Changelog

Every release should include a changelog describing:

- Added
- Changed
- Deprecated
- Removed
- Fixed
- Security

Following the Keep a Changelog format is recommended.

---

# Version Ownership

Version changes should be intentional and documented.

Every version increment should correspond to meaningful changes.

---

# Compliance

All engineering teams and AI agents are expected to follow this versioning policy.

Consistent versioning improves collaboration, deployment safety, and long-term maintainability across the Savrio ecosystem.