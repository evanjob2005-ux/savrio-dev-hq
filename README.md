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

```
DevHQ/

├── AGENTS.md
├── README.md
├── CONTRIBUTING.md
├── SECURITY.md
├── BOOTSTRAP.md

├── constitution/
├── governance/
├── handbooks/
├── agents/
├── workflows/
├── templates/
├── standards/
├── playbooks/
├── checklists/
├── runbooks/
├── adr/
├── metrics/
├── automation/
├── scripts/
├── .github/
└── .vscode/
```

---

# Directory Guide

## constitution/

Defines the organization's foundational principles.

Contains:

- Constitution
- Core Values

---

## governance/

Defines organizational structure and decision making.

Contains:

- Governance
- Organization
- Decision authority

---

## handbooks/

Role-specific operating manuals.

Examples:

- Lead Software Engineer
- QA Engineer
- Security Engineer
- DevOps Engineer
- AI Engineer

---

## agents/

Executable AI agent definitions.

Each agent contains:

- Purpose
- Responsibilities
- Boundaries
- Inputs
- Outputs
- Required standards

---

## workflows/

Standard operating procedures.

Examples:

- Feature Development
- Bug Fix
- Release
- Architecture Review

---

## templates/

Reusable engineering templates.

Examples:

- Technical Design
- Sprint Planning
- Code Review
- Incident Report

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

---

## playbooks/

Mission-specific AI execution guides.

These define step-by-step procedures for common engineering tasks.

---

## checklists/

Production readiness verification.

Examples:

- API Checklist
- Frontend Checklist
- Deployment Checklist

---

## runbooks/

Incident response documentation.

Examples:

- API outage
- Database failure
- Rollback
- Disaster recovery

---

## adr/

Architecture Decision Records.

Every significant engineering decision should be documented using an ADR.

---

## metrics/

Engineering measurement standards.

Examples:

- Quality
- Reliability
- AI Performance
- DORA Metrics

---

## automation/

Repository automation documentation.

Examples:

- Labels
- Branch Protection
- Dependabot
- PR Automation

---

## scripts/

Developer setup and bootstrap scripts.

---

## .github/

GitHub automation.

Contains:

- Issue Templates
- Pull Request Templates
- GitHub Actions

---

## .vscode/

Recommended workspace configuration.

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
