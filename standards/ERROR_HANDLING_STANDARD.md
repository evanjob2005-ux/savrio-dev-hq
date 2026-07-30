# Error Handling Standard

**Document ID:** STANDARD-021  
**Version:** 1.0.0  
**Applies To:** All Dev HQ software and automation

## Purpose

Failures must be safe, diagnosable, and distinguishable from successful evaluation.

## Requirements

- Validate inputs at trust boundaries and reject invalid values before side effects.
- Fail closed for authorization, integrity, release, and security controls.
- Distinguish a domain or policy rejection from an unavailable dependency, malformed response, or control that could not evaluate.
- Preserve the original cause internally while returning stable, non-sensitive errors at public boundaries.
- Never expose stack traces, secrets, internal tokens, or protected record contents to untrusted callers.
- Do not swallow errors or convert failure into empty success. Recovery and fallback behavior must be explicit, bounded, observable, and tested.
- Make retryable failures distinguishable from permanent failures; retries must respect idempotency and must not overwrite newer state.
- Clean up partial resources where ownership is clear. Escalate ambiguous partial completion rather than inventing success.
- Test success, expected rejection, dependency failure, malformed input, retry/replay, and relevant partial-failure paths.

API-specific status and response rules remain governed by `API_STANDARD.md`; control exit semantics remain governed by `CONTROL_VERIFICATION_STANDARD.md`.
