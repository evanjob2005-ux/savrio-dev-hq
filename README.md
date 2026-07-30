# Dev HQ

**Version:** 1.0.0

**Project:** Savrio Engineering Operating System

---

# Overview

Dev HQ is the centralized engineering operating system for the Savrio platform.

It defines the standards, governance, workflows, documentation, AI agent responsibilities, and engineering practices used to design, build, test, review, deploy, and maintain every Savrio product.

Dev HQ serves as the single source of truth for both human engineers and AI engineering agents.

---

# Mission

Build world-class software through disciplined engineering, reusable processes, and specialized AI collaboration.

Every contribution should improve:

- Quality
- Reliability
- Security
- Performance
- Maintainability
- Developer Experience
- User Experience

---

# Core Principles

Development should always prioritize:

- User value
- Simplicity
- Engineering excellence
- Long-term maintainability
- Security by default
- Automation where practical
- Continuous improvement

---

# Repository Structure

Every path below exists. This tree is a description of the repository, not a
plan for it — if a directory is named here and `ls` disagrees, the tree is the
defect.

```
savrio-dev-hq/

├── AGENTS.md
├── README.md
├── CONTRIBUTING.md
├── ONBOARDING_GUIDE.md
├── SECURITY.md
├── RELEASE_PROCESS.md
├── VERSIONING_POLICY.md

Governance and process
├── docs/
│   ├── company/          Constitution, core values, governance, organization
│   ├── governance/       Operating handbook, progress update, authority register
│   ├── decisions/        Architecture Decision Records
│   ├── workflows/        Standard operating procedures
│   ├── plans/            Sprint plans, obligations register, review handoffs
│   ├── roadmap/          Registered Master Roadmap
│   ├── research/         Research backlog
│   └── validation/       Dated validation evidence
├── standards/            Engineering standards
├── handbooks/            Role-specific operating manuals
├── employees/            Active/supporting role documents, by department
├── agents/               Executable AI agent definitions and their outputs
├── templates/            Reusable engineering templates

Application
├── app/                  Next.js App Router pages and API route handlers
├── components/           React components
├── lib/                  Service layer, repositories, and Dev HQ domain logic
├── types/                Shared contracts and type definitions
├── trigger/              Trigger.dev task definitions
├── data/                 Mock and placeholder data
├── public/               Static assets

Verification
├── e2e/                  Playwright end-to-end specs
├── test/                 Test setup and shared fixtures
├── scripts/              Roadmap conversion and control-verification scripts
├── .semgrep/             Semgrep rules and their fixtures
└── .github/              Workflows, issue and PR templates, CODEOWNERS
```

There is no `constitution/` directory. **The Company Constitution that
`AGENTS.md` requires as startup step 2 is at
`docs/company/COMPANY_CONSTITUTION.md`.**

---

# Directory Guide

## docs/company/

The organization's foundational documents.

Contains:

- `COMPANY_CONSTITUTION.md` — the Constitution (CONST-001)
- `CORE_VALUES.md`
- `GOVERNANCE.md` — organizational structure and decision authority (GOV-001)
- `ORGANIZATION.md` — roles and departments (ORG-001)

---

## docs/governance/

Live governance records.

Contains:

- Permanent Operating Handbook (POH-001)
- Current Progress Update (CPU-001)
- Authority and Contradiction Register (ACR-001)
- Governance Baseline Review Packet

---

## docs/decisions/

Architecture Decision Records.

Every significant engineering decision is recorded as an ADR.

---

## docs/workflows/

Standard operating procedures.

Examples:

- Feature Development
- Bug Fix
- Release
- Architecture Review
- Hotfix
- Incident Response
- Dependency Update

---

## docs/plans/

Sprint plans, entry packages, decision records, and the Open Obligations
Register (`OPEN_OBLIGATIONS.md`) — known work that is accepted and not yet done.

---

## docs/roadmap/

The registered Master Roadmap, together with the registration record that
records its provenance.

The roadmap states approved direction. It is not evidence that a capability has
been implemented.

---

## handbooks/

