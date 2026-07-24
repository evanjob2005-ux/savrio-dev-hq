# Git Engineering Standard

**Document ID:** STANDARD-017

**Version:** 1.0.0

**Applies To:** All Engineering Agents

---

# Purpose

This standard defines the required Git workflow, branching strategy, commit conventions, and repository management practices for all engineering work within the Savrio ecosystem.

Every change to the codebase must be traceable, reviewable, reproducible, and reversible.

---

# Guiding Principles

Every Git workflow must be:

- Consistent
- Traceable
- Reviewable
- Atomic
- Reproducible
- Collaborative
- Secure
- Production Ready

---

# Git Philosophy

Git is the single source of truth for the project history.

Every commit should represent a meaningful, complete, and understandable unit of work.

---

# Branch Strategy

Protected branches:

- `main`
- `develop`

Feature development should occur on dedicated branches.

Examples:

```
feature/authentication
feature/recipe-search
feature/ai-meal-planner
bugfix/login-timeout
hotfix/payment-error
docs/api-standard
refactor/user-service
```

Branch names should be descriptive and concise.

---

# Commit Philosophy

Each commit should:

- Represent one logical change
- Build successfully
- Pass validation
- Be independently understandable

Avoid mixing unrelated changes.

---

# Commit Messages

Use clear, imperative commit messages.

Examples:

```
Add recipe search filters
Fix authentication redirect
Refactor AI prompt manager
Update API documentation
Improve database indexing
```

Avoid vague messages such as:

```
fix
update
stuff
changes
misc
```

---

# Atomic Commits

Prefer:

- Small commits
- Focused commits
- Independent commits

Each commit should be easy to review and revert.

---

# Pull Requests

Every pull request should include:

- Summary
- Motivation
- Scope
- Testing performed
- Related issues
- Screenshots when applicable

Pull requests should remain focused on a single objective.

---

# Merge Strategy

Preferred merge method:

- Squash Merge

Alternative methods may be used when preserving detailed history is beneficial.

Avoid unnecessary merge commits.

---

# Conflict Resolution

Resolve conflicts by:

- Understanding both changes
- Preserving intended behavior
- Re-running tests
- Requesting review when uncertain

Never resolve conflicts without verifying correctness.

---

# Repository Hygiene

Keep the repository clean by:

- Removing dead code
- Deleting merged branches
- Avoiding generated files
- Excluding secrets
- Maintaining consistent formatting

Repository cleanliness improves long-term maintainability.

---

# Binary Files

Avoid committing large binary files unless necessary.

Prefer external storage for:

- Large datasets
- Build artifacts
- Generated assets

Version control should prioritize source files.

---

# Git Ignore

Sensitive or generated files should be excluded using `.gitignore`.

Examples include:

- Dependencies
- Build output
- Environment files
- Temporary files
- IDE configuration (where appropriate)

Never commit secrets.

---

# Tags

Use annotated tags for production releases.

Example:

```
v1.0.0
v1.1.0
v2.0.0
```

Tags should correspond to documented releases.

---

# Release Management

Each release should include:

- Version number
- Release notes
- Changelog
- Deployment record

Release history should remain auditable.

---

# Code Review Integration

No code should merge without:

- Passing CI
- Required approvals
- Addressing requested changes
- Meeting engineering standards

Git history should reflect reviewed work.

---

# Recovery

Git history should support:

- Rollback
- Cherry-picking
- Branch recovery
- Release restoration

Avoid force-pushing protected branches.

---

# Documentation

Document:

- Branch strategy
- Commit conventions
- Merge workflow
- Release process
- Versioning policy

Documentation should remain synchronized with engineering practices.

---

# Code Review Checklist

Verify:

- Branch naming
- Commit quality
- Commit message clarity
- Pull request completeness
- Merge readiness
- Repository cleanliness
- No secrets committed
- CI passing
- Documentation updated
- Standards compliance

---

# Definition of Done

A Git workflow is complete when:

- Changes committed atomically
- Branch strategy followed
- CI passes
- Pull request approved
- Documentation updated
- Repository remains clean
- Standards followed
- Ready for merge

---

# Compliance

All engineering agents must comply with this standard.

Git history should remain clean, understandable, and maintainable to support long-term collaboration and operational excellence.