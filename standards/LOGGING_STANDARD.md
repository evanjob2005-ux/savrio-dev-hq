# Logging Standard

**Document ID:** STANDARD-020  
**Version:** 1.0.0  
**Applies To:** All Dev HQ software and automation

## Purpose

Logs provide actionable, trustworthy operational evidence without exposing protected data.

## Requirements

- Emit structured, machine-searchable records with timestamp, severity, component, event, and a correlation identifier when one exists.
- Log state transitions and operational failures at the boundary that owns them; avoid duplicate layers reporting the same event as separate incidents.
- Use stable event names and fields. Messages must say what failed and identify the affected operation without claiming a result that was not measured.
- Preserve causal errors and useful non-sensitive context. Distinguish policy failure from inability to evaluate.
- Never log passwords, tokens, API keys, cookies, authorization headers, raw personal data, or secret-bearing request bodies.
- Do not use logs as the authoritative business-state store, and do not make correctness depend on log delivery.
- Apply appropriate severity: debug for diagnostic detail, info for expected lifecycle facts, warning for degraded but completed behavior, and error for failed operations requiring attention.
- Test security-sensitive redaction and important failure events.

Follow `OBSERVABILITY_STANDARD.md`, `SECURITY_STANDARD.md`, and `ERROR_HANDLING_STANDARD.md`; escalate conflicts.
