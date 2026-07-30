# Architecture Decision Record

**Document ID:** ADR-0004  
**Authority:** CONST-001, AGENT-001, ADR-0001, ADR-0002, ADR-0003

## Decision

**Status:** Approved — partial subject coverage  
**Date:** 2026-07-29

The Founder authorized the remaining architecture decisions in
`docs/plans/OPEN_AT_HANDOFF.md` section 3 with “do these, all of them.” This
record captures only decisions that can be implemented without pretending that
unapproved external infrastructure exists.

This is not the complete deployment/persistence/transport/auth decision.
Persistence, production transport, and Founder authentication stay
open; this record must not be cited as authorization to begin production Track B.

1. The Dev HQ HTTP surface is controlled by
   `DEV_HQ_DEPLOYMENT_MODE=local`, not `NODE_ENV`. The default and every unknown
   value deny access. An optimized build may therefore be exercised locally
   without making an internet-reachable deployment open.
2. The event timeline is append-only. The 200 value is a maximum feed page,
   not a retention policy. This reaffirms ADR-0002's append-only requirement
   and corrects implementation drift; it does not supersede ADR-0002.
3. Durable authoritative state, multi-process coordination, and production
   founder identity remain blocked pending selection and provisioning of a
   persistence backend and authentication system. A process-global map, local
   file, browser-visible shared secret, or scheduler in the same process does
   not satisfy those properties and must not be represented as doing so.
4. Trigger.dev remains one recovery driver, but cannot be the sole production
   recovery authority. An independent driver may be enabled only together with
   a coordinated durable store; otherwise two processes can make conflicting
   recovery decisions.

## Consequences

- ARCH-07 and the `NODE_ENV` deployment conflation are closed in the
  development adapter.
- ARCH-10, ARCH-03, ARCH-06, SVC-05, and all of SVC-06
  remain explicit infrastructure blockers. Their acceptance criteria are not
  weakened.
- Removing audit truncation necessarily increases unbounded process memory.
  Event reads still copy and sort the retained history, making repeated polling
  O(n log n). ARCH-07's data-loss defect is closed, but this negative consequence
  keeps SVC-06 open.
- `DEV_HQ_DEPLOYMENT_MODE=local` is an operator assertion, not proof of network
  isolation. Production exposure remains forbidden until authenticated founder
  access and durable coordinated state exist.

## Verification

- Proxy tests cover unset/invalid default denial and an optimized local build.
- Internal callback tests cover deployment denial plus token denial/allow arms.
- Audit tests retain 205 distinct events and include an empty-store null arm.
- The full Vitest suite passed after the change.
