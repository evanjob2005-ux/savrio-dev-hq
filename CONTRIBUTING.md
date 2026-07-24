# Contributing Guide

**Version:** 1.0.0

**Project:** Savrio Engineering Operating System

---

# Purpose

This document defines how engineers and AI agents contribute to the Savrio codebase.

Every contribution should improve the quality, maintainability, reliability, and long-term health of the project.

---

# Engineering Philosophy

Every contribution should:

- Solve a real problem
- Improve the codebase
- Follow engineering standards
- Be production ready
- Be understandable by future contributors

Contributors should always leave the codebase in a better state than they found it.

---

# Before You Begin

Before starting work:

- Read the project README
- Review the relevant engineering standards
- Review the applicable workflow
- Understand the feature requirements
- Confirm ownership of the task

Do not begin implementation without understanding the intended outcome.

---

# Repository Standards

All work must comply with the standards contained in:

```
standards/
```

Including but not limited to:

- Next.js
- React
- TypeScript
- Tailwind
- API
- Database
- Security
- Testing
- Performance
- Documentation
- Git

---

# Branch Strategy

Never develop directly on `main`.

Create a descriptive branch.

Examples:

```
feature/user-profile

feature/ai-recipe-generator

bugfix/login-timeout

refactor/api-client

docs/readme-update
```

---

# Commit Guidelines

Commits should be:

- Small
- Focused
- Atomic
- Descriptive

Good examples:

```
Add pantry search filters

Fix authentication redirect

Improve AI prompt validation

Update deployment documentation
```

Avoid vague commits such as:

```
update

fix

misc

stuff
```

---

# Pull Requests

Every pull request should include:

- Purpose
- Summary
- Scope
- Testing completed
- Documentation updates
- Related issue references

Large pull requests should be divided whenever practical.

---

# Code Quality Expectations

Every contribution should:

- Compile successfully
- Pass linting
- Pass TypeScript checks
- Pass automated tests
- Follow formatting standards
- Include appropriate error handling

---

# Documentation

Update documentation whenever changes affect:

- APIs
- Architecture
- Configuration
- User behavior
- Deployment
- Operations

Documentation is required for production-ready changes.

---

# Testing

Before requesting review verify:

- Build succeeds
- Lint passes
- Tests pass
- New functionality works
- Existing functionality remains unaffected

Regression testing is expected for significant changes.

---

# Code Review

Every contribution should be reviewed for:

- Correctness
- Readability
- Security
- Performance
- Maintainability
- Standards compliance

Requested changes should be addressed before merge.

---

# AI Agent Contributions

AI agents should:

- Read their assigned handbook
- Follow repository workflows
- Respect engineering standards
- Avoid modifying unrelated files
- Explain significant architectural decisions

AI-generated code must meet the same quality standards as human-written code.

---

# Security

Never commit:

- API keys
- Passwords
- Secrets
- Tokens
- Environment files containing credentials

Report security concerns according to:

```
SECURITY.md
```

---

# Merge Requirements

Before merge verify:

- CI passes
- Documentation updated
- Reviews approved
- No unresolved comments
- Standards followed

Only production-ready code should be merged.

---

# Professional Conduct

All contributors should:

- Be respectful
- Provide constructive feedback
- Explain technical reasoning
- Welcome improvements
- Prioritize project success over personal preference

---

# Continuous Improvement

Engineering practices should evolve as the project grows.

When a recurring problem is identified:

- Improve the process
- Improve the documentation
- Improve the tooling
- Update the standards

The engineering system should continuously improve alongside the product.

---

# Questions

If implementation requirements are unclear:

- Ask for clarification
- Avoid assumptions
- Document significant decisions

Clear communication prevents costly mistakes.

---

# Definition of Done

A contribution is complete when:

- Requirements satisfied
- Standards followed
- Tests passing
- Documentation updated
- Review approved
- Ready for production

---

# Compliance

All human contributors and AI agents must follow this guide.

Consistency, quality, and long-term maintainability take precedence over speed.