Role-specific operating manuals.

Present today:

- AI Agent Orchestrator
- AI/LLM Engineer
- Architecture Reviewer
- Associate Software Engineer
- Database Architect
- Data Engineer
- Design Engineer
- DevOps Engineer
- Growth Engineer
- Independent Code Reviewer
- Lead Software Engineer
- Observability Engineer
- Product Owner
- Prompt Engineering Specialist
- QA Engineer
- Reliability Engineer
- Research Analyst
- Security Engineer
- UI Prototyping Engineer

All 19 `agents/*/AGENT.md` handbook references resolve. A focused structural
audit checks that inventory; it does not replace substantive governance review.

---

## employees/

Active/supporting role documents, organized by department: database, design,
engineering, operations, product, quality, reliability, research, security.

---

## agents/

Executable AI agent definitions, one directory per role, each holding an
`AGENT.md` and any review outputs that role has produced.

Each `AGENT.md` contains:

- Purpose
- Responsibilities
- Boundaries
- Inputs
- Outputs
- Required standards

---

## templates/

Reusable engineering templates.

Examples:

- Technical Plan
- Architecture Decision Record
- Code Review Report
- QA Report
- Security Review
- Incident Report
- Post Mortem

---

## standards/

Engineering standards governing all implementations.

Examples:

- React
- TypeScript
- API
- Database
- Testing
- Security
- Performance
- AI Engineering
- Control Verification

---

## app/, components/, lib/, types/, trigger/

The application itself.

- `app/` — Next.js App Router pages and `/api/dev-hq/*` route handlers
- `components/` — React components, including the Mission Control panels
- `lib/` — service layer, repositories, and Dev HQ domain logic
- `types/` — shared contracts and type definitions
- `trigger/` — Trigger.dev task definitions

---

## e2e/, test/

`e2e/` holds the Playwright specs. `test/` holds test setup and shared
fixtures. Unit tests live beside the code they cover, as `*.test.ts(x)`.

---

## scripts/

Verification and conversion scripts.

Contains:

- `roadmap-conversion/` — roadmap conversion, fidelity, and registered-hash checks
- `verify-workflow-structure.py` and its negative-control harness

---

## .semgrep/

Semgrep rules enforcing the Dev HQ boundaries, together with the fixtures that
prove each rule fires and does not over-fire.

---

## .github/

GitHub automation.

Contains:

- Workflows (`ci`, `lint`, `frontend-tests`, `security`, `dependencies`, `pr`, `release`)
- Issue Templates
- Pull Request Template
- CODEOWNERS

---

# Engineering Workflow

A typical feature follows this lifecycle:

```
Idea

↓

Planning

↓

Architecture

↓

Implementation

↓

Code Review

↓

Testing

↓

Security Review

↓

Deployment

↓

Monitoring

↓

Continuous Improvement
```

---

# AI Agent Workflow

Engineering work is coordinated by the AI Agent Orchestrator.

Typical flow:

```
Task

↓

Orchestrator

↓

Specialized Engineering Agent

↓

Reviewer

↓

QA

↓

Security

↓

Merge

↓

Deploy
```

---

# Engineering Standards

All contributors must follow the engineering standards located in:

```
standards/
```

Standards define expectations for:

- Architecture
- APIs
- Databases
- Security
- Performance
- Accessibility
- AI Engineering
- Documentation
- Git

---

# Documentation Policy

Documentation is considered production code.

Every engineering change should include documentation updates whenever appropriate.

---

# AI Collaboration

AI agents should:

- Follow their assigned handbook
- Follow repository standards
- Operate within defined responsibilities
- Produce production-ready work
- Request clarification when requirements are incomplete

---

# Contributing

Before submitting changes:

- Follow engineering standards
- Pass all automated checks
- Update documentation
- Complete required reviews

See:

```
CONTRIBUTING.md
```

---

# Security

Security issues should follow the procedures defined in:

```
SECURITY.md
```

---

# Versioning

Versioning follows the repository Versioning Policy.

---

# License

Internal project documentation for the Savrio Engineering Operating System.
