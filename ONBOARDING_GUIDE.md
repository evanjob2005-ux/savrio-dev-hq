# Onboarding Guide

**Version:** 1.0.0

**Project:** Savrio Engineering Operating System

---

# Welcome

Welcome to the Savrio Engineering Organization.

This guide helps both human engineers and AI agents become productive quickly while maintaining the engineering standards established throughout the Dev HQ repository.

Every contributor should understand not only how the software is built, but also why the engineering organization operates the way it does.

---

# Mission

Our mission is simple:

> Build premium software through disciplined engineering, thoughtful design, continuous learning, and specialized AI collaboration.

Every contribution should make Savrio:

- Easier to maintain
- More secure
- More reliable
- Faster
- More enjoyable to use

---

# Repository Overview

The Dev HQ repository contains the operating system for Savrio engineering.

Primary sections include:

```
AGENTS.md
README.md
CONTRIBUTING.md
SECURITY.md

docs/company/        Constitution, core values, governance, organization
docs/governance/     Operating handbook, progress update, authority register
docs/decisions/      Architecture Decision Records
docs/workflows/      Standard operating procedures
docs/plans/          Sprint plans and the Open Obligations Register
docs/roadmap/        The registered Master Roadmap
standards/           Engineering standards
handbooks/           Role-specific operating manuals
employees/           Employee role definitions, by department
agents/              Executable AI agent definitions
templates/           Reusable engineering templates

app/                 Next.js pages and API route handlers
components/          React components
lib/                 Service layer and Dev HQ domain logic
types/               Shared contracts
trigger/             Trigger.dev task definitions

e2e/                 Playwright end-to-end specs
test/                Test setup and fixtures
scripts/             Verification and conversion scripts
.semgrep/            Semgrep rules and fixtures
.github/             Workflows, templates, CODEOWNERS
```

Every path above exists. There is no `constitution/`, `governance/`,
`workflows/`, `playbooks/`, `checklists/`, `runbooks/`, `adr/`, `metrics/`,
`automation/`, or `.vscode/` directory at the repository root — earlier versions
of this guide listed all ten, and none of them was ever created.

---

# First-Day Checklist

Every contributor should complete the following:

- Read the README
- Read the Constitution — `docs/company/COMPANY_CONSTITUTION.md`
- Review the Core Values — `docs/company/CORE_VALUES.md`
- Read `AGENTS.md`, the universal AI employee handbook
- Read CONTRIBUTING.md
- Read SECURITY.md
- Review the Engineering Standards — `standards/`
- Review your assigned Handbook — `handbooks/`
- Review your assigned Workflow — `docs/workflows/`
- Configure your development environment
- Verify the project builds successfully

---

# Development Environment

Recommended tools:

- Visual Studio Code
- Git
- Node.js (LTS)
- npm or pnpm
- GitHub Desktop (optional)
- Supabase CLI
- Vercel CLI

Install project dependencies before beginning work.

---

# Repository Structure

Become familiar with the purpose of each directory.

Examples:

**agents/**
- Executable AI agent definitions

**handbooks/**
- Role-specific guidance

**standards/**
- Engineering requirements

**docs/workflows/**
- Standard operating procedures, including hotfix and incident response

**docs/decisions/**
- Architecture Decision Records

**docs/plans/**
- Sprint plans, and `OPEN_OBLIGATIONS.md` — accepted work not yet done

---

# Engineering Standards

Every contributor is expected to follow the standards located in:

```
standards/
```

These standards define expectations for:

- Architecture
- React
- TypeScript
- Next.js
- Tailwind
- APIs
- Databases
- Testing
- Security
- Accessibility
- Performance
- AI Engineering
- Git

---

# AI Agent Collaboration

Savrio is designed for AI-assisted software development.

AI agents should:

- Operate only within assigned responsibilities
- Follow engineering standards
- Explain significant architectural decisions
- Avoid modifying unrelated systems
- Escalate unclear requirements

Human engineers remain responsible for final approval.

---

# Development Workflow

Typical workflow:

```
Planning

↓

Architecture

↓

Implementation

↓

Testing

↓

Review

↓

Deployment

↓

Monitoring

↓

Continuous Improvement
```

---

# Branching Strategy

Never work directly on the main branch.

Use descriptive branch names.

Examples:

```
feature/pantry-search

feature/meal-planner

bugfix/login-loop

refactor/api-client

docs/update-readme
```

---

# Code Reviews

Every significant change should receive review.

Reviews should focus on:

- Correctness
- Readability
- Security
- Performance
- Maintainability
- User experience

Constructive feedback improves the entire engineering organization.

---

# Documentation

Documentation is considered part of the product.

Update documentation whenever changes affect:

- Features
- APIs
- Architecture
- Infrastructure
- Deployment
- User behavior

---

# Security

Security is everyone's responsibility.

Never commit:

- API keys
- Passwords
- Tokens
- Private certificates
- Environment secrets

Follow the procedures outlined in:

```
SECURITY.md
```

---

# Continuous Learning

Engineering practices evolve continuously.

Contributors are encouraged to:

- Improve documentation
- Suggest workflow improvements
- Refine standards
- Identify automation opportunities
- Record architectural decisions through ADRs

---

# Definition of Success

A successful contributor consistently produces work that is:

- Correct
- Maintainable
- Secure
- Well documented
- Thoroughly tested
- Easy for future contributors to understand

---

# Getting Help

When uncertain:

1. Read the documentation.
2. Review the relevant standard.
3. Review the applicable workflow.
4. Consult the assigned handbook.
5. Ask questions before making assumptions.

Clear communication prevents unnecessary rework.

---

# Welcome to the Team

Whether you are a human engineer or an AI agent, your objective is the same:

Build software that users trust, engineers enjoy maintaining, and future contributors can confidently improve.

Engineering excellence is a continuous journey, and every contribution should move the project forward.