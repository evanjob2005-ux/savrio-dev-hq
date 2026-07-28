# Specification — Savrio Context Lifecycle Manager (CLM)

**Document ID:** SPEC-CLM-001
**Template basis:** TMP-002 (technical plan), TMP-003 (ADR)
**Owner:** Lead Software Engineer (Claude Code)
**Authority:** CONST-001, AGENT-001, GOV-001, ADR-0001, ADR-0002
**Status:** Draft specification — **planning only, not approved, not implemented**
**Version:** 1.1.0 — reconciled against Sprint 1F, Mission Control UX, Phase 2, governance, and research
**Date:** 2026-07-26
**Repository baseline:** `savrio-dev-hq` @ `357f03b`, branch `validation/sprint-1e-overnight-2026-07-26`

**Reconciliation basis (v1.1.0).** This revision reconciles v1.0.0 against the following
documents, all present in the working tree at `357f03b` and all read at authoring time:

| Document | Path | Role in this reconciliation |
| --- | --- | --- |
| Sprint 1F plan | `docs/plans/SPRINT_1F_MISSION_CONTROL_LITE.md` | Consumer; interface I-5; questions Q-4/D-5; requirements D-G/D-H |
| Mission Control UX | `agents/claude-design/outputs/PHASE_1_MISSION_CONTROL_LITE_UX.md` | Consumer; View 12; data contract §12.6; handoff CX-1…CX-6; OQ-7; conflict C2 |
| Phase 2 program plan | `docs/plans/PHASE_2_PROGRAM_PLAN.md` | Downstream consumer; preconditions P-1/P-4/P-5; §0.4 model neutrality; stages 2A/2E/2I/2J |
| Research backlog | `docs/research/RESEARCH_BACKLOG.md` | Open research R-13 (context caching), R-18/R-19 (1H anchors) |
| Governance | `docs/company/GOVERNANCE.md`, `AGENTS.md` | Policy-ownership boundary; escalation content standard |
| Governance update plan | `docs/plans/GOVERNANCE_UPDATE_PLAN.md` | **Appeared mid-pass (v0.3.0).** Registers G-11, P-7, X-16, B-5; has already read and reconciled against this spec |

**Late arrival, recorded.** `GOVERNANCE_UPDATE_PLAN.md` v0.3.0 landed while this
reconciliation was in progress, and it had already read SPEC-CLM-001 v1.1.0. It **independently
converged** on the §4.8 threshold split (its **G-11**: *"the vocabulary is engineering, the
numbers are governance"*, which it calls *"the cleanest cross-workstream convergence in the
set"*) and created precondition **P-7** to carry governance-owned numerics, naming this spec's
`provisional: true` propagation as the general pattern. It also registered this spec's Phase 2
P-5 ↔ §3.3 contradiction as **X-16**. No change to §4.8 was required; §4.8 now has a
governance vehicle rather than only a recommendation.

**Sprint identities resolved.** v1.0.0 §14 was left unwritten because 1G/1H/1I were
undefined. Phase 2 precondition **P-5** now defines them: **1G = Smart Work Packets**,
**1H = Repository Intelligence + Context Router**, **1I = Autonomous Engineering Loop with
bounded static decomposition**. §14 is written accordingly and no longer contains inferred
scope.

---

# 0. Reader's Note — Status and Honesty Boundaries

This document is a **specification**, not an implementation and not an approved
decision. Nothing here has been built, tested, or measured. Every number in the
scoring tables is a **proposed default requiring calibration**, explicitly marked
as such; none is an empirical finding.

Three classes of statement appear and are labeled throughout:

| Label | Meaning |
| --- | --- |
| **NORMATIVE** | A requirement this spec fixes. Implementation must satisfy it. |
| **DEFAULT** | A proposed constant or threshold. Tunable; requires calibration before trust. |
| **ASSUMPTION** | Something this spec presumes about systems outside its scope. Requires confirmation. |

Open items requiring founder or cross-department decision are collected in §14.

**Verified repository facts used as anchors** (read at authoring time, `057e12c`):
`types/domain/agent-assignment.ts` (lease/ownership model), `types/domain/escalation.ts`
(reserve-before-create idempotency boundary), `types/domain/review.ts`,
`types/domain/evidence.ts`, `types/domain/event.ts`, `lib/dev-hq/constants.ts`
(retry/lease/review budgets and event vocabularies), `docs/decisions/ADR-0002-*`.
The CLM design deliberately reuses these idioms rather than inventing parallel ones.

---

# 1. Purpose, Scope, and Problem

## 1.1 Problem Statement

An AI employee working a Savrio task operates inside a bounded context window. As
work proceeds, that context degrades in ways that are *invisible from inside it*:
capacity is consumed, tool output accumulates as ballast, superseded content
lingers beside its replacement, and the working set drifts from the approved
objective. The failure mode is not a crash. It is an employee that continues to
act confidently on a context that no longer faithfully represents the work —
re-doing rejected approaches, re-expanding scope that was explicitly closed,
editing a branch that has moved beneath it, or reporting validation it inherited
rather than performed.

The second failure mode is the handoff itself. When a session ends and a successor
picks up, the transfer is today a narrative summary: lossy, unverifiable, and
silently permitting two sessions to believe they own the same work.

## 1.2 Purpose

The Context Lifecycle Manager is the subsystem that:

1. Measures the health of a working session's context from **observed signals only**.
2. Converts those measurements into a **deterministic** score and a **deterministic**
   lifecycle decision.
3. Executes that decision — continue, compact, checkpoint, split, switch, or roll over.
4. Produces **immutable checkpoints** and **continuation packets** that are complete
   enough to resume from and verifiable enough to trust.
5. Guarantees that a successor session cannot perform mutable work until it has
   **proved** it restored the right state, in the right repository, under the right
   authority.
6. Refuses to continue — loudly — when context is missing, contradictory, or
   unverifiable.

## 1.3 In Scope

Context health measurement; health scoring; the decision ladder; checkpoint
creation and integrity; continuation packet generation; compaction with relevance
preservation; duplicate and stale removal; restoration and its verification gates;
single-owner custody transfer; failure taxonomy and recovery; fallback to earlier
checkpoints; uncertain and blocked behavior; metrics and analytics; the state
machine governing all of it.

## 1.4 Out of Scope (NORMATIVE — negative scope for this spec)

- Any implementation, migration, or repository modification.
- Long-term semantic memory, embeddings, or retrieval ranking. The CLM preserves
  and prunes **known** content by declared relevance rules; it does not learn
  relevance.
- Model selection *quality* policy (which model is better at what). The CLM
  detects that a switch is *required*; the choice of target is delegated (§9.7).
- Prompt authoring, agent personality, or handbook content.
- Replacing the Work Management Layer's execution retry, review, or escalation
  loops. The CLM sits beside them and reuses them (§13).
- UI surfaces. Read-models are specified; panels are not.

---

# 2. Position in the Architecture

## 2.1 Layering (NORMATIVE)

```
  Founder / Governance authority
            │
  Work Management Layer  (Execution Manager, Review, Escalation — ADR-0001/0002)
            │  owns: what work exists, who is assigned, retry/review budgets
            │
  ┌─────────┴──────────────────────────────────────────────┐
  │  Context Lifecycle Manager (this spec)                   │
  │  owns: whether a session's context is fit to work in,    │
  │        and the safe transfer of work between sessions    │
  └─────────┬──────────────────────────────────────────────┘
            │
  Session runtime (a single agent working inside one context window)
```

**NORMATIVE — CLM-P1.** The CLM never decides *what work to do*. It decides
*whether the current context is fit to do it in*, and *how to move the work
safely* when it is not. Work content authority remains with the Work Management
Layer and the assigned role.

**NORMATIVE — CLM-P2.** The CLM is an observer plus a gate. It has exactly two
powers over the session: it may **withhold the mutation token** (§7.4), and it
may **initiate a lifecycle transition** (§6). It may not rewrite objectives,
alter task records, or approve work.

**NORMATIVE — CLM-P3 (Execution Manager purity).** The CLM contains no business
rules about task semantics. All CLM inputs are structural measurements or
externally supplied verified facts. This preserves the ADR-0001/0002 separation
that keeps orchestration free of domain logic.

## 2.2 Components

| Component | Responsibility | Purity |
| --- | --- | --- |
| `context-probe` | Collects a `ContextHealthSnapshot` from the session runtime and the environment | Impure (reads runtime, git, env) |
| `health-scorer` | `ContextHealthSnapshot → HealthScore` | **Pure, total, deterministic** |
| `decision-engine` | `(HealthScore, SessionFacts, Budgets) → LifecycleDecision` | **Pure, total, deterministic** |
| `checkpoint-writer` | Builds and seals immutable checkpoints | Impure; append-only |
| `packet-builder` | `Checkpoint → ContinuationPacket` | **Pure** given the checkpoint |
| `compactor` | Applies relevance-preserving reduction to a context | **Pure** transform over a labeled span set |
| `custody-manager` | Single-owner leases, rollover, successor reservation | Impure; atomic |
| `restoration-verifier` | Runs the restoration gate ladder; issues the mutation token | Impure (verifies real world) |
| `recovery-engine` | Failure classification, fallback selection, escalation | Impure |
| `clm-telemetry` | Events, evidence, metrics | Impure; append-only |

## 2.3 Determinism Boundary (NORMATIVE — CLM-P4)

`health-scorer`, `decision-engine`, `packet-builder`, and `compactor` are pure
functions. They:

- take no clock, no randomness, no network, no model call;
- receive time only as an explicit `snapshotAt` field and durations only as
  explicit deltas;
- use **integer arithmetic exclusively** (§4.2);
- are versioned (`scoringVersion`, `policyVersion`, `compactionVersion`) and are
  **replayable**: given an archived snapshot and a version, they must reproduce the
  archived output byte-for-byte.

Rationale: a decision to discard context must be auditable and reproducible. A
model-judged decision is neither. This mirrors ADR-0002's insistence on
deterministic reviewers and deterministic finding ids.

---

# 3. Deliverable 1 — Context-Health Inputs

## 3.1 Input Discipline (NORMATIVE — CLM-I1)

Every input is one of:

- **Measured** — counted from the actual context or environment.
- **Declared** — supplied by a system of record (Work Management Layer, git, provider API).
- **Derived** — computed by a pure function from measured/declared inputs.

**No input may be a model's self-assessment.** "How confused do I feel" is not an
input. Contradiction and drift are detected structurally (§3.4), not introspectively.

**NORMATIVE — CLM-I2.** If any required input cannot be obtained, the snapshot is
marked `degraded` with the specific missing field named. A degraded snapshot may
never produce a `CONTINUE` decision (§5.6).

## 3.2 The Span Model (foundation for measurement)

The session context is modeled as an ordered list of **spans**. A span is the unit
of measurement, retention, and pruning.

```ts
type SpanId = string;                    // deterministic: hash of (ordinal, kind, contentHash)

type SpanKind =
  | "objective"          // the approved goal, acceptance criteria, scope
  | "authority"          // governing docs, approvals, role grant, constraints
  | "decision"           // a decision made and its rationale
  | "negative_scope"     // explicitly excluded work
  | "rejected_approach"  // an approach tried or considered and rejected, with reason
  | "instruction"        // founder/reviewer direction
  | "artifact"           // produced content (code, doc text, diff)
  | "tool_result"        // raw output of a tool call
  | "observation"        // a read fact about the repo/world
  | "evidence"           // validation output, test results, review findings
  | "open_question"      // unresolved item requiring an answer
  | "narration";         // conversational filler, restatement, progress commentary

interface ContextSpan {
  id: SpanId;
  ordinal: number;                 // position in the context, 0-based, stable
  kind: SpanKind;
  tokens: number;                  // measured
  contentHash: string;             // sha256 of normalized content (§12.3)
  /** Spans this one supersedes. Non-empty ⇒ those spans are stale. */
  supersedes: SpanId[];
  /** Spans this one depends on for meaning. Pruning a referent invalidates this. */
  references: SpanId[];
  /** Structural, not semantic: set when two spans assert conflicting values for
   *  the same declared key (§3.4). */
  contradicts: SpanId[];
  /** True when the span is load-bearing for the objective (§8.2 relevance class). */
  relevanceClass: RelevanceClass;
  /** Turn index at which the span entered the context. */
  enteredAtTurn: number;
  /** Turn index of the most recent read/reference of this span. */
  lastReferencedTurn: number | null;
  /** True if the span records a mutation actually performed on the world. */
  isMutationRecord: boolean;
}
```

**ASSUMPTION — A-1.** The session runtime can enumerate spans with stable ordinals
and token counts. If the runtime cannot, the CLM degrades to coarse-grained
measurement (whole-message granularity), all thresholds shift, and compaction
quality drops materially. This is a hard dependency and is flagged in §14.

## 3.3 Input Group I — Capacity Signals (measured)

| Field | Type | Source | Notes |
| --- | --- | --- | --- |
| `contextLimitTokens` | int | provider | Hard window size for the active model |
| `tokensUsed` | int | runtime | Current occupancy |
| `tokensReservedForOutput` | int | policy | Space that must remain for the next response |
| `tokensReservedForSafety` | int | policy | Space reserved for checkpoint+packet emission (§7.2) |
| `projectedNextStepTokens` | int | derived | From the **declared cost table** (§3.8), never a guess |
| `turnIndex` | int | runtime | Monotonic |
| `spanCount` | int | derived | |

**NORMATIVE — CLM-I3 (the emission reserve).** `tokensReservedForSafety` must at
all times be sufficient to write a full checkpoint and continuation packet. A
session that cannot afford to checkpoint has already failed. The reserve is
enforced as a floor by the decision ladder, not as advice.

## 3.4 Input Group II — Integrity Signals (derived, structural)

| Field | Type | Derivation |
| --- | --- | --- |
| `duplicateTokens` | int | Σ tokens of spans whose `contentHash` equals an earlier span's, excluding the first occurrence |
| `supersededTokens` | int | Σ tokens of spans appearing in any live span's `supersedes` |
| `ballastTokens` | int | Σ tokens of `tool_result` + `narration` spans not referenced since `enteredAtTurn` |
| `unresolvedReferenceCount` | int | Count of `references` entries pointing to absent spans |
| `contradictionCount` | int | Count of unordered pairs in any `contradicts` relation |
| `loadBearingContradictionCount` | int | Same, restricted to pairs where either span is `relevanceClass ∈ {CRITICAL, HIGH}` |
| `orphanedMutationRecords` | int | `isMutationRecord` spans whose referenced artifact span is absent |

**Contradiction detection is structural (NORMATIVE — CLM-I4).** A contradiction is
recorded only when two spans assert different values for the *same declared key*
in a typed assertion table: `repository.head`, `branch.name`, `test.result[suite]`,
`decision[id].outcome`, `scope.includes[item]`, `scope.excludes[item]`,
`authority.grant[id]`, `dependency[name].version`, `environment[key]`. Prose
disagreement is **not** a contradiction and must not be inferred. This keeps the
signal deterministic and false-positive-free at the cost of missing subtle drift —
an accepted tradeoff, recorded in §14 as OI-4.

## 3.5 Input Group III — Progress Signals (measured)

| Field | Type | Notes |
| --- | --- | --- |
| `openObjectiveCount` | int | Acceptance criteria not yet satisfied |
| `satisfiedObjectiveCount` | int | |
| `openQuestionCount` | int | Unanswered `open_question` spans |
| `blockingOpenQuestionCount` | int | Open questions marked as blocking by the asker |
| `failedToolCallsInWindow` | int | Over the last `PROGRESS_WINDOW_TURNS` |
| `toolCallsInWindow` | int | |
| `objectiveDeltaInWindow` | int | Change in `satisfiedObjectiveCount` over the window |
| `repeatedActionCount` | int | Identical (tool, normalized-args) invocations ≥ 3 times in window |

## 3.6 Input Group IV — Durability Signals (measured)

| Field | Type | Notes |
| --- | --- | --- |
| `turnsSinceLastCheckpoint` | int | |
| `mutationsSinceLastCheckpoint` | int | Writes to repo/world not yet captured in a sealed checkpoint |
| `lastCheckpointId` | id \| null | |
| `lastCheckpointVerified` | bool | Whether that checkpoint passed seal verification |
| `unsealedCheckpointAttempts` | int | Consecutive failed seal attempts |

## 3.7 Input Group V — Environment and Authority Signals (declared)

| Field | Type | Source |
| --- | --- | --- |
| `repositoryIdentity` | `{ remoteUrl, rootCommit, repoFingerprint }` | git |
| `branchName` | string | git |
| `headSha` | string | git |
| `workingTreeDirty` | bool | git |
| `workingTreeDigest` | string | derived: hash of `git status --porcelain=v2` + `git diff` |
| `dependencyLockDigest` | string | hash of lockfile(s) |
| `toolchainFingerprint` | `{ node, packageManager, os }` | env |
| `environmentDigest` | string | hash of the **names and presence** of required env keys — never values (§12.6) |
| `authorityGrantIds` | string[] | Work Management Layer |
| `authorityExpiresAt` | iso \| null | |
| `assignmentId` / `executionId` / `taskId` | id | Work Management Layer |
| `custodyToken` | string | CLM custody manager (§7.3) |

## 3.8 Input Group VI — Provider Signals (declared)

| Field | Type | Notes |
| --- | --- | --- |
| `providerId` / `modelId` | string | |
| `providerHealth` | `healthy \| degraded \| unavailable` | |
| `rateLimitState` | `ok \| throttled \| exhausted` | |
| `capabilityFingerprint` | string[] | Tool/feature capabilities the session depends on |
| `requiredCapabilities` | string[] | Capabilities the remaining work requires |
| `costPerTokenBasisPoints` | int | For §11 cost metrics; integer basis points only |

**The declared cost table (NORMATIVE — CLM-I5).** `projectedNextStepTokens` is
computed from a versioned table mapping planned operation kinds to conservative
token costs (e.g. `read_file_large: 12000`, `run_test_suite: 4000`,
`checkpoint_emit: 6000`). The table is data, versioned as `costTableVersion`, and
its values are DEFAULTs requiring calibration. Projection must **over**-estimate;
under-estimation is the failure that strands a session without room to checkpoint.

## 3.9 The Snapshot (NORMATIVE — CLM-I6)

```ts
interface ContextHealthSnapshot {
  snapshotId: string;             // deterministic: hash of contents
  sessionId: string;
  snapshotAt: IsoTimestamp;       // declared, never read from a clock inside pure code
  schemaVersion: string;
  costTableVersion: string;
  capacity:    CapacitySignals;
  integrity:   IntegritySignals;
  progress:    ProgressSignals;
  durability:  DurabilitySignals;
  environment: EnvironmentSignals;
  provider:    ProviderSignals;
  /** Non-empty ⇒ degraded. Each entry names a field that could not be obtained. */
  missingInputs: string[];
  /** Spans, or a digest of them when archived. */
  spans: ContextSpan[] | { spanDigest: string; spanCount: number };
}
```

A snapshot is **immutable** once created and is archived with every decision it
produced, enabling replay (§12.7).

---

# 4. Deliverable 2 — Deterministic Health Scoring

## 4.1 Shape

```
HealthScore = {
  scoringVersion: string,
  overall: int,                 // 0..100, higher is healthier
  dimensions: {
    capacity: int, redundancy: int, freshness: int,
    coherence: int, progress: int, durability: int, provider: int
  },   // each 0..100
  floors: string[],             // dimension names that breached a hard floor
  degraded: boolean,            // snapshot.missingInputs non-empty
  inputSnapshotId: string
}
```

## 4.2 Arithmetic Rules (NORMATIVE — CLM-S1)

1. **Integers only.** All ratios are computed in **basis points** (`bp`, 1/10000).
   `ratioBp(n, d) = d == 0 ? 0 : floor(n * 10000 / d)`.
2. **Floor division** everywhere. No rounding modes, no banker's rounding, no floats.
3. **Clamping** is explicit: `clamp(x) = min(100, max(0, x))`.
4. **Division by zero yields the defined neutral value** stated per formula, never
   NaN, never an exception.
5. **Order of operations is fixed** by the written formula; implementations may not
   reassociate.
6. The scorer is **total**: every syntactically valid snapshot yields a score.

Rationale: floating point makes replay platform-dependent. A decision to discard a
founder's instruction must not hinge on an FMA difference between two machines.

## 4.3 Dimension Formulas (DEFAULT constants; NORMATIVE structure)

Let `L = contextLimitTokens`, `U = tokensUsed`,
`R = tokensReservedForOutput + tokensReservedForSafety`,
`P = projectedNextStepTokens`.

### D1 — Capacity (weight 30)

```
usableHeadroom = max(0, L - U - R - P)
capacityBp     = ratioBp(usableHeadroom, max(1, L - R))
capacity       = clamp(capacityBp / 100)
```

Note the projection is subtracted: capacity answers "can I take my next step *and*
still afford to checkpoint", not "how much room is left".

### D2 — Redundancy (weight 10)

```
redundancy = clamp(100 - ratioBp(duplicateTokens, max(1, U)) / 100)
```

### D3 — Freshness (weight 10)

```
staleTokens = supersededTokens + ballastTokens
freshness   = clamp(100 - ratioBp(staleTokens, max(1, U)) / 100)
```

### D4 — Coherence (weight 20)

```
coherence = clamp(100
            - 25 * min(4, loadBearingContradictionCount)
            - 10 * min(5, contradictionCount - loadBearingContradictionCount)
            -  5 * min(6, unresolvedReferenceCount)
            - 10 * min(3, orphanedMutationRecords))
```

Any `loadBearingContradictionCount ≥ 1` also raises the **coherence floor breach**
(§4.5), which is what actually drives behavior; the numeric penalty is for trend
metrics.

### D5 — Progress (weight 15)

```
failRateBp   = ratioBp(failedToolCallsInWindow, max(1, toolCallsInWindow))
repeatPenalty= 10 * min(4, repeatedActionCount)
stallPenalty = (objectiveDeltaInWindow == 0 && toolCallsInWindow >= PROGRESS_STALL_CALLS) ? 25 : 0
progress     = clamp(100 - failRateBp / 100 - repeatPenalty - stallPenalty
                     - 5 * min(4, blockingOpenQuestionCount))
```

### D6 — Durability (weight 10)

```
durability = clamp(100
             - 3 * min(20, turnsSinceLastCheckpoint)
             - 8 * min(5, mutationsSinceLastCheckpoint)
             - 20 * min(2, unsealedCheckpointAttempts))
```

### D7 — Provider (weight 5)

```
providerBase = providerHealth == "healthy"     ? 100
             : providerHealth == "degraded"    ? 50
             : 0
capMissing   = |requiredCapabilities \ capabilityFingerprint|
provider     = clamp(providerBase
               - (rateLimitState == "throttled" ? 20 : rateLimitState == "exhausted" ? 60 : 0)
               - 50 * min(2, capMissing))
```

### Aggregate

```
weights = { capacity:30, coherence:20, progress:15, redundancy:10,
            freshness:10, durability:10, provider:5 }   // Σ = 100
overall = floor( Σ (weights[d] * dimensions[d]) / 100 )
```

**NORMATIVE — CLM-S2.** The weight table and every constant above are data, carried
in a versioned policy record, hashed into `scoringVersion`. Changing any constant
changes the version. A decision archived under version *v* must replay identically
under *v* forever.

## 4.4 DEFAULT Constants

| Constant | DEFAULT | Meaning |
| --- | --- | --- |
| `PROGRESS_WINDOW_TURNS` | 12 | Window for progress signals |
| `PROGRESS_STALL_CALLS` | 8 | Calls with zero objective delta ⇒ stall |
| `MIN_COMPACTION_GAIN` | 15 | Capacity points a compaction must yield to count as effective |
| `MAX_COMPACTIONS_PER_SESSION` | 3 | Beyond this, compaction is presumed exhausted |
| `MAX_INEFFECTIVE_COMPACTIONS` | 2 | Consecutive ineffective compactions ⇒ force rollover |
| `CHECKPOINT_TURN_INTERVAL` | 20 | Periodic checkpoint cadence |
| `CHECKPOINT_MUTATION_INTERVAL` | 5 | Mutations before a checkpoint is due |

All require calibration against real sessions before being trusted (§14 OI-1).

## 4.5 Hard Floors (NORMATIVE — CLM-S3)

Floors are breached independently of `overall`. A high `overall` never masks a
breached floor. Floors are the safety mechanism; `overall` is the tuning knob.

| Floor | Condition | Consequence |
| --- | --- | --- |
| `F-CAPACITY-CRIT` | `usableHeadroom < tokensReservedForSafety` | Rollover required |
| `F-CAPACITY-LOW` | `capacity < 25` | Compaction required |
| `F-COHERENCE` | `loadBearingContradictionCount ≥ 1` | Uncertain state |
| `F-REFERENCE` | `unresolvedReferenceCount ≥ 3` | Uncertain state |
| `F-AUTHORITY` | authority missing/expired, or `custodyToken` invalid | Blocked |
| `F-RESTORATION` | successor session without `restorationVerified` | Blocked |
| `F-PROVIDER` | `providerHealth == "unavailable"` or `capMissing ≥ 1` | Switch required |
| `F-DURABILITY` | `unsealedCheckpointAttempts ≥ 2` | Blocked |
| `F-DEGRADED` | `missingInputs` non-empty | Continue forbidden |

## 4.6 Determinism Guarantees (NORMATIVE — CLM-S4)

- Same `(snapshot, scoringVersion)` ⇒ byte-identical `HealthScore`. Enforced by
  golden vectors (§16.2).
- The scorer must be **monotone** in each degradation signal: increasing
  `duplicateTokens` (all else equal) may never increase `redundancy`. Enforced by
  property tests (§16.3).
- The scorer never reads a clock, never allocates randomness, never calls a model.

## 4.7 Safety Band Vocabulary (NORMATIVE — CLM-S5)

Mission Control UX §12.6 / CX-2 requires a discrete band vocabulary defined by this
subsystem, and correctly refuses to invent one. This section supplies it.

**The vocabulary is CLM-owned. The numbers are not.** See §4.8.

| Band | Meaning | Derived from |
| --- | --- | --- |
| `safe` | Work may continue; no lifecycle action pending | No floor breached and `overall ≥ CONTINUE_MIN_OVERALL` |
| `elevated` | A lifecycle action is due or in progress; work is still sound | `F-CAPACITY-LOW` breached, or a `COMPACT`/`CHECKPOINT` decision is pending |
| `critical` | Capacity or durability requires rollover or block | `F-CAPACITY-CRIT` or `F-DURABILITY` breached |
| `uncertain` | Context integrity is in question; mutable work is suspended | `F-COHERENCE` or `F-REFERENCE` breached (session `QUARANTINED`) |
| `blocked` | Work is halted pending authority or recovery | Session `BLOCKED` |
| `not_measured` | The session reports no context health | No probe available for this execution |
| `stale` | The last sample is older than the sampling interval | `now - snapshotAt > CONTEXT_SAMPLE_INTERVAL_MS` |

**NORMATIVE — CLM-S6.** `uncertain` and `blocked` are **bands, not merely states**. v1.0.0
exposed them only as lifecycle states; the UX needs them in the band vocabulary because a
session that is coherent-but-halted must never render as `safe`. A band is a verdict about
*fitness to work*, not about capacity alone.

**NORMATIVE — CLM-S7 (no aggregate verdict).** The CLM emits a band **per session**. It
never emits a fleet-wide verdict. Sessions reporting `not_measured` are excluded from any
count and are reported as excluded — the CLM will not supply a number that could be read as
"all safe" when part of the fleet is unmeasured. This matches UX §12.15 rule 4 and CX-6.

**NORMATIVE — CLM-S8 (sampling interval is declared).** Every emitted band carries
`sampledAt` and the `CONTEXT_SAMPLE_INTERVAL_MS` in force. A consumer that cannot age a band
must render no verdict. Satisfies CX-5.

## 4.8 Ownership of Thresholds — Split (NORMATIVE — CLM-S9)

Mission Control UX CX-2 and OQ-7 assign "signal vocabulary **and thresholds**" to the CLM
owner. That assignment is **accepted for the vocabulary and declined for the numbers**, and
the reason is governance, not modesty.

A threshold decides when work is stopped. Phase 2 §7.1 records the governing constraint
that *"Learning proposals require validation before changing prompts, routing, **thresholds**,
review depth, or policy"*, and stage 2E's D-2E-2 records the precedent directly: *"Score
weightings are governed… they are versioned policy, because weightings determine
prioritization and therefore behavior."* A numeric threshold on context health is an
organizational risk posture — how much degradation Dev HQ tolerates before halting an
employee — and AGENT-001 places that class of decision with the Founder, not with an
engineering subsystem.

| Artifact | Owner | Rationale |
| --- | --- | --- |
| Signal set, dimension set, band names, band semantics, scoring **function shape**, floor **conditions** | **CLM (Lead Software Engineer)** | Engineering facts about what is measurable and how |
| Weight table, numeric thresholds, floor **values**, budgets (`MAX_*`), sampling interval | **Founder / Governance**, as versioned policy | Determines when work halts; a risk-posture decision |
| Rendering of band, number, staleness, and absence | **Mission Control (1F / Design)** | Presentation only |
| Aggregation, trend, and anomaly detection over emitted scores | **Phase 2 stage 2E** | Analytics, not control |

**NORMATIVE — CLM-S10.** Every numeric constant in §4.3–4.5 and §5 is a **provisional
default** (register: §14A) until Founder-approved. The CLM ships them as a proposed policy record, not
as a decision. `policyVersion` identifies the approving authority; an unapproved policy
record is marked `provisional: true` and every band derived from it is emitted with
`provisional: true` so no consumer can present an unapproved threshold as a governed verdict.

---

# 5. Deliverables 3–8 — The Decision Ladder

## 5.1 One Ordered Ladder (NORMATIVE — CLM-D1)

The decision engine evaluates rules in **fixed order** and takes the **first match**.
There is no scoring competition between actions and no tie to break. This makes the
decision explainable as a single rule id.

```
LifecycleDecision = {
  policyVersion: string,
  action: "BLOCK" | "QUARANTINE" | "ROLLOVER" | "SWITCH" | "SPLIT"
        | "CHECKPOINT" | "COMPACT" | "CONTINUE",
  ruleId: string,                  // e.g. "D3.rollover.capacity-critical"
  reasonCodes: string[],           // machine-readable, from a closed vocabulary
  riders: {
    requiresCheckpointFirst: boolean,
    providerSwitch: { toProviderId, toModelId, reason } | null,
    splitPlanId: string | null
  },
  inputScoreId: string,
  inputSnapshotId: string
}
```

**NORMATIVE — CLM-D2 (checkpoint-before-transition).** `SPLIT`, `SWITCH`, and
`ROLLOVER` always carry `requiresCheckpointFirst = true`. A transition that loses
state because no checkpoint preceded it is a defect, not a tradeoff.

## 5.2 Ladder Order

| Rank | Rule group | Action |
| --- | --- | --- |
| 1 | Safety gates | `BLOCK` |
| 2 | Integrity gates | `QUARANTINE` (uncertain) |
| 3 | Capacity-critical | `ROLLOVER` |
| 4 | Provider-forced | `SWITCH` |
| 5 | Decomposition | `SPLIT` |
| 6 | Durability due | `CHECKPOINT` |
| 7 | Reclaimable waste | `COMPACT` |
| 8 | Otherwise | `CONTINUE` |

Safety before capacity is deliberate: a session with a corrupted context must not
be permitted to roll that corruption forward into a successor. Blocking a broken
session is cheaper than propagating it.

## 5.3 Deliverable 3 — CONTINUE

**Rule `D8.continue`** — reached only when no earlier rule matched.

Preconditions, all of which must hold (NORMATIVE — CLM-D3):

1. `degraded == false` (no missing inputs).
2. No floor breached.
3. `overall ≥ CONTINUE_MIN_OVERALL` (**DEFAULT 60**).
4. `capacity ≥ 40` and `coherence ≥ 60`.
5. Session state is `ACTIVE` and holds a valid mutation token.
6. `mutationsSinceLastCheckpoint < CHECKPOINT_MUTATION_INTERVAL`.

Effect: no lifecycle action; the session proceeds. The decision is still recorded
(§11) so that "we chose to continue" is auditable, not merely the absence of a record.

**Hysteresis (NORMATIVE — CLM-D4).** After any non-continue action, `CONTINUE`
requires `overall ≥ CONTINUE_MIN_OVERALL + CONTINUE_HYSTERESIS` (**DEFAULT 8**) for
the next `HYSTERESIS_TURNS` (**DEFAULT 3**) turns. This prevents oscillation across
a threshold — the compact/continue/compact churn that burns budget without progress.

## 5.4 Deliverable 4 — COMPACT

**Rules**

| Rule id | Condition |
| --- | --- |
| `D7.compact.capacity` | `F-CAPACITY-LOW` breached and compaction budget remains |
| `D7.compact.redundancy` | `redundancy < 60` and `duplicateTokens ≥ COMPACT_MIN_RECLAIM` |
| `D7.compact.staleness` | `freshness < 55` and `supersededTokens + ballastTokens ≥ COMPACT_MIN_RECLAIM` |

`COMPACT_MIN_RECLAIM` **DEFAULT** = `max(4000, contextLimitTokens / 40)`. Compaction
that reclaims less than this is not worth its own cost and its risk.

**Guards (NORMATIVE — CLM-D5).** Compaction is forbidden when:

- `compactionsThisSession ≥ MAX_COMPACTIONS_PER_SESSION`; or
- `consecutiveIneffectiveCompactions ≥ MAX_INEFFECTIVE_COMPACTIONS`; or
- a floor other than `F-CAPACITY-LOW` is breached (fix integrity before pruning —
  compacting a contradictory context can delete the evidence of the contradiction); or
- the projected post-compaction context would drop any `CRITICAL` relevance span (§8).

When compaction is forbidden but capacity demands relief, the ladder falls through
to `ROLLOVER` on the next evaluation via `D3.rollover.compaction-exhausted`.

**Effectiveness accounting (NORMATIVE — CLM-D6).** After compaction, re-probe and
re-score. If `capacity_after - capacity_before < MIN_COMPACTION_GAIN`, increment
`consecutiveIneffectiveCompactions` and record reason `compaction_ineffective`.
A gain at or above the threshold resets the counter to zero.

**Checkpoint coupling.** `COMPACT` carries `requiresCheckpointFirst = true` whenever
`mutationsSinceLastCheckpoint > 0`. Never discard context that records unpersisted
mutations without first sealing them.

## 5.5 Deliverable 5 — CHECKPOINT

**Rules**

| Rule id | Condition |
| --- | --- |
| `D6.checkpoint.mutation-due` | `mutationsSinceLastCheckpoint ≥ CHECKPOINT_MUTATION_INTERVAL` |
| `D6.checkpoint.interval-due` | `turnsSinceLastCheckpoint ≥ CHECKPOINT_TURN_INTERVAL` and `mutationsSinceLastCheckpoint ≥ 1` |
| `D6.checkpoint.milestone` | An acceptance criterion transitioned to satisfied |
| `D6.checkpoint.pre-risk` | The next planned operation is classified irreversible or high-cost |
| `D6.checkpoint.pre-transition` | Rider on `SPLIT`/`SWITCH`/`ROLLOVER`/conditional `COMPACT` |

**NORMATIVE — CLM-D7.** A checkpoint is never taken when `mutationsSinceLastCheckpoint == 0`
and no milestone or pre-transition trigger applies. Empty checkpoints dilute the
fallback chain (§10.4) and make "last known good" ambiguous.

**NORMATIVE — CLM-D8.** Checkpointing is the only lifecycle action permitted while
a floor other than `F-DURABILITY` is breached. A blocked or uncertain session may
— and generally must — still checkpoint, because the record of *how it got broken*
is exactly what recovery needs.

## 5.6 Deliverable 6 — SPLIT-WORK

**Purpose.** Some work cannot fit one context no matter how well compacted. Splitting
divides it into independently ownable units rather than degrading one session until
it fails.

**Rules**

| Rule id | Condition |
| --- | --- |
| `D5.split.projected-overflow` | `projectedRemainingWorkTokens > usableHeadroomAfterIdealCompaction` **and** the work is decomposable |
| `D5.split.parallelizable` | Remaining work contains ≥ 2 units with disjoint mutation footprints and no ordering dependency |
| `D5.split.scope-breadth` | `openObjectiveCount ≥ SPLIT_OBJECTIVE_THRESHOLD` (**DEFAULT 6**) with disjoint footprints |

**Decomposability test (NORMATIVE — CLM-D9).** Work is decomposable only if a
`SplitPlan` can be constructed in which:

1. Every unit has an explicit, **disjoint mutation footprint** — no two units may
   write the same file, record, or resource. Overlap ⇒ not decomposable.
2. Every unit carries the **full negative scope and rejected-approach set** of the
   parent (§9.4). Splitting must never be a laundering mechanism for constraints.
3. Every unit has independently checkable acceptance criteria.
4. Ordering dependencies are declared; dependent units are sequenced, not parallelized.
5. A **single integration owner** is named for reconciling units. Split does not
   create a leaderless committee.

If any condition fails, `SPLIT` is not selected and the ladder falls through.

**NORMATIVE — CLM-D10 (split is not a rollover).** Splitting creates *child work
units*, each of which will later be owned by its own session. It does **not** by
itself transfer ownership of the parent. The parent session remains the single
owner of the parent unit until it rolls over or retires. Child units are
`RESERVED` (owner-less) until claimed under §7.

**Authority (NORMATIVE — CLM-D11).** The CLM may **propose** a split. Splitting
approved work into differently-scoped units is a scope decision, which under
AGENT-001 belongs to the Work Management Layer / founder. So: the CLM emits a
`SplitPlan` and an escalation; it does not unilaterally re-decompose approved
scope. Autonomous split is permitted **only** when the plan's units are a strict
partition of already-approved acceptance criteria with no scope change — recorded
as reason `split_partition_only`.

## 5.7 Deliverable 7 — MODEL/PROVIDER SWITCH

**Rules**

| Rule id | Condition |
| --- | --- |
| `D4.switch.unavailable` | `providerHealth == "unavailable"` |
| `D4.switch.capability-gap` | `requiredCapabilities \ capabilityFingerprint ≠ ∅` |
| `D4.switch.window-insufficient` | Remaining work cannot fit the active model's window even after ideal compaction, and a larger-window model is available |
| `D4.switch.rate-exhausted` | `rateLimitState == "exhausted"` and the estimated wait exceeds `SWITCH_WAIT_TOLERANCE_MS` (**DEFAULT** 300000) |
| `D4.switch.degraded-persistent` | `providerHealth == "degraded"` for ≥ `SWITCH_DEGRADED_TURNS` (**DEFAULT 3**) consecutive probes |

**NORMATIVE — CLM-D12 (switch implies rollover of context).** A provider/model
switch is never an in-place swap. It is a checkpoint + continuation + new session
on the target provider, going through the **full restoration protocol** (§10). The
reason is unavoidable: token accounting, tokenizer boundaries, tool-calling
semantics, and system-prompt handling differ between providers. Carrying a context
across a switch without re-verification is exactly the class of silent corruption
this spec exists to prevent.

**NORMATIVE — CLM-D13 (capability non-regression).** A switch target must satisfy
`requiredCapabilities` **in full**. A switch that would drop a capability the
remaining work needs is forbidden; if no compliant target exists, the decision
becomes `BLOCK` with reason `no_capable_provider`, escalated to the founder.

**NORMATIVE — CLM-D14 (routing pin).** The switch must record `fromProviderId` and
`toProviderId` on the checkpoint and on the Work Management Layer's execution
routing, so retries reproduce the decision rather than re-deriving it — the same
rule `ExecutionRouting.provider` already enforces in `types/domain/execution.ts`.

**Switch selection.** The CLM does not rank models for quality. It emits a
`SwitchRequirement` (`requiredCapabilities`, `minContextTokens`, `excludedProviders`,
`reason`). Target selection is delegated to the Agent Registry / routing policy.
If exactly one compliant target exists, it is taken automatically; if several, the
registry's existing preference order decides; if none, `BLOCK`.

## 5.9 Provider-Specific Optimization Without Lock-In

Phase 2 §0.4 is **binding on every stage** and its rule 1 is absolute: *"No model name
appears in orchestration, routing, or policy code."* Rule 5 extends it backwards — *"Before
2H exists, bindings still must not be hardcoded"* — via the P-4 `ModelResolver` indirection.
The CLM is orchestration. It is therefore fully bound by §0.4 **now**, before 2H exists.

This creates a real tension. Context management genuinely benefits from provider-specific
behavior: prompt-caching mechanisms, minimum cacheable sizes, TTLs, tokenizer boundaries,
and invalidation semantics **are not equivalent across providers** (Research backlog R-13,
Rank C). Ignoring those differences leaves measurable savings unclaimed; encoding them in
CLM code creates exactly the lock-in §0.4 exists to prevent.

**NORMATIVE — CLM-D16 (profile-as-data).** Provider-specific optimization enters the CLM
**only** as a `ProviderContextProfile` **data record**, resolved at runtime through the P-4
`ModelResolver` port. The CLM contains **zero provider names, model names, or provider
conditionals** in code, tests, or policy records.

```ts
interface ProviderContextProfile {
  profileId: string;              // opaque; NOT a provider name
  profileVersion: string;
  contextLimitTokens: int;
  reservedOutputTokens: int;
  capabilityFingerprint: string[];
  tokenizerFingerprint: string;   // opaque; equality-comparable only
  caching: {
    supported: boolean;
    minCacheableTokens: int;
    ttlMs: int;
    invalidatesOnPrefixChange: boolean;
  } | null;
  /** Cached prefix tokens still occupy the window but are priced differently. */
  cachedTokensOccupyWindow: boolean;
  costPerInputTokenBp: int;
  costPerCachedInputTokenBp: int;
  costPerOutputTokenBp: int;
}
```

**NORMATIVE — CLM-D17 (occupancy ≠ cost).** Following R-13, `tokensUsed` measures **window
occupancy** and is the only input to capacity scoring. Caching changes **cost**, never
capacity. The CLM must never treat a cached prefix as free headroom. A separate
`cachedPrefixTokens` field feeds §11 cost metrics only, and is forbidden as a scoring input.
Conflating them would let a caching change silently move the point at which work is halted.

**NORMATIVE — CLM-D18 (tokenizer opacity).** Cross-provider token counts are not comparable.
`tokenizerFingerprint` is compared for **equality only**; the CLM never converts counts
between providers. On a switch, occupancy is **re-measured** on the target, never translated
— which is a second, independent reason CLM-D12 forbids in-place swaps.

**NORMATIVE — CLM-D19 (no historical-performance authority).** Per §0.4 rule 6, the CLM
never selects or excludes a provider on the basis of past performance. It emits capability
and limit **requirements**; 2H's routing policy decides. A profile that has caused failures
may be excluded only by a governed, recorded policy change.

**Deferred pending R-13.** Caching strategy is Rank C, due before 1H. Until it resolves, the
`caching` block is `null` in every profile and the CLM performs no caching-aware behavior.
This is a stated absence, not an omission.

## 5.8 Deliverable 8 — SESSION ROLLOVER

**Rules**

| Rule id | Condition |
| --- | --- |
| `D3.rollover.capacity-critical` | `F-CAPACITY-CRIT` breached |
| `D3.rollover.compaction-exhausted` | Capacity relief needed but compaction forbidden by `CLM-D5` guards |
| `D3.rollover.compaction-ineffective` | `consecutiveIneffectiveCompactions ≥ MAX_INEFFECTIVE_COMPACTIONS` |
| `D3.rollover.session-age` | `turnIndex ≥ MAX_SESSION_TURNS` (**DEFAULT 400**) with work remaining |
| `D3.rollover.carrier` | Rider from `SWITCH` (§5.7) |
| `D3.rollover.operator` | Explicit founder/operator instruction |

**Rollover is the only mechanism that changes session ownership.** Its full
protocol — reservation, sealing, packet, custody transfer, restoration, token
issue, predecessor retirement — is §7 and §10. Summary of the ordering constraint:

```
seal checkpoint  →  build packet  →  reserve successor  →  predecessor enters
HANDING_OFF (mutation token revoked)  →  successor RESTORING  →  gates pass  →
custody transferred atomically  →  successor ACTIVE (token issued)  →
predecessor RETIRED
```

**NORMATIVE — CLM-D15.** The predecessor's mutation token is revoked **before** the
successor is created, and the successor's is issued **only after** custody transfer
commits. There is no window in which both hold one. See INV-2 (§12.2).

---

# 6. State Machine

## 6.1 States

| State | Mutable work? | Meaning |
| --- | --- | --- |
| `INITIALIZING` | No | Session created; probes not yet run |
| `RESTORING` | No | Successor loading a continuation packet |
| `VERIFYING` | No | Running restoration gates (§10.2) |
| `ACTIVE` | **Yes** | Holds a valid mutation token and custody |
| `CHECKPOINTING` | No | Sealing a checkpoint |
| `COMPACTING` | No | Applying a compaction plan |
| `SPLITTING` | No | Emitting a split plan |
| `SWITCHING` | No | Preparing a provider switch (always leads to `HANDING_OFF`) |
| `HANDING_OFF` | No | Token revoked; awaiting successor verification |
| `QUARANTINED` | No | Uncertain state (§9.10) — read-only diagnosis permitted |
| `BLOCKED` | No | Refuses to proceed; awaiting authority/decision (§9.11) |
| `FAILED_RESTORATION` | No | A restoration gate failed (§10.5) |
| `RECOVERING` | No | Fallback selection / repair in progress |
| `RETIRED` | No | Terminal, successful: custody released, successor active |
| `ABANDONED` | No | Terminal, unsuccessful: custody released, no successor |

**NORMATIVE — CLM-M1.** `ACTIVE` is the **only** state in which mutable work may be
performed. Every other state permits read-only operations at most. This is the
single structural guarantee behind INV-1 and INV-2.

## 6.2 Transitions

```
INITIALIZING ──(fresh session, custody granted)────────────────► ACTIVE
INITIALIZING ──(successor with packet)─────────────────────────► RESTORING
INITIALIZING ──(no authority / no custody)─────────────────────► BLOCKED

RESTORING    ──(packet loaded, integrity ok)───────────────────► VERIFYING
RESTORING    ──(packet missing/corrupt)────────────────────────► FAILED_RESTORATION

VERIFYING    ──(all gates pass, custody committed, token issued)► ACTIVE
VERIFYING    ──(any gate fails)────────────────────────────────► FAILED_RESTORATION
VERIFYING    ──(contradiction found in packet)─────────────────► QUARANTINED

ACTIVE       ──(D6 checkpoint)─────────────────────────────────► CHECKPOINTING
ACTIVE       ──(D7 compact)────────────────────────────────────► COMPACTING
ACTIVE       ──(D5 split)──────────────────────────────────────► SPLITTING
ACTIVE       ──(D4 switch)─────────────────────────────────────► SWITCHING
ACTIVE       ──(D3 rollover)───────────────────────────────────► CHECKPOINTING → HANDING_OFF
ACTIVE       ──(D2 quarantine)─────────────────────────────────► QUARANTINED
ACTIVE       ──(D1 block)──────────────────────────────────────► BLOCKED
ACTIVE       ──(work complete)─────────────────────────────────► RETIRED

CHECKPOINTING──(sealed)────────────────► ACTIVE | HANDING_OFF | COMPACTING | SPLITTING | SWITCHING
CHECKPOINTING──(seal failed, retries spent)────────────────────► BLOCKED

COMPACTING   ──(applied, verified)─────────────────────────────► ACTIVE
COMPACTING   ──(verification failed → context restored)────────► ACTIVE (compaction reverted)
COMPACTING   ──(revert impossible)─────────────────────────────► FAILED_RESTORATION

SPLITTING    ──(plan emitted / escalated)──────────────────────► ACTIVE
SWITCHING    ──(packet built)──────────────────────────────────► HANDING_OFF
SWITCHING    ──(no compliant target)───────────────────────────► BLOCKED

HANDING_OFF  ──(successor reached ACTIVE)──────────────────────► RETIRED
HANDING_OFF  ──(successor failed, fallback chain spent)────────► ABANDONED
HANDING_OFF  ──(handoff deadline exceeded)─────────────────────► RECOVERING

QUARANTINED  ──(contradiction resolved by authority)───────────► VERIFYING
QUARANTINED  ──(unresolvable)──────────────────────────────────► BLOCKED

FAILED_RESTORATION ──(retry gate / earlier checkpoint chosen)──► RECOVERING
RECOVERING   ──(fallback checkpoint accepted)──────────────────► RESTORING
RECOVERING   ──(chain exhausted)───────────────────────────────► BLOCKED

BLOCKED      ──(authority resolves)────────────────────────────► VERIFYING
BLOCKED      ──(founder abandons)──────────────────────────────► ABANDONED
```

**NORMATIVE — CLM-M2.** `BLOCKED → ACTIVE` is not a transition. Resolution always
routes back through `VERIFYING`. Whatever unblocked the session may have changed
the world; the gates must be re-proved.

**NORMATIVE — CLM-M3.** `FAILED_RESTORATION` and `RECOVERING` may never transfer
custody. Custody is held by the transfer record, not by the session; a session that
cannot verify simply never receives it.

**NORMATIVE — CLM-M4.** Every transition emits exactly one event (§11.2) and is
idempotent under replay, keyed on `(sessionId, fromState, toState, transitionSeq)`
— the same idempotency discipline `agent-execution-service` applies to callbacks.

---

# 7. Deliverables 9, 15 — Immutable Checkpoints and Single Ownership

## 7.1 Deliverable 9 — Immutable Checkpoint Creation

**NORMATIVE — CLM-C1 (immutability).** A sealed checkpoint is append-only and never
edited. Corrections are expressed by writing a **new** checkpoint whose
`supersedesCheckpointId` names the incorrect one. The incorrect checkpoint remains
readable forever. This mirrors ADR-0002's immutable timeline: the audit record's
value comes from the fact that it cannot be tidied up afterward.

**Creation protocol (NORMATIVE — CLM-C2):**

1. **Quiesce** — no mutations may be in flight. In-flight writes are awaited or
   recorded as `pendingMutation` entries with their intended effect.
2. **Collect** — gather all ten schema groups (§8).
3. **Verify externals** — repository facts are read fresh, never copied from context.
4. **Canonicalize** — serialize per §12.3 (stable key order, normalized newlines,
   UTF-8 NFC, no floats).
5. **Hash** — `contentHash = sha256(canonicalBytes)`.
6. **Chain** — `chainHash = sha256(parentChainHash || contentHash)`.
7. **Seal** — write atomically. Sealing is the commit point; a partially written
   checkpoint is never visible.
8. **Self-verify** — re-read, recompute both hashes, compare. Mismatch ⇒ the
   checkpoint is marked `corrupt`, never used, and the attempt counter increments.
9. **Emit** — `Event` + `Evidence` (kind `artifact`) per §11.

**NORMATIVE — CLM-C3 (sealing is atomic).** Steps 7–8 either produce a fully sealed,
self-verified checkpoint or produce nothing usable. There is no partially-sealed
state, and no consumer may read a checkpoint that has not self-verified.

**NORMATIVE — CLM-C4 (deterministic identity).** `checkpointId` is derived, not
random: `sha256(sessionId || parentCheckpointId || transitionSeq)`. A replayed
creation attempt therefore produces the same id and cannot fork the chain — the
same reserve-before-create discipline `Escalation.revisionExecutionId` uses.

**NORMATIVE — CLM-C5 (failure to seal is not a soft failure).** After
`MAX_SEAL_ATTEMPTS` (**DEFAULT 2**), the session transitions to `BLOCKED` with
reason `checkpoint_unsealable` and escalates. A session that cannot record its own
state must not continue mutating the world.

**NORMATIVE — CLM-C11 (persistence floor).** A `ContextCheckpoint` store must provide:

1. **Durability** across process death — a checkpoint that does not outlive the session
   that wrote it cannot serve rollover, which is its only purpose.
2. **Append-only semantics** with no capacity eviction. The current `store.events` cap of
   **200 entries** (`lib/dev-hq/store.ts:226`, verified by the UX workstream, finding I1)
   would silently truncate a checkpoint chain and break `chainHash` verification to the
   root. Silent eviction of an integrity chain is worse than no chain, because the
   verification failure it produces is indistinguishable from tampering.
3. **Read-after-write consistency** — restoration reads what sealing wrote.
4. **A linearizable compare-and-set** on the custody record (§7.5). Without it, INV-2 is
   unenforceable across processes and rollover is unsafe by construction.

**Consequence, stated plainly:** the CLM **cannot ship in enforcing mode on the current
memory-only store**. Shadow mode (§16.6) can, because it takes no action. This makes the
Sprint 1F persistence decision (Q-1/ADR-0003, Phase 2 precondition P-1) a **hard
prerequisite** for CLM enforcement, not a preference. Recorded as OI-5 and escalated in the
handoff.

## 7.2 Emission Reserve

**NORMATIVE — CLM-C6.** `tokensReservedForSafety` must be ≥ the measured p99 cost of
emitting a checkpoint plus a packet for this session class. The reserve is
recomputed after each emission from observed sizes. If observed cost exceeds the
reserve, the reserve is raised immediately and the event `clm.reserve_raised` is
emitted. Running out of room to checkpoint is treated as a **defect class**, not an
operational accident.

## 7.3 Custody Model

```ts
interface WorkCustody {
  workUnitId: string;              // the unit of work being owned
  ownerSessionId: string | null;   // exactly one, or none
  custodyToken: string;            // opaque; invalidated on transfer
  custodyEpoch: int;               // monotonically increments on every transfer
  grantedAt: IsoTimestamp;
  /** Successor reserved before creation; null when no rollover in flight. */
  reservedSuccessorSessionId: string | null;
  reservationExpiresAt: IsoTimestamp | null;
  state: "held" | "transferring" | "released";
}
```

This is deliberately the same shape of guarantee as `AgentAssignment`'s lease in
`types/domain/agent-assignment.ts`: one holder, an expiry, and an explicit release.

## 7.4 The Mutation Token

**NORMATIVE — CLM-C7.** Every mutating operation must present a valid
`(custodyToken, custodyEpoch)` pair. The gate validates:

1. The session is `ACTIVE`.
2. `custodyToken` matches the current custody record.
3. `custodyEpoch` equals the current epoch (stale epoch ⇒ reject).
4. `restorationVerified == true` if the session is a successor.
5. Authority is present and unexpired.

A failure on any check rejects the operation and transitions the session to
`BLOCKED`. **The token is checked at the mutation site, not merely at state entry** —
otherwise a session that lost custody mid-turn keeps writing until its next probe.

## 7.5 Deliverable 15 — Duplicate-Ownership Prevention

**NORMATIVE — CLM-C8 (single-writer custody).** Custody transfer is a single atomic
compare-and-set on the custody record:

```
CAS( custody WHERE workUnitId = W
       AND ownerSessionId = P
       AND custodyEpoch = E
       AND state = 'transferring'
       AND reservedSuccessorSessionId = S
     SET ownerSessionId = S,
         custodyEpoch  = E + 1,
         custodyToken  = newToken,
         state         = 'held' )
```

Exactly one CAS can succeed for epoch `E`. Any concurrent attempt observes `E+1`
and fails. Consequences:

- A predecessor that "wakes up" after transfer presents epoch `E`, fails
  validation, and is forced to `RETIRED`/`ABANDONED` — it cannot write.
- A duplicate successor spawned by a retry presents a `reservedSuccessorSessionId`
  that no longer matches and never receives a token.
- A network partition cannot produce two owners, because ownership is decided by
  the CAS outcome, not by either session's belief.

**NORMATIVE — CLM-C9 (reserve-before-create).** `reservedSuccessorSessionId` is
written **before** the successor session is created. A crash between reservation
and creation strands nothing: the reservation expires (`reservationExpiresAt`) and
the predecessor may either re-reserve the same id (idempotent) or be recovered.
A second successor can never be created, because creation requires a matching
reservation and there is only one reservation slot.

**NORMATIVE — CLM-C10 (no orphan work).** If custody is `released` with the work
unit incomplete and no successor active, an `Escalation` is raised. Work must
always have either an owner or an open escalation — never neither.

---

# 8. Deliverable 10 — Checkpoint Schema

## 8.0 Canonical Record Name (NORMATIVE — CLM-K7)

The domain record specified below is named **`ContextCheckpoint`**. The bare word
"checkpoint" is already overloaded in the approved plans and must not be used as a type
name:

| Name | Owner | What it is | Relationship |
| --- | --- | --- | --- |
| **`ContextCheckpoint`** | **CLM** | An immutable session-continuity record enabling verified rollover | This spec |
| `EditCheckpoint` | Phase 2 stage 2J | A reversible entry in a pair-session scratch edit buffer (`PHASE_2_PROGRAM_PLAN.md` §12.5) | **Unrelated.** Different lifetime, different subject, revertible where `ContextCheckpoint` is immutable |
| "Checkpoint entity" | Sprint 1F requirement D-H | *"Durable resume points"* | **This is `ContextCheckpoint`.** 1F D-H is a rendering requirement over the CLM's record, not a separate entity — see §14.2 |
| "next gate or checkpoint" | Sprint 1F §7.3 `nextGate` | A governance decision point | **Unrelated.** Process vocabulary, not a record |

Within this document "checkpoint" is shorthand for `ContextCheckpoint`. Implementations
must use the full name. A single `Checkpoint` type serving both this record and 2J's edit
buffer would be a duplicate source of truth of exactly the kind AGENT-001 prohibits.

## 8.1 Full Schema

```ts
interface ContextCheckpoint {
  // ── 1. IDENTITY ────────────────────────────────────────────────────────────
  identity: {
    checkpointId: string;              // derived (CLM-C4)
    schemaVersion: string;
    sessionId: string;
    workUnitId: string;
    taskId: EntityId;                  // Work Management Layer
    executionId: EntityId | null;
    assignmentId: EntityId | null;
    parentCheckpointId: string | null; // chain predecessor
    supersedesCheckpointId: string | null;
    sequence: int;                     // 0-based within the session
    custodyEpoch: int;
    createdAt: IsoTimestamp;
    createdBySessionRole: string;      // e.g. "lead-software-engineer"
    providerId: string;
    modelId: string;
    reason: CheckpointReason;          // why this checkpoint exists
    kind: "periodic" | "milestone" | "pre_transition" | "pre_risk" | "recovery";
  };

  // ── 2. OBJECTIVE ───────────────────────────────────────────────────────────
  objective: {
    /** Verbatim, never paraphrased across checkpoints (CLM-K1). */
    statement: string;
    statementHash: string;             // proves it was never rewritten
    authoritySource: string;           // doc id / approval id that authorized it
    acceptanceCriteria: Array<{
      id: string;
      text: string;                    // verbatim
      status: "open" | "satisfied" | "waived" | "failed";
      satisfiedByEvidenceIds: string[];
      waiverAuthorityId: string | null;
    }>;
    inScope: string[];                 // verbatim items
    /** NEGATIVE SCOPE — mandatory, may never be empty once established (INV-3). */
    outOfScope: Array<{
      item: string;
      reason: string;
      decidedBy: string;
      decidedAt: IsoTimestamp;
    }>;
    successDefinition: string;
    priority: Priority;
  };

  // ── 3. CURRENT STATE ───────────────────────────────────────────────────────
  currentState: {
    phase: string;                      // e.g. "implementation", "validation"
    lifecycleState: SessionState;
    narrative: string;                  // human-readable "where things stand"
    completedWork: Array<{ id: string; summary: string; evidenceIds: string[] }>;
    inFlightWork: Array<{
      id: string; summary: string;
      /** What was already mutated for this item — critical for non-duplication. */
      mutationsApplied: string[];
      nextStep: string;
      partial: boolean;
    }>;
    remainingWork: Array<{ id: string; summary: string; dependsOn: string[] }>;
    openQuestions: Array<{
      id: string; question: string; blocking: boolean;
      askedOf: string; askedAt: IsoTimestamp;
    }>;
    knownRisks: Array<{ id: string; risk: string; severity: string; mitigation: string | null }>;
    assumptions: Array<{ id: string; assumption: string; validated: boolean; basis: string }>;
    /** Mutations begun but not confirmed complete at quiesce time (CLM-C2 step 1). */
    pendingMutations: Array<{ target: string; intendedEffect: string; confirmed: boolean }>;
  };

  // ── 4. REPOSITORY STATE ────────────────────────────────────────────────────
  repositoryState: {
    repoFingerprint: string;            // stable identity: hash(rootCommit || canonical remote)
    remoteUrl: string;
    rootCommit: string;                 // first-commit sha — survives renames/forks distinctly
    branchName: string;
    branchUpstream: string | null;
    headSha: string;
    headSubject: string;
    baseBranch: string;
    mergeBaseSha: string;
    workingTreeClean: boolean;
    workingTreeDigest: string;          // hash of porcelain status + diff
    stagedDigest: string;
    untrackedPaths: string[];
    changedFiles: Array<{ path: string; status: string; additions: int; deletions: int; blobHashAfter: string | null }>;
    diffDigest: string;                 // hash of the full unified diff
    stashRefs: string[];
    submoduleStates: Array<{ path: string; sha: string }>;
    dependencies: {
      lockfileDigests: Record<string, string>;   // path → sha256
      manifestDigests: Record<string, string>;
      installedTreeDigest: string | null;        // e.g. node_modules fingerprint, when available
      declaredRuntimeVersions: Record<string, string>;
    };
    environment: {
      os: string;
      toolchain: Record<string, string>;         // node, npm, git versions
      /** Key NAMES and presence only — never values (CLM-K3 / §12.6). */
      requiredEnvKeys: Array<{ key: string; present: boolean }>;
      environmentDigest: string;
      workingDirectory: string;
    };
  };

  // ── 5. DECISIONS ───────────────────────────────────────────────────────────
  decisions: Array<{
    id: string;
    decision: string;
    rationale: string;
    alternativesConsidered: string[];
    decidedBy: string;                  // role
    authorityBasis: string;             // which authority permitted it
    decidedAt: IsoTimestamp;
    reversible: boolean;
    supersededByDecisionId: string | null;
    /** NORMATIVE: never pruned by compaction (relevance class CRITICAL). */
  }>;

  // ── 6. EVIDENCE ────────────────────────────────────────────────────────────
  evidence: {
    /** Links to Work Management Layer Evidence records (types/domain/evidence.ts). */
    evidenceIds: EntityId[];
    validations: Array<{
      id: string;
      command: string;                  // exact command run
      exitCode: int;
      summary: string;                  // e.g. "22 files, 317 tests passed"
      outputDigest: string;
      ranAt: IsoTimestamp;
      /** Repo state the validation is valid FOR. Stale if HEAD/diff moved (CLM-K4). */
      validAtHeadSha: string;
      validAtWorkingTreeDigest: string;
      performedBy: string;
      /** NORMATIVE: false ⇒ the successor may not cite it as its own (INV-4). */
      performedByThisSession: boolean;
    }>;
    artifacts: Array<{ id: string; path: string; contentDigest: string; purpose: string }>;
    /** Explicitly enumerated: what was NOT validated. Mandatory, may be empty only
     *  with an explicit "nothing outstanding" assertion. */
    notValidated: Array<{ item: string; reason: string; risk: string }>;
  };

  // ── 7. REVIEWS ─────────────────────────────────────────────────────────────
  reviews: {
    reviewIds: EntityId[];              // Work Management Layer Review records
    iterations: Array<{
      reviewId: EntityId;
      iteration: int;
      status: ReviewStatus;
      policy: ReviewPolicy;
      escalationReason: ReviewEscalationReason | null;
    }>;
    findings: Array<{
      findingId: EntityId;
      severity: ReviewFindingSeverity;
      category: string;
      summary: string;
      status: "open" | "addressed" | "disputed" | "accepted_as_is";
      addressedByDecisionId: string | null;
      /** Disputes must carry evidence, per AGENT-001 review-cooperation rules. */
      disputeBasis: string | null;
    }>;
    outstandingBlockingFindings: int;   // derived; must be 0 to claim completion
  };

  // ── 8. CONTEXT ─────────────────────────────────────────────────────────────
  context: {
    healthScoreAtCheckpoint: HealthScore;
    snapshotId: string;
    scoringVersion: string;
    policyVersion: string;
    compactionHistory: Array<{
      compactionId: string; at: IsoTimestamp;
      tokensBefore: int; tokensAfter: int;
      spansRemoved: int; capacityGain: int; effective: boolean;
      compactionVersion: string; planDigest: string;
    }>;
    /** Retained spans, by relevance class, as a digest — not the raw content. */
    retainedSpanDigest: string;
    retainedSpanCountByClass: Record<RelevanceClass, int>;
    /** What was removed and why — auditability of forgetting (CLM-K5). */
    removalLedgerDigest: string;
    turnIndex: int;
    tokensUsedAtCheckpoint: int;
    contextLimitTokens: int;
  };

  // ── 9. CONTINUATION ────────────────────────────────────────────────────────
  continuation: {
    /** The packet is derived from this checkpoint and hashed here (§9). */
    packetId: string;
    packetHash: string;
    recommendedNextAction: string;
    /** Ordered, explicit. The successor executes these before anything else. */
    firstActions: string[];
    /** NORMATIVE: things the successor must NOT do (INV-3). */
    forbiddenActions: Array<{ action: string; reason: string; sourceDecisionId: string | null }>;
    rejectedApproaches: Array<{
      approach: string;
      reason: string;
      rejectedBy: string;
      rejectedAt: IsoTimestamp;
      evidenceIds: string[];
      /** True when the approach was actually attempted and failed. */
      attempted: boolean;
    }>;
    requiredRestorationChecks: string[];   // gate ids that must pass (§10.2)
    handoffRole: string;                   // intended next owner role
    reservedSuccessorSessionId: string | null;
    escalationIds: EntityId[];             // open escalations the successor inherits
  };

  // ── 10. INTEGRITY ──────────────────────────────────────────────────────────
  integrity: {
    contentHash: string;                 // sha256 over groups 1–9, canonical form
    parentChainHash: string | null;
    chainHash: string;                   // sha256(parentChainHash || contentHash)
    canonicalizationVersion: string;
    hashAlgorithm: "sha256";
    sealedAt: IsoTimestamp;
    selfVerifiedAt: IsoTimestamp;
    selfVerificationResult: "ok" | "corrupt";
    /** Every field group carries its own digest so partial corruption is localized. */
    groupDigests: Record<
      "identity"|"objective"|"currentState"|"repositoryState"|"decisions"
      |"evidence"|"reviews"|"context"|"continuation", string>;
    /** Set when a later verification found this checkpoint unusable. Append-only:
     *  this is a NEW record referencing it, never an in-place edit (CLM-C1). */
    completeness: {
      requiredGroupsPresent: boolean;
      missingFields: string[];
      degraded: boolean;
    };
  };
}
```

## 8.2 Relevance Classes (NORMATIVE — CLM-K2)

| Class | Contents | Compaction policy |
| --- | --- | --- |
| `CRITICAL` | objective, acceptance criteria, negative scope, rejected approaches, decisions, authority, open blocking questions, unconfirmed mutation records | **Never removed. Never summarized away.** |
| `HIGH` | evidence with current validity, outstanding review findings, in-flight work, assumptions | Removed only when superseded by a newer record of the same key |
| `MEDIUM` | completed-work summaries, satisfied criteria detail, resolved questions | May be summarized with a lossy-summary marker |
| `LOW` | tool results already distilled into observations, narration, duplicate content, stale observations | Freely removable |

## 8.3 Schema Invariants (NORMATIVE)

- **CLM-K1** — `objective.statement` is byte-identical across every checkpoint in a
  chain unless a checkpoint explicitly records an authorized objective change with
  an `authoritySource`. `statementHash` makes drift detectable rather than arguable.
- **CLM-K3** — no secret, credential, token, or env **value** may enter a checkpoint.
  Only key names and a presence boolean. Enforced by a pre-seal scanner (§15 F-SEC-01).
- **CLM-K4** — a validation record is valid only for the exact
  `(validAtHeadSha, validAtWorkingTreeDigest)` it was run against. Restoration
  re-checks this; a mismatch marks it `stale` and it may not be cited (§10.2 gate G6).
- **CLM-K5** — every compaction writes a **removal ledger** entry; the checkpoint
  carries its digest. What was forgotten must itself be a record.
- **CLM-K6** — `outOfScope`, `forbiddenActions`, and `rejectedApproaches` are
  **monotonically non-shrinking** across a checkpoint chain, except by an explicit,
  authority-stamped removal entry. A silent shrink is a defect (INV-3, §12.3).

---

# 9. Deliverables 11–14, 18, 19 — Behaviors

## 9.1 Deliverable 11 — Continuation Packet Generation

The packet is what the successor actually reads. It is **derived deterministically**
from a sealed checkpoint — never authored independently, never model-summarized
into existence.

```ts
interface ContinuationPacket {
  packetId: string;                 // sha256(checkpointId || packetVersion)
  packetVersion: string;
  sourceCheckpointId: string;
  sourceChainHash: string;
  generatedAt: IsoTimestamp;

  // Who you are and what you are picking up
  handoff: {
    predecessorSessionId: string;
    reservedSuccessorSessionId: string;
    workUnitId: string;
    taskId: EntityId;
    role: string;
    custodyEpochAtHandoff: int;
    /** The successor presents this to claim custody; single-use. */
    custodyClaimTicket: string;
  };

  // Verbatim, non-negotiable
  objective: ContextCheckpoint["objective"];   // full copy, unmodified

  // NORMATIVE: the three lists that make continuation safe rather than merely possible
  constraints: {
    outOfScope: ContextCheckpoint["objective"]["outOfScope"];             // verbatim
    rejectedApproaches: ContextCheckpoint["continuation"]["rejectedApproaches"]; // verbatim
    forbiddenActions: ContextCheckpoint["continuation"]["forbiddenActions"];     // verbatim
    authorityGrants: Array<{ id: string; scope: string; expiresAt: IsoTimestamp | null }>;
    escalationsInherited: EntityId[];
  };

  state: {
    completedWork: ...;      // from checkpoint
    inFlightWork: ...;       // including mutationsApplied — the anti-duplication record
    remainingWork: ...;
    openQuestions: ...;
    assumptions: ...;
    knownRisks: ...;
  };

  expectedWorld: {
    repoFingerprint: string; branchName: string; headSha: string;
    workingTreeDigest: string; diffDigest: string;
    lockfileDigests: Record<string,string>;
    requiredEnvKeys: Array<{ key: string; present: boolean }>;
    toolchain: Record<string,string>;
  };

  evidenceLedger: {
    /** Marked with performedByThisSession=false for everything inherited. */
    validations: ...;
    notValidated: ...;
    outstandingBlockingFindings: int;
  };

  restoration: {
    requiredGates: GateId[];             // §10.2; ordered
    onGateFailure: "block";              // NORMATIVE: always block, never proceed
    fallbackCheckpointIds: string[];     // ordered, newest-verified first (§10.4)
  };

  firstActions: string[];
  recommendedNextAction: string;

  integrity: {
    packetHash: string;                  // over all fields above, canonical form
    sourceCheckpointContentHash: string;
    completeness: { requiredSectionsPresent: boolean; missing: string[] };
  };
}
```

**NORMATIVE — CLM-G1 (derivation, not authorship).** `packet-builder` is a pure
function of the checkpoint. Two runs over the same checkpoint produce identical
bytes. Free-text narrative in the packet is copied from checkpoint fields, not
regenerated.

**NORMATIVE — CLM-G2 (no silent lossiness).** If any `CRITICAL` field cannot be
included (size, corruption), packet generation **fails**. It never emits a partial
packet. A packet that omits a rejected approach is worse than no packet: it
actively invites the successor to redo failed work.

**NORMATIVE — CLM-G3 (negative-scope preservation).** `constraints.outOfScope`,
`constraints.rejectedApproaches`, and `constraints.forbiddenActions` are copied
**verbatim and in full**, never summarized, truncated, sampled, or reordered by
relevance. This is INV-3 and is checked by an automated assertion at generation
time and again at restoration (gate G8).

**NORMATIVE — CLM-G4 (inherited-evidence marking).** Every validation the
predecessor performed is marked `performedByThisSession: false` in the successor's
view. The successor may **cite** it as inherited context but may not report it as
validation it performed — the exact honesty rule AGENT-001 imposes and the exact
error the Sprint 1E completion notes had to correct for the production build.

**NORMATIVE — CLM-G5 (a continuation packet is not a work packet).** Sprint **1G** owns
**Smart Work Packets** — *"the packet content generator"* (Phase 2 §3.3), which describe
**what work to do**. A `ContinuationPacket` describes **how to safely resume a session**.
They are different records with different lifetimes and must not be merged:

| | Smart Work Packet (1G) | Continuation Packet (CLM) |
| --- | --- | --- |
| Answers | What is the work? | How do I safely resume it? |
| Created by | The packet generator, at planning time | The CLM, at rollover time |
| Lifetime | The work unit | One handoff |
| Contains | Objective, context, instructions, acceptance criteria | Objective **copy**, constraints, world expectation, gates, custody ticket |
| Mutability | Versioned; may be regenerated | Derived and immutable per checkpoint |

**Relationship (NORMATIVE):** a `ContinuationPacket` **references** the work packet by id
and carries its version; it never inlines, restates, or regenerates packet content. If the
work packet changed during the session, the packet id and version in the checkpoint make
that detectable at restoration. The CLM does not generate work packets, and 1G does not
generate continuation packets.

**NORMATIVE — CLM-G6 (the Context Router assembles; the CLM does not).** Sprint **1H**'s
Context Router owns *"per-packet minimum-complete context with least privilege"* — the
**admission** decision about what enters a working set. The CLM owns everything after
admission: measurement, retention, compaction, checkpointing, and transfer. On restoration
the CLM **replays the recorded working set**; it never re-invokes the Router to reassemble
context, because a reassembled context is a different context and would silently invalidate
every hash in the checkpoint. If the Router's inputs changed, that is a contradiction to be
surfaced (§9.10), not a difference to be smoothed over.

## 9.2 Deliverable 12 — Context Compaction

**Model.** Compaction is a pure transformation over the labeled span set producing a
`CompactionPlan`, which is then applied and verified.

```ts
interface CompactionPlan {
  compactionId: string;              // sha256(sessionId || turnIndex || planDigest)
  compactionVersion: string;
  inputSpanDigest: string;
  removals: Array<{ spanId: SpanId; reason: RemovalReason; tokens: int }>;
  summarizations: Array<{
    spanIds: SpanId[]; replacementSpanId: SpanId;
    tokensBefore: int; tokensAfter: int;
    lossy: true;                     // NORMATIVE: always marked lossy
    preservedAssertions: string[];   // typed assertions carried through verbatim
  }>;
  retained: SpanId[];
  projectedTokensAfter: int;
  planDigest: string;
}
```

**Ordered reduction ladder (NORMATIVE — CLM-X1).** Compaction proceeds in this
order and stops as soon as the capacity target is met. Cheap, lossless reductions
always precede lossy ones.

1. **Exact duplicates** — identical `contentHash`, keep earliest occurrence.
2. **Superseded spans** — appear in a live span's `supersedes`, and their typed
   assertions are fully represented by the superseding span.
3. **Unreferenced raw tool results** whose distilled observation span exists.
4. **Resolved open questions** and their deliberation, keeping the answer.
5. **Narration** — progress commentary with no typed assertions.
6. **`MEDIUM`-class summarization** — completed work compressed to
   `(what, evidenceId, outcome)` triples.
7. **Stop.** `HIGH` and `CRITICAL` are never reduced by compaction. If the target
   is still unmet, compaction **fails to reach target** and the decision escalates
   to `ROLLOVER` — it does not proceed into `HIGH`.

**NORMATIVE — CLM-X2 (assertion conservation).** For every typed assertion key
present before compaction, an assertion with the same key and value must be present
after, unless the span carrying it was superseded by a span carrying that key with
a newer value. This is a **checkable postcondition**, verified after every
compaction. Violation ⇒ revert.

**NORMATIVE — CLM-X3 (revertibility).** The pre-compaction span set is retained
until the post-compaction verification passes. Failing verification reverts. If
revert is impossible, the session goes to `FAILED_RESTORATION` — never "continue
with a context we know is wrong".

**NORMATIVE — CLM-X4 (compaction never precedes a checkpoint of pending mutations).**
See CLM-D5.

## 9.3 Deliverable 13 — Relevance Preservation

**Deterministic relevance classification (NORMATIVE — CLM-X5).** `relevanceClass` is
assigned by rule, not judgment:

```
CRITICAL if kind ∈ {objective, authority, decision, negative_scope, rejected_approach}
       or (isMutationRecord ∧ ¬confirmedInSealedCheckpoint)
       or (kind = open_question ∧ blocking)
HIGH     if kind ∈ {evidence, review_finding} ∧ status = open
       or kind = artifact ∧ referenced within RECENCY_WINDOW turns
       or kind = instruction
MEDIUM   if kind ∈ {artifact, observation, evidence} ∧ superseded = false
LOW      otherwise
```

Escalation only: a span may be **promoted** by an explicit rule (e.g. referenced by
a `CRITICAL` span ⇒ at least `HIGH`), never demoted below its rule-assigned class.
Promotion propagates transitively over `references` to a bounded depth
(`RELEVANCE_PROPAGATION_DEPTH`, **DEFAULT 2**).

**NORMATIVE — CLM-X6 (reference integrity).** Removing a span whose id appears in a
retained span's `references` is forbidden. Either the referent is retained, or the
referring span is rewritten to inline the needed assertion, or the removal is
rejected. Dangling references are the mechanism by which contexts silently become
incoherent.

**NORMATIVE — CLM-X7 (recency is not relevance).** Age never demotes a `CRITICAL`
or `HIGH` span. A founder constraint stated at turn 3 outranks a tool result from
turn 300. Any policy that decays importance with time is forbidden for these classes.

## 9.4 Deliverable 14 — Duplicate and Stale-Content Removal

**Duplicate detection (NORMATIVE — CLM-X8):**

- **Exact** — equal `contentHash` after normalization (§12.3). Always safe to
  deduplicate, keeping the earliest occurrence and rewriting references.
- **Structural** — same typed assertion key with the **same** value from the same
  source. Deduplicate, keeping the one with the stronger provenance (measured >
  declared > derived), ties broken by earliest ordinal.
- **Conflicting** — same key, **different** values. This is **not** a duplicate. It
  is a contradiction: record it in `contradicts`, never silently pick one. Choosing
  a winner here is precisely the silent corruption this spec forbids.

**Staleness detection (NORMATIVE — CLM-X9).** A span is stale when:

- it is named in a live span's `supersedes`; or
- it is a repository observation whose `validAtHeadSha`/`workingTreeDigest` no
  longer matches current world state; or
- it is a validation record whose validity anchor no longer matches (CLM-K4); or
- it is a resolved open question's deliberation.

**Stale ≠ deletable (NORMATIVE — CLM-X10).** Stale `CRITICAL` content is
**retained and marked stale**, not deleted. A superseded decision remains in the
record with `supersededByDecisionId` — that is how a successor learns not to
re-litigate it. Only `LOW` and `MEDIUM` stale content is deletable.

**Removal ledger (NORMATIVE — CLM-X11).** Every removal writes
`{ spanId, kind, tokens, reason, contentHash, removedAtTurn, compactionId }`. The
ledger is append-only and its digest enters the checkpoint (CLM-K5). Forgetting is
itself an auditable act.

## 9.5–9.9 Restoration, Recovery, Fallback

Covered in full in §10.

## 9.10 Deliverable 18 — Uncertain-State Behavior

**Definition.** A session is *uncertain* when its context contains a
load-bearing contradiction, an unresolvable reference, or an unverifiable claim
that bears on the current work — but no invariant has yet been violated.

**Trigger conditions:** `F-COHERENCE` or `F-REFERENCE` breached; a restoration gate
returned `INDETERMINATE` (not fail); packet and world disagree on a non-blocking
field; `pendingMutations` contains unconfirmed entries after quiesce.

**Behavior (NORMATIVE — CLM-U1). In `QUARANTINED`:**

| Permitted | Forbidden |
| --- | --- |
| Read-only investigation (git, file reads, test **reads**) | Any mutation of repo, records, or world |
| Emitting checkpoints (diagnostic, `kind: "recovery"`) | Claiming acceptance criteria satisfied |
| Asking the founder/authority a question | Choosing between contradicting values |
| Recording findings as evidence | Deleting the contradicting spans |

**NORMATIVE — CLM-U2 (no coin-flips).** When two sources contradict on a typed key,
the CLM must not resolve by recency, by confidence, or by source preference. It
must either (a) **re-measure the world**, which is authoritative for `repository.*`
and `environment.*` keys, or (b) **escalate** for keys whose truth is a human
decision (`scope.*`, `decision[*].outcome`, `authority.*`).

Re-measurement is the resolution path for exactly this set: `repository.head`,
`repository.branch`, `repository.diff`, `dependency[*].version`, `environment[*]`,
`test.result[*]`. Everything else escalates.

**NORMATIVE — CLM-U3 (bounded uncertainty).** A session may remain `QUARANTINED`
for at most `MAX_QUARANTINE_TURNS` (**DEFAULT 10**) or `MAX_QUARANTINE_MS`
(**DEFAULT** 30 min), whichever first. Exceeding it transitions to `BLOCKED` with
an escalation. Indefinite uncertainty is a stall wearing the costume of diligence.

**Exit.** Resolution routes through `VERIFYING` (CLM-M2), never directly to `ACTIVE`.

## 9.11 Deliverable 19 — Blocked-State Behavior

**Definition.** A session is *blocked* when continuing would violate an invariant,
exceed authority, or act on state it cannot verify.

**Trigger conditions:** `F-AUTHORITY`, `F-RESTORATION`, `F-DURABILITY` breached;
restoration gate hard-failed and the fallback chain is exhausted; no compliant
provider for a required switch; custody lost or epoch stale; quarantine timeout;
checkpoint unsealable; a detected invariant violation of any kind.

**Behavior (NORMATIVE — CLM-B1). In `BLOCKED`:**

1. **Mutation token is revoked immediately** and all in-flight mutations are halted
   at the next gate check.
2. A **diagnostic checkpoint** is written (`kind: "recovery"`) capturing the block
   reason, the failing gate/floor, the snapshot, and the score. Blocking without
   recording why is the failure mode that makes blocks unrecoverable.
3. An **`Escalation`** is raised via the existing escalation service with a new
   origin (§13.2), carrying: the blocker, relevant facts, impact, available
   options, recommended option, and the required decision owner — the escalation
   content standard from AGENT-001.
4. **Custody is retained, not released**, unless the founder abandons the work.
   Releasing custody on block would create ownerless work (CLM-C10).
5. Read-only diagnosis remains permitted. Reporting remains permitted and required.

**NORMATIVE — CLM-B2 (blocked is honest, not silent).** A blocked session must
produce a status report naming: what is known, what is unknown, why it matters, the
risk of proceeding, and the recommended next action. Silent blocking is a defect.

**NORMATIVE — CLM-B3 (no self-authorization).** A session may never unblock itself
by relaxing the condition that blocked it — including by rewriting the objective,
waiving an acceptance criterion, widening authority, or reclassifying a `CRITICAL`
span. Unblocking requires either an external world change re-verified through the
gates, or an authority decision recorded with its `authoritySource`.

---

# 10. Deliverables 15–17 — Restoration Protocol, Verification, Recovery

## 10.1 Overview

```
successor created (reserved)
  → RESTORING : load packet, verify packetHash + source chainHash
  → VERIFYING : run gates G1..G10 in order
      any HARD FAIL      → FAILED_RESTORATION
      any INDETERMINATE  → QUARANTINED
      all PASS           → custody CAS (§7.5) → mutation token issued → ACTIVE
  → predecessor RETIRED
```

## 10.2 The Gate Ladder (NORMATIVE — CLM-R1)

Gates run **in order**. A hard failure stops the ladder — later gates are not run,
because their results would be meaningless against an unverified base.

| Gate | Name | Verifies | Hard fail when |
| --- | --- | --- | --- |
| **G1** | Packet integrity | `packetHash` recomputes; `sourceCheckpointContentHash` matches the sealed checkpoint; chain hashes verify to the chain root | Any hash mismatch |
| **G2** | Completeness | All `CRITICAL` sections present; `constraints` non-empty where the source had entries; no `missing` entries | Any required section absent |
| **G3** | Repository identity | `repoFingerprint`, `rootCommit`, canonical `remoteUrl` match the live repo | Mismatch — **this gate exists to stop work landing in the wrong repository** |
| **G4** | Branch | Live branch == `expectedWorld.branchName`; upstream matches | Mismatch |
| **G5** | HEAD | Live `headSha` == expected; if not, whether the delta is a fast-forward is **recorded**, not auto-accepted | Divergent history, or non-fast-forward, or unexpected rewrite |
| **G6** | Working tree & diff | `workingTreeDigest` and `diffDigest` match; changed-file set and blob hashes match | Any unexplained delta |
| **G7** | Tests / evidence validity | Each inherited validation's `validAtHeadSha`+`validAtWorkingTreeDigest` still match live state; otherwise marked **stale** | Blocking findings outstanding, or a validation the packet's `firstActions` depend on is stale **and** cannot be re-run |
| **G8** | Authority & negative scope | Authority grants present and unexpired; role matches `handoffRole`; `outOfScope`/`rejectedApproaches`/`forbiddenActions` counts ≥ source counts (INV-3) | Expired/absent authority; any shrink in the three constraint lists |
| **G9** | Dependencies & environment | Lockfile and manifest digests match; declared runtime versions match; every `requiredEnvKeys` entry marked `present: true` is present | Digest mismatch; a required key absent |
| **G10** | Custody | Reservation matches this session id; reservation unexpired; predecessor is in `HANDING_OFF` or terminal; `custodyEpoch` is the expected one | Any mismatch — **this gate is what prevents two owners** |

**NORMATIVE — CLM-R2 (verify, don't trust).** Every gate re-measures the live world.
No gate may be satisfied by a value copied from the packet. The packet supplies the
*expectation*; the world supplies the *fact*; the gate compares them.

**NORMATIVE — CLM-R3 (verification is recorded).** Gate results are written as a
`RestorationReport` and attached as `Evidence` (kind `validation`). The successor's
first durable act is the record that it proved it could start.

```ts
interface RestorationReport {
  reportId: string; sessionId: string; packetId: string; sourceCheckpointId: string;
  startedAt: IsoTimestamp; completedAt: IsoTimestamp;
  gates: Array<{
    gateId: GateId; result: "pass" | "fail" | "indeterminate" | "skipped";
    expected: string; observed: string; detail: string;
  }>;
  overall: "verified" | "failed" | "indeterminate";
  restorationVerified: boolean;      // true only when overall == "verified"
  custodyEpochGranted: int | null;
}
```

**NORMATIVE — CLM-R12 (the ladder is a floor, and it is extensible).** G1–G10 are
**mandatory for every consumer** and may never be skipped, reordered, or subsetted. Consumers
with additional resumable state register **additional** gates (G11+) that run **after** G10
and are equally blocking. A consumer may add gates; it may never remove one.

This is required by two approved plans that already assume a restoration gate the base
ladder does not contain:

| Consumer | Additional gate | Verifies |
| --- | --- | --- |
| Phase 2 **2J** Interactive AI Pair Engineering (acceptance J11: *"A session interrupted and resumed verifies workspace, base candidate, and checkpoints before mutating"*) | **G11-PAIR** | `ScratchCandidate` identity and location; `baseCandidateId` unchanged; `EditCheckpoint` sequence integrity with no gaps or forks; `isCommittable == false` still holds |
| Phase 2 **2A** Temporary Organizations (§3.9: *"Restoration verification (CLM) must pass before a resumed packet mutates"*) | **G12-PACKET** | Packet lease still held; organization not retired; packet not reassigned; concurrency-group membership unchanged |
| Sprint **1I** Autonomous Engineering Loop | **G13-LOOP** | Loop iteration counter and bounded-decomposition budget unchanged across the rollover |

**NORMATIVE — CLM-R13.** A registered gate that cannot run is a **hard failure**, not a
skip. "The pair-session gate could not check the scratch candidate" must block, because the
alternative is mutating an unverified workspace.

Phase 2 §3.9's requirement is hereby **confirmed satisfied** by INV-1: restoration
verification already gates all mutable work, and a packet is mutable work. No change to that
plan is needed; this note records the agreement so the dependency is not re-litigated.

## 10.3 Deliverable 16 — Failed-Restoration Recovery

**NORMATIVE — CLM-R4.** On hard failure the successor:

1. Never receives a mutation token. It is in `FAILED_RESTORATION`; it can read and
   report, nothing else.
2. Writes a `RestorationReport` with the failing gate, expected vs observed.
3. Classifies the failure (§15) and selects a recovery route from the table below.
4. Does **not** delete, reset, or "fix" the world to make the gate pass. Making the
   repository match the packet is a mutation, and mutations require a token.

| Failing gate | Classification | Recovery route |
| --- | --- | --- |
| G1 packet integrity | `F-PKT-*` | Regenerate packet from the sealed checkpoint (packet is derived — regeneration is free). If the checkpoint itself fails verification, fall back (§10.4). |
| G2 completeness | `F-PKT-INCOMPLETE` | Regenerate; if still incomplete, fall back. |
| G3 repo identity | `F-ENV-WRONGREPO` | **Never auto-repair.** Escalate immediately. Wrong-repository work is the highest-severity class. |
| G4 branch | `F-ENV-BRANCH` | If the expected branch exists locally/remotely and checkout is non-destructive **and** the working tree is clean, propose a checkout as an *authorized repair* (§10.6). Otherwise escalate. |
| G5 HEAD moved | `F-ENV-HEAD` | If the delta is a fast-forward containing the packet's HEAD: record, re-run G6/G7, mark inherited validations stale, continue in `QUARANTINED` pending re-validation. If history diverged/rewritten: escalate. |
| G6 diff mismatch | `F-ENV-DIFF` | Escalate. Unexplained working-tree deltas mean someone or something else touched the tree; guessing is unsafe. |
| G7 stale evidence | `F-EVD-STALE` | Re-run the validations (read-only? no — running tests may write artifacts, so this is an **authorized repair**, §10.6). Mark all inherited validations `performedByThisSession: false` until re-run. |
| G8 authority | `F-AUTH-*` | Escalate to the Work Management Layer / founder. Never self-grant. |
| G8 constraint shrink | `F-PKT-SCOPESHRINK` | **Treat as corruption.** Regenerate the packet; if the shrink is present in the checkpoint chain, fall back to the last checkpoint whose constraint lists are supersets. Escalate regardless — a shrink is a defect that must be investigated. |
| G9 deps/env | `F-ENV-DEPS` | Propose an authorized repair (reinstall from lockfile). If lockfile itself differs, escalate. |
| G10 custody | `F-OWN-*` | **Never retry.** A custody failure means another owner may exist. Halt, report, escalate. |

**NORMATIVE — CLM-R5 (bounded restoration attempts).** At most
`MAX_RESTORATION_ATTEMPTS` (**DEFAULT 2**) attempts per checkpoint, and at most
`MAX_FALLBACK_DEPTH` (**DEFAULT 3**) distinct checkpoints per rollover. Exhaustion
⇒ `BLOCKED` + escalation. Mirrors `MAX_EXECUTION_ATTEMPTS`/`MAX_REVIEW_ITERATIONS`:
automated recovery that never gives up is a stall, not recovery.

## 10.4 Deliverable 17 — Fallback to Earlier Verified Checkpoints

**Candidate ordering (NORMATIVE — CLM-R6).** Deterministic, newest first:

1. Only checkpoints with `selfVerificationResult == "ok"` and a chain that verifies
   to the root are candidates.
2. Only checkpoints for the **same** `workUnitId` and the same `repoFingerprint`.
3. Ordered by `sequence` descending.
4. A checkpoint whose restoration already hard-failed in this rollover is skipped.
5. A checkpoint that is `supersededByCheckpointId`-superseded is skipped **unless**
   the superseding one is itself unusable.

**NORMATIVE — CLM-R7 (fallback is a lossy, recorded decision).** Falling back to
checkpoint *N-k* discards the work recorded in *N-k+1..N*. Therefore:

- Fallback beyond **one** checkpoint requires an escalation (founder decides),
  because it means discarding recorded, possibly-mutated work.
- The discarded interval's mutations must be enumerated: the CLM computes the
  mutation delta between the fallback checkpoint and the newest checkpoint and
  presents it. Work that was applied to the world but is being dropped from the
  record is exactly the reconciliation risk a human must own.
- The fallback is itself checkpointed (`kind: "recovery"`) with
  `supersedesCheckpointId` pointing at the abandoned head.

**NORMATIVE — CLM-R8 (no silent regression).** A successor restored from an earlier
checkpoint must be told, in `firstActions`, that it is behind and what interval was
dropped. Restoring quietly from stale state and proceeding is a silent-corruption
failure.

**NORMATIVE — CLM-R9 (world reconciliation before fallback work).** Because the
world may hold mutations from the discarded interval, a fallback restoration adds a
**reconciliation gate**: the live `workingTreeDigest` will not match the older
checkpoint's. The successor enters `QUARANTINED`, enumerates the delta, and either
(a) obtains authority to proceed with the world as-is (recording the delta as an
inherited unknown), or (b) escalates. It may **not** discard the delta to force a match.

## 10.5 Restoration Failure ≠ Work Failure

**NORMATIVE — CLM-R10.** A failed restoration does not fail the underlying task,
execution, or review. It fails the *transfer*. The Work Management Layer's task
state is untouched; only an escalation is raised. Conflating the two would burn
retry budget for a problem retries cannot fix.

## 10.6 Authorized Repairs

**NORMATIVE — CLM-R11.** Certain gate failures have safe, bounded repairs
(checkout, dependency reinstall, re-run validation). These are mutations and
therefore need a token, but issuing a full mutation token would defeat the gate. The
resolution: a **scoped repair token** —

- valid for exactly one declared repair operation from a closed allowlist;
- forbidden from touching tracked source content;
- requires the working tree to be clean for destructive repairs;
- expires on first use;
- writes an `Evidence` record;
- re-runs the **full** gate ladder from G1 afterward.

Anything outside the allowlist escalates.

---

# 11. Deliverable 20 — Metrics and Analytics

## 11.1 Principles (NORMATIVE — CLM-T1)

- Metrics are derived from the **append-only event and checkpoint records**, never
  from separately maintained counters that can drift.
- Every metric is reproducible from archived records (§12.7).
- No metric may contain content — only ids, counts, durations, digests.
- Cost is integer basis points; no floats anywhere, including analytics.

## 11.2 Event Vocabulary

Following the `EXECUTION_EVENT_TYPE` / `REVIEW_EVENT_TYPE` pattern in
`lib/dev-hq/constants.ts`:

```ts
const CLM_EVENT_TYPE = {
  sessionStarted:        "clm.session_started",
  decisionMade:          "clm.decision_made",
  checkpointSealed:      "clm.checkpoint_sealed",
  checkpointCorrupt:     "clm.checkpoint_corrupt",
  packetGenerated:       "clm.packet_generated",
  compactionApplied:     "clm.compaction_applied",
  compactionReverted:    "clm.compaction_reverted",
  compactionIneffective: "clm.compaction_ineffective",
  splitProposed:         "clm.split_proposed",
  switchRequired:        "clm.switch_required",
  rolloverStarted:       "clm.rollover_started",
  custodyReserved:       "clm.custody_reserved",
  custodyTransferred:    "clm.custody_transferred",
  restorationStarted:    "clm.restoration_started",
  restorationVerified:   "clm.restoration_verified",
  restorationFailed:     "clm.restoration_failed",
  fallbackSelected:      "clm.fallback_selected",
  quarantined:           "clm.quarantined",
  blocked:               "clm.blocked",
  reserveRaised:         "clm.reserve_raised",
  sessionRetired:        "clm.session_retired",
  sessionAbandoned:      "clm.session_abandoned",
} as const;
```

**NORMATIVE — CLM-T2.** One event per accepted transition; **no event for a no-op**
(the ADR-0002 rule). `clm.decision_made` is emitted for `CONTINUE` too — a decision
to do nothing is still a decision and must be auditable.

**NORMATIVE — CLM-T4 (forward-compatible correlation fields).** Phase 2 §7.2 warns that
canonical-event-model ADR #12 *"should be approved before 2A-1 emits its first event…
otherwise 2A/2B/2C/2D events need re-vocabularization"*. The CLM emits before that ADR
exists and would inherit the same re-vocabularization cost. To avoid it, **every CLM event
carries the §7.4 correlation field set from day one**, even where a field is null in Phase 1:

```ts
interface ClmEventCorrelation {
  goalId: string | null;          // null until 2A
  workItemId: string | null;      // null until ADR-0002 E8 WorkItem promotion
  taskId: EntityId;
  executionId: EntityId | null;
  sessionId: string;
  workUnitId: string;
  actorId: EntityId | null;
  authorityGrantId: string | null;
  candidateId: string | null;     // null until 2A
  policyDecisionId: string;       // the (policyVersion, ruleId) that produced this
  custodyEpoch: int;
  scoringVersion: string;
  policyVersion: string;
}
```

This is a cheap insurance premium paid now against a certain future migration, and it is the
single concrete step this spec can take toward P-5 without absorbing 2E's scope.

**NORMATIVE — CLM-T5 (context-attributed failure flag).** Mission Control UX CX-4 identifies
the highest-value signal: separating *"the work is hard"* from *"the harness ran out of
room"*. The CLM supplies it as a first-class, **recorded** attribution — never inferred by a
consumer:

```ts
type ContextFailureAttribution =
  | "context_exhausted"        // F-CAPACITY-CRIT reached with no viable rollover
  | "compaction_exhausted"     // reclaim ladder spent; work exceeded the window
  | "restoration_failed"       // transfer failed; see RestorationReport
  | "context_incoherent"       // quarantine timed out
  | "custody_lost"             // ownership conflict
  | "not_context_attributed";  // NORMATIVE default — absence of evidence, not evidence of absence
```

**NORMATIVE — CLM-T6.** The default is `not_context_attributed`. The CLM never guesses.
A timeout with no CLM record attached remains unattributed, and Mission Control must render
it as unattributed — which is the honest answer UX §12.15 rule 6 requires.

## 11.5 What Mission Control May Display (NORMATIVE — CLM-T3)

Checkpoints and continuation packets contain objective text, decision rationale, repository
diffs, and evidence summaries. They are **not browser-safe records**. Sprint 1E already
established the precedent with `PublicReview`, which strips the callback capability from
every browser-readable surface.

**NORMATIVE — CLM-T3.** Consumers read a **`PublicContextHealth` projection**, never a raw
`ContextCheckpoint`, `ContinuationPacket`, `ContextHealthSnapshot`, span set, or removal
ledger.

```ts
interface PublicContextHealth {
  executionId: EntityId;
  sessionId: string;
  band: ContextBand;                     // §4.7
  bandPolicyVersion: string;
  bandProvisional: boolean;              // CLM-S10
  tokensUsed: int | null;                // null ⇒ "limit unknown" per CX-1
  contextLimitTokens: int | null;
  overallScore: int | null;
  sampledAt: IsoTimestamp;
  sampleIntervalMs: int;                 // CX-5
  measured: boolean;                     // false ⇒ excluded from any count (CX-6)
  compactionCount: int;
  lastCheckpointId: string | null;
  lastCheckpointSealedAt: IsoTimestamp | null;
  lastCheckpointVerified: boolean;
  lastRestorationOutcome: "verified" | "failed" | "indeterminate" | null;
  failureAttribution: ContextFailureAttribution;
  lifecycleState: SessionState;
  decisionRuleId: string | null;         // auditability: WHY the band is what it is
}
```

**Permitted for display:** every field above; compaction events with timestamp and reclaimed
token count; checkpoint existence, seal time, and verification status; restoration outcome
and the failing gate id; escalation ids.

**Forbidden for display (NORMATIVE):**

| Forbidden | Why |
| --- | --- |
| Raw span content, removal-ledger content, diff or objective text from a checkpoint | May contain repository content and is not access-controlled at the view layer (INV-7 adjacency) |
| Any consumer-computed band or threshold | UX §12.15 rule 3; a UI-chosen threshold is a fabricated verdict |
| A fleet-wide verdict averaging `measured: false` sessions | CLM-S7; UX §12.15 rule 4 |
| Projected time-to-exhaustion as state | UX §12.15 rule 5. The CLM emits **no** projection field; `projectedNextStepTokens` is an internal scoring input and is deliberately absent from the projection |
| Duration, attempt count, or token-less usage as a context measure | UX §12.15 rule 2 |
| A `safe` band past its sampling interval | Must render `stale` (CLM-S8) |
| Any mutation of context state from a view | UX §12.7; the CLM exposes no consumer-facing mutation surface at all |

**NORMATIVE — CLM-T7 (absence is a value).** When no probe exists for an execution, the CLM
emits `measured: false` with `band: "not_measured"`. It never omits the record and never
substitutes a default. This is what allows View 12's dark state to be **driven by data**
rather than hardcoded, and it is what lets that view light up without a redesign.

## 11.3 Metric Catalogue

### Continuity (the metrics that matter most)

| Metric | Definition | Target (DEFAULT) |
| --- | --- | --- |
| `restoration_success_rate` | verified / attempted restorations | ≥ 99% |
| `first_attempt_restoration_rate` | verified on attempt 1 / attempted | ≥ 95% |
| `constraint_preservation_rate` | rollovers where G8 constraint counts held / rollovers | **100%** — any breach is a defect |
| `rework_rate` | successor sessions that re-attempted a documented rejected approach / rollovers | **0%** |
| `duplicate_owner_incidents` | detected simultaneous owners | **0** — absolute |
| `orphaned_work_incidents` | work with neither owner nor open escalation | **0** — absolute |
| `fallback_depth_distribution` | histogram of `MAX_FALLBACK_DEPTH` usage | p95 = 0 |
| `handoff_latency_ms` | `HANDING_OFF` → successor `ACTIVE` | p95 < 120s |

### Context economy

| Metric | Definition |
| --- | --- |
| `compaction_gain_points` | capacity points recovered per compaction (p50/p95) |
| `compaction_effectiveness_rate` | effective / total compactions |
| `tokens_reclaimed_by_reason` | grouped by `RemovalReason` |
| `ballast_ratio` | ballast tokens / used tokens, sampled per probe |
| `useful_work_ratio` | tokens in `CRITICAL`+`HIGH` spans / used tokens |
| `turns_per_session` / `mutations_per_session` | |
| `context_cost_per_objective_bp` | cost basis points per satisfied acceptance criterion |

### Safety and quality

| Metric | Definition | Target |
| --- | --- | --- |
| `blocked_rate` | blocked sessions / sessions | tracked, not minimized |
| `false_block_rate` | blocks later found unnecessary / blocks | ≤ 5% |
| `quarantine_resolution_rate` | quarantines resolved without escalation | tracked |
| `contradiction_detection_lead_turns` | turns between contradiction entering context and detection | p95 ≤ 1 |
| `inherited_evidence_miscitation` | successor citing inherited validation as its own | **0** — absolute |
| `checkpoint_seal_failure_rate` | corrupt/failed seals / attempts | ≤ 0.1% |
| `scoring_replay_divergence` | archived decisions that fail byte-identical replay | **0** — absolute |

### Decision analytics

`decision_mix` (share by action), `rule_fire_counts` (by `ruleId`),
`hysteresis_suppressions`, `time_in_state` (by state), `decision_reversal_rate`
(a decision reversed within `HYSTERESIS_TURNS` — a tuning smell).

## 11.4 Evidence Integration

Every sealed checkpoint, restoration report, and compaction plan produces an
`Evidence` record (`types/domain/evidence.ts`) with a stable URI, using the
`ensureEvidence` URI-keyed atomic creation already shipped in Sprint 1E so replay
cannot duplicate it.

---

# 12. Invariants

Each invariant has an id, a normative statement, an enforcement mechanism, a
detection method, and the response to violation. **An invariant without a detector
is a wish.**

## 12.1 INV-1 — No mutable work before verified restoration

> A successor session may not perform any mutable work until its restoration has
> been verified.

- **Enforcement:** `ACTIVE` is the only mutable state (CLM-M1); entry to `ACTIVE`
  from `VERIFYING` requires `restorationVerified == true`; every mutation site
  checks the token (CLM-C7).
- **Detection:** any mutation event whose session was not `ACTIVE`, or whose
  `RestorationReport.restorationVerified` is not true, at the mutation's timestamp.
- **Response:** halt, `BLOCKED`, escalate at highest severity, enumerate mutations
  performed without verification for human reconciliation.

## 12.2 INV-2 — Rollover cannot produce two active owners

> At no instant may two sessions hold custody of the same work unit.

- **Enforcement:** single custody record; atomic CAS on `(ownerSessionId, custodyEpoch)`
  (CLM-C8); token revoked before successor creation and issued only after the CAS
  commits (CLM-D15); reserve-before-create (CLM-C9); epoch checked at every
  mutation site, not only at state entry.
- **Detection:** two sessions holding tokens for one `workUnitId` with equal epoch;
  any mutation presenting a stale epoch; more than one `clm.custody_transferred`
  per epoch.
- **Response:** the stale-epoch holder is forcibly terminated; **all** its mutations
  since the transfer are enumerated; escalate as a data-integrity incident.
- **Note:** this invariant is why `SPLIT` does not transfer ownership (CLM-D10) and
  why `FAILED_RESTORATION` never holds custody (CLM-M3).

## 12.3 INV-3 — Continuation packets preserve negative scope and rejected approaches

> A continuation packet must carry the complete negative scope and the complete set
> of rejected approaches, verbatim.

- **Enforcement:** `CRITICAL` relevance class (never compacted, CLM-K2/X7);
  monotonic non-shrinking across the chain (CLM-K6); verbatim copy at generation
  (CLM-G3); generation fails rather than truncates (CLM-G2).
- **Detection:** at generation, `|packet.constraints.X| == |checkpoint.X|` and
  per-item hash equality; at restoration, gate G8 compares counts and item hashes
  against the source checkpoint; chain audit asserts non-shrinking across all
  sequences.
- **Response:** generation failure ⇒ rollover halts (never hands off a lossy
  packet). Detection at restoration ⇒ hard fail, regenerate, escalate as
  `F-PKT-SCOPESHRINK` regardless of whether regeneration succeeds.
- **Canonicalization (supporting rule):** hashes are computed over UTF-8 NFC bytes,
  LF newlines, lexicographic key order, arrays in declared order, integers
  base-10, no floats, no trailing whitespace. `canonicalizationVersion` is part of
  every hash's meaning.

## 12.4 INV-4 — Full world verification before work resumes

> Repository identity, branch, HEAD, diff, tests, authority, dependencies, and
> environment must each be verified before mutable work resumes.

- **Enforcement:** gates G3–G9 are mandatory, ordered, and non-skippable; the
  ladder halts on the first hard failure; every gate re-measures the world (CLM-R2).
- **Detection:** a `RestorationReport` reaching `verified` with any of G3–G9 marked
  `skipped`; a mutation token issued without a complete report; a report whose
  `observed` values were copied rather than measured (detectable by requiring each
  gate to record a fresh measurement timestamp and source command).
- **Response:** revoke token, `BLOCKED`, escalate; treat any work performed as
  unverified and enumerate it.
- **Coverage map:** identity→G3, branch→G4, HEAD→G5, diff→G6, tests→G7,
  authority→G8, dependencies→G9, environment→G9.

## 12.5 INV-5 — Missing or contradictory context blocks unsafe continuation

> Missing or contradictory context must block continuation that would be unsafe.

- **Enforcement:** `F-DEGRADED` forbids `CONTINUE` on any snapshot with
  `missingInputs` (CLM-D3.1); `F-COHERENCE`/`F-REFERENCE` route to `QUARANTINED`;
  no coin-flip resolution (CLM-U2); packet incompleteness fails generation (CLM-G2);
  G2 fails restoration on missing sections.
- **Detection:** a `CONTINUE` decision archived against a degraded snapshot; a
  mutation performed while `loadBearingContradictionCount ≥ 1`; a resolved
  contradiction with no re-measurement and no authority record.
- **Response:** `BLOCKED`; the resolution must show either a re-measurement or an
  authority decision (CLM-B3 forbids self-authorization).

## 12.6 Supporting Invariants

| Id | Statement | Enforcement |
| --- | --- | --- |
| INV-6 | Sealed checkpoints are never mutated | Append-only store; hash chain; corrections are new checkpoints (CLM-C1) |
| INV-7 | No secret values in any CLM record | Pre-seal scanner; env keys stored as name+presence only (CLM-K3) |
| INV-8 | Decisions are replayable byte-for-byte | Pure functions, integer math, versioned policy, archived snapshots (CLM-P4/S4) |
| INV-9 | Inherited validation is never reported as self-performed | `performedByThisSession` flag; G7 staleness; metric target 0 (CLM-G4) |
| INV-10 | Compaction conserves typed assertions | Post-compaction verification with revert (CLM-X2/X3) |
| INV-11 | Work always has an owner or an open escalation | Custody release checks (CLM-C10) |
| INV-12 | Every state transition emits exactly one idempotent event | Keyed on `(sessionId, from, to, transitionSeq)` (CLM-M4) |

## 12.7 Replayability (supports INV-8)

Every archived decision stores `(snapshot, scoringVersion, policyVersion,
costTableVersion, score, decision)`. A replay harness re-runs the pure pipeline over
the archived snapshot and asserts byte equality. This runs in CI over a corpus of
archived decisions; divergence is a release blocker.

---

# 13. Integration With Existing Savrio Subsystems

*(Existing systems — verified against the repository at `357f03b`. Section 14 covers planned
systems: Sprints 1F–1I and Phase 2.)*

## 13.1 Work Management Layer (ADR-0001 / ADR-0002)

| CLM concept | Existing counterpart | Relationship |
| --- | --- | --- |
| `WorkCustody` | `AgentAssignment` lease | Same discipline (one holder, expiry, explicit release). **Open item OI-2:** whether custody is a new record or an extension of `AgentAssignment`. Recommendation: **separate record** — assignment owns *agent↔execution*; custody owns *session↔work-unit*, and they have different lifetimes. |
| Reserve-before-create | `Escalation.revisionExecutionId` | Directly modeled on it |
| Checkpoint/report evidence | `Evidence` + `ensureEvidence` | Reuse as-is; URI-keyed atomic creation prevents replay duplication |
| CLM events | `Event` | Reuse; `entityType` needs a new member (`"session"`) — **additive change, requires ADR amendment (OI-3)** |
| Blocked/quarantine escalation | `Escalation` | Reuse; `EscalationOrigin` needs new members (`context_blocked`, `restoration_failed`, `custody_conflict`, `split_proposed`, `no_capable_provider`) — **additive change, requires ADR amendment (OI-3)** |
| Provider switch | `ExecutionRouting.provider` | The pin must be updated on switch (CLM-D14) |
| Retry budgets | `MAX_EXECUTION_ATTEMPTS`, `MAX_REVIEW_ITERATIONS` | CLM budgets are **independent counters** and must never be conflated — the same separation ADR-0002 draws between retry and review budgets |

**NORMATIVE — CLM-N1.** CLM budgets (`MAX_RESTORATION_ATTEMPTS`,
`MAX_FALLBACK_DEPTH`, `MAX_COMPACTIONS_PER_SESSION`) never consume execution retry
attempts or review iterations. A restoration failure is a transfer failure, not a
work failure (CLM-R10).

## 13.2 Trigger.dev

Rollover and restoration are durable operations and map naturally onto the existing
durable-task pattern (`trigger/agent-execution.ts`, `trigger/execution-sweeper.ts`).
A scheduled **custody sweeper** — analogous to `execution-sweeper` — reclaims expired
successor reservations and detects `HANDING_OFF` sessions past their handoff deadline.

## 13.3 Governance

Escalations follow AGENT-001's required content (blocker, facts, impact, options,
recommendation, decision owner). Split proposals are scope decisions and route to
the founder unless they are strict partitions (CLM-D11).

---

# 14. Integration Dependencies — Sprints 1F, 1G, 1H, 1I and Phase 2

**Status change from v1.0.0.** This section was previously left unwritten because 1G, 1H,
and 1I were undefined in the repository. Phase 2 precondition **P-5** now defines them. This
section is written against the recorded scope and contains **no inferred sprint content**.

## 14.0 Sprint identities (recorded, not inferred)

| Sprint | Scope, per Phase 2 P-5 | CLM relationship |
| --- | --- | --- |
| **1F** | Mission Control Lite | **Consumer.** Renders CLM output (§11.5) |
| **1G** | Smart Work Packets | **Peer.** Packet content generator; distinct record from the continuation packet (CLM-G5) |
| **1H** | Repository Intelligence + Context Router (incl. foundation hooks for later Company Knowledge Platform retrieval) | **Peer.** Router assembles the working set; CLM governs its lifecycle (CLM-G6) |
| **1I** | Autonomous Engineering Loop with bounded static decomposition | **Consumer.** Long loops outlive sessions and require rollover |
| **CLM** | This spec | Named in P-5 as a distinct Phase 1 deliverable |

## 14.1 Unresolved: which sprint owns the CLM (CONFLICT — Founder decision)

Phase 2 states the CLM's ownership **two different ways**:

- **P-5** (§1.2) lists it as a **distinct deliverable**, coordinate with 1F/1G/1H/1I:
  *"…1I Autonomous Engineering Loop…, Context Lifecycle Manager."*
- **§3.3** (2A dependency table) attributes it to a sprint: *"Context Lifecycle Manager
  **(1G/1H)** | Per-worker checkpointing and rollover; a long organization outlives sessions."*

These cannot both be operative. The distinction matters because it determines sequencing,
the architecture gate that reviews it, and whether 1H's Rank-C research (R-13) blocks CLM
start. **This spec does not resolve it** — sprint assignment is roadmap authority, and
instruction 10 forbids modifying the roadmap.

**Recommendation (labeled as a recommendation, not a decision):** keep the CLM a **distinct
deliverable sequenced between 1G and 1H**. Rationale: 1G's packets are the thing that gets
checkpointed, so the CLM should follow 1G; 1H's Context Router consumes CLM lifecycle
guarantees and R-13 caching strategy feeds CLM cost accounting, so the CLM should precede or
run alongside 1H. Folding it inside 1G or 1H would bury an ADR-grade ownership model inside a
feature sprint. **Decision owner: Founder.**

## 14.2 Sprint 1F — Mission Control Lite (consumer)

### Conflict resolved: D-G / D-H versus I-5

Sprint 1F contains an **internal contradiction** about who designs context health:

- **I-5** (interfaces required from other workstreams): *"If CLM defines context measurement
  and checkpointing, 1F-5 becomes a rendering item over the CLM's records rather than a
  domain-design item. 1F needs the record shape and its availability date; **it should not
  design context health independently**."*
- **D-G / D-H** (enabling work): *"Context health per execution | **New domain fields**"* and
  *"Checkpoint entity | **New domain entity**"*, scoped to 1F-5.

If both stand, 1F designs a context-health model and the CLM designs another — two sources of
truth for one concept, which AGENT-001 prohibits under Documentation Standards.

**Resolution (this spec's position): I-5 governs; D-G and D-H are reclassified.**

| 1F item | v1.0.0 classification | Reconciled classification |
| --- | --- | --- |
| **D-G** Context health per execution | New domain fields | **Rendering + projection wiring** over `PublicContextHealth` (§11.5). No new domain design in 1F |
| **D-H** Checkpoint entity | New domain entity | **`ContextCheckpoint`, owned by the CLM** (CLM-K7). 1F consumes a projection |
| **1F-5** | Domain-design item | **Rendering item**, plus honest-absence behavior when the CLM has not landed |
| **Q-4** context-health half | Open | **Resolved** by this spec's record shape; the *availability date* remains open (§14.7) |
| **Q-4** cost half | Open | **Not resolved here.** Cost instrumentation is unowned (UX RB-1, Q5). The CLM consumes `usage` if it lands; it does not own spend |

**Correction to D-G's stated mechanism.** D-G says context health *"Requires the executing
agent to report context utilization."* Under CLM-I1 that is precisely what is forbidden: an
agent's self-report is not an input. The correct mechanism is that the **session runtime**
supplies a **measured** occupancy figure via the `context-probe`. The distinction is not
pedantic — a self-reported figure is an assessment, a probed figure is a measurement, and only
the second can carry a floor that halts work.

**1F's own dependency, restated honestly.** 1F Q-4 verified that Phase 1 agents are
deterministic simulations that *"consume no tokens, have no context window, and produce no
checkpoints."* The CLM changes nothing about that. Until real providers land (Phase 2 P-8),
the CLM will emit `measured: false` / `band: "not_measured"` for simulated executions, and
View 12 stays dark. **The CLM makes the dark state data-driven; it does not make it light
up.** Any claim that CLM delivery lights up View 12 would be false, and 1F should not plan
against one.

### Interfaces the CLM provides to 1F

| # | Interface | Contract |
| --- | --- | --- |
| **CLM→1F-1** | `PublicContextHealth` projection per execution | §11.5. Includes `measured`, `band`, `bandPolicyVersion`, `bandProvisional`, `sampledAt`, `sampleIntervalMs` |
| **CLM→1F-2** | Safety band vocabulary | §4.7. Seven bands including `not_measured` and `stale`. Satisfies UX CX-2 vocabulary half; thresholds are Founder policy (§4.8) |
| **CLM→1F-3** | Compaction events with timestamps | `clm.compaction_applied` in the existing `Event` shape, timeline-placeable. Satisfies CX-3 |
| **CLM→1F-4** | Context-attributed failure flag | `ContextFailureAttribution`, defaulting to `not_context_attributed`. Satisfies CX-4 |
| **CLM→1F-5** | Sampling interval | `sampleIntervalMs` on every emission. Satisfies CX-5 |
| **CLM→1F-6** | Partial-measurement semantics | `measured: false` excluded from counts; CLM emits no aggregate. Satisfies CX-6 |
| **CLM→1F-7** | Checkpoint projection | Existence, seal time, verification status, sequence. Never contents |
| **CLM→1F-8** | Restoration outcome | Verified / failed / indeterminate plus failing gate id |

### Interfaces the CLM requires from 1F

| # | Interface | Needed for |
| --- | --- | --- |
| **1F→CLM-1** | Execution timeline read-model (1F-1, provided interface I-7) | Placing CLM events in the immutable timeline. The CLM does **not** build its own timeline |
| **1F→CLM-2** | Persistence/deployment decision (Q-1, ADR-0003) | CLM-C11 persistence floor. **Hard prerequisite for enforcing mode** |
| **1F→CLM-3** | `AgentAssignment` exposure decision (D-A, UX SF-2) | Custody's relationship to assignment (OI-2) |

## 14.3 Sprint 1G — Smart Work Packets (peer)

| # | Boundary | Position |
| --- | --- | --- |
| **1G-B1** | Work packet vs continuation packet | **Distinct records** (CLM-G5). The CLM references a work packet by id + version; it never generates or inlines packet content |
| **1G-B2** | Packet content is `CRITICAL` context | A work packet's objective, scope, and constraints enter the span set as `objective` / `negative_scope` spans and are never compacted (CLM-K2) |
| **1G-B3** | Packet mutation during a session | If the referenced packet version changes mid-session, that is a **typed contradiction** on `packet.version`, surfaced per §9.10 — not silently adopted |
| **1G-B4** | Packet sizing | 1G/2A own packet sizing. The CLM reports that remaining work exceeds a window (`D5.split.projected-overflow`); it does not size packets |

**Required from 1G:** a stable packet id and monotonic version, and a declaration of which
packet fields are negative scope so the CLM can classify them as `CRITICAL` without parsing
prose. Without the second, the CLM can still function but negative-scope preservation
degrades from structural to best-effort — a material weakening of INV-3, and the single most
important thing 1G can do for the CLM.

## 14.4 Sprint 1H — Repository Intelligence + Context Router (peer)

| # | Boundary | Position |
| --- | --- | --- |
| **1H-B1** | Router = admission; CLM = tenure and eviction | CLM-G6. The Router decides what enters a working set; the CLM decides what stays, what is pruned, and when the session ends |
| **1H-B2** | Relevance is two different things | Router relevance is **retrieval ranking** (may be semantic, may be non-deterministic). CLM relevance is **retention class** (deterministic rule table, §9.3). These must not be unified — a non-deterministic input to retention would destroy replayability (INV-8) |
| **1H-B3** | No re-assembly on restoration | The CLM replays the recorded working set and never re-invokes the Router (CLM-G6). A reassembled context is a different context |
| **1H-B4** | Repository Intelligence is not a CLM dependency | The CLM's `repositoryState` uses **git facts only** (fingerprint, HEAD, diff, lockfiles). This keeps the CLM shippable independent of 1H. 1H may *consume* checkpoint repository state; the CLM does not consume 1H's graph |
| **1H-B5** | Least privilege | The Router enforces least-privilege context assembly. The CLM must not widen it: compaction only ever **removes**, and restoration replays what was recorded. The CLM has no mechanism to add context, by construction |

**Required from 1H:** the working-set manifest the Router produced (ids + version), recorded
in the checkpoint so a restoration can prove it replayed the same set.

**Research dependency (R-13, Rank C — due before 1H).** Context caching strategy is
unresolved. Its outcome feeds `ProviderContextProfile.caching` (CLM-D16) and the
occupancy-versus-cost separation (CLM-D17). The CLM is **not blocked** by R-13 — it ships
with `caching: null` and performs no caching-aware behavior — but the cost metrics in §11.3
will under-report savings until R-13 lands. Research backlog correctly anchors R-13 to "1H
Context Router + Context Lifecycle Manager".

**R-13's own note is accepted:** *"the vocabulary for measuring context should be agreed
before 1H consumes it."* §3 and §4.7 are that vocabulary.

## 14.5 Sprint 1I — Autonomous Engineering Loop (consumer)

| # | Boundary | Position |
| --- | --- | --- |
| **1I-B1** | Loop continuity | A bounded autonomous loop outlives a context window. Rollover (§5.8) is the mechanism |
| **1I-B2** | **G13-LOOP gate** | The loop's iteration counter and decomposition budget must be verified unchanged across a rollover (CLM-R12). Without it, a rollover silently resets a bounded loop into an unbounded one — the most dangerous failure this pairing can produce |
| **1I-B3** | Budget separation | Loop iteration budget, execution retry budget, review iteration budget, and CLM restoration/fallback budgets are **four independent counters** and are never conflated (CLM-N1) |
| **1I-B4** | Decomposition ownership | 1I owns bounded static decomposition. The CLM's `SPLIT` (§5.6) **proposes** a partition and escalates unless it is a strict partition of approved criteria (CLM-D11). Where 1I is present, the CLM should defer to 1I's decomposition and emit only the capacity signal |

**Recommendation:** when 1I exists, disable `D5.split.*` in the CLM decision ladder by policy
and let the CLM emit `capacity_exceeded_for_remaining_work` for 1I to act on. Two
decomposition authorities in one system is a defect waiting to happen. **Decision owner:
Founder**, at 1I planning time.

## 14.6 Phase 2 (downstream consumers)

| Stage | Consumption | CLM position |
| --- | --- | --- |
| **2A** Temporary Organizations | §3.9: *"Restoration verification (CLM) must pass before a resumed packet mutates"* | **Confirmed satisfied by INV-1.** Requires **G12-PACKET** (CLM-R12). No change to the 2A plan |
| **2A** | §3.9: *"a packet that cannot be classified as success or failure enters the 1E uncertain state"* | Aligned with §9.10. The CLM's `QUARANTINED` state and 1E's uncertain state must be **reconciled into one vocabulary** — flagged as an open question (§14.8 OQ-C3) |
| **2E** Engineering Intelligence | §7.3: *"Context Lifecycle Manager \| Context quality metrics (§6 context analytics)"* | The CLM is an **ingestion source**, not an analytics engine. It emits per-session records; 2E aggregates, trends, and detects anomalies. The CLM computes **no** trend, forecast, or cross-session rollup |
| **2E** | §7.4 Canonical Event Model, correlation fields | CLM-T4 carries them from day one to avoid re-vocabularization |
| **2E** | Health Score Engine: *"computed deterministically from recorded inputs and a versioned weighting set"* | Same pattern as §4. The CLM's score is an **input** to 2E's scores, never a substitute |
| **2H** Model Management | §0.4 model neutrality; `RoutingPolicyBinding` | CLM-D16/D19. The CLM emits `SwitchRequirement`; 2H decides bindings |
| **2I** Research | §11: *"must survive session boundaries via CLM"*; *"Session exhaustion mid-research: CLM checkpoint and rollover"* | Standard consumer. No new gate |
| **2J** Pair Engineering | §12: `EditCheckpoint`, J11 rollover safety | **G11-PAIR** gate (CLM-R12) and the `ContextCheckpoint` naming separation (CLM-K7) |
| **2F/2G** | Session participants, rollover | §2240: *"CLM rollover applies to session participants"* — multi-participant custody is **out of scope for v1.1** and flagged (§14.8 OQ-C4) |

**Phase 2 §17 security requirement accepted verbatim:** *"No raw provider keys in prompts,
logs, **checkpoints**, or artifacts."* This is already INV-7 / CLM-K3, with a pre-seal
scanner and a planted-secret test (AC-16, ADV-18). Recorded as agreement, not new scope.

## 14.7 Sequencing and availability

| Prerequisite | Source | Blocks |
| --- | --- | --- |
| Durable, append-only store with linearizable CAS | CLM-C11; 1F Q-1/ADR-0003; Phase 2 P-1 | **CLM enforcing mode.** Shadow mode is unblocked |
| Real providers behind `AgentProvider` | Phase 2 P-8; ADR-0001 D4 | Any **non-zero** context measurement. Simulated agents have no context window |
| `usage` populated (`agent-execution-service.ts:81` writes `usage: null`) | UX finding I2; 1F D-D | Token occupancy input. **Same single blocking point as cost** |
| P-4 `ModelResolver` indirection | Phase 2 P-4 | `ProviderContextProfile` resolution (CLM-D16) |
| Event `entityType: "session"`; new `EscalationOrigin` members | §13.1, OI-3 | Event and escalation emission |
| Timeline read-model (1F-1) | 1F I-7; Phase 2 P-6 | Timeline placement of CLM events |
| R-13 context caching strategy | Research backlog, Rank C | Caching-aware cost accounting only. **Not** a CLM blocker |

**Honest availability statement for 1F planning (answers I-5's "availability date"
request):** the CLM record shape is available **now** — this document. A CLM that emits
*measured* values is gated on real providers (P-8, Phase 2) and populated `usage`. A CLM that
*enforces* is gated on durable persistence (ADR-0003 / P-1). **1F should plan 1F-5 as a
rendering item against the §11.5 projection, shipping the honest-absence path first.** That
path is correct regardless of when the CLM lands, and it is exactly what UX View 12 already
specifies.

## 14.8 Open Ownership Questions

| # | Question | Owner | Blocks |
| --- | --- | --- | --- |
| **OQ-C1** | Which sprint owns the CLM (P-5 standalone vs §3.3 "1G/1H")? | **Founder** | CLM sequencing and its architecture gate |
| **OQ-C2** | Are CLM band thresholds Founder policy (§4.8) or CLM-owned (UX CX-2 as written)? | **Founder / Director of Operations** | Whether any band may render non-provisional |
| **OQ-C3** | Is the CLM's `QUARANTINED` the same state as 1E's / 2A's "uncertain"? One vocabulary or two? | Lead Engineer + Architecture Reviewer | Status vocabulary consistency; UX FI-3 |
| **OQ-C4** | Multi-participant sessions (Phase 2 2F/2G) — can one work unit have multiple concurrent participants under one custody? | **Founder** | Whether INV-2 needs a multi-holder model. **Out of scope for v1.1** |
| **OQ-C5** | Does custody extend `AgentAssignment` or stand alone? (was OI-2) | Architecture Reviewer | Domain design |
| **OQ-C6** | When 1I lands, does the CLM stop proposing splits? | **Founder** at 1I planning | Decomposition authority |
| **OQ-C7** | Who owns cost instrumentation? (UX RB-1/Q5, 1F Q-4 cost half) | **Founder / Director of Operations** | §11 cost metrics. **Not a CLM claim** |

## 14.9 Open Items Requiring Decision (carried from v1.0.0, updated)

| Id | Item | Status at v1.1.0 |
| --- | --- | --- |
| OI-1 | Scoring constants uncalibrated | **Open.** Reframed as §4.8 policy ownership + §20 provisional register. Shadow mode remains the recommendation |
| OI-2 | Custody vs `AgentAssignment` | **Open** → now OQ-C5 |
| OI-3 | Additive `EscalationOrigin` / `EventEntityType` members | **Open.** ADR-0002 amendment. Note ADR-0002 E5 already has a pending amendment carried from 1E |
| OI-4 | Structural-only contradiction detection | **Open.** Accept for v1; measured by `contradiction_detection_lead_turns` |
| OI-5 | Persistence backend | **Escalated.** Now normative as CLM-C11 and cross-referenced to 1F Q-1/ADR-0003 and Phase 2 P-1 |
| OI-6 | Autonomous split authority | **Open** → refined by OQ-C6 |
| OI-7 | Span enumeration dependency (A-1) | **Open.** Now compounded: simulated agents have no spans at all, so this cannot be validated until P-8 |

---

# 14A. Provisional Defaults Register

**NORMATIVE — CLM-S10 applies to every value in this register.** None is approved. None may
be presented to a Founder as a governed verdict. Every band derived from them carries
`provisional: true`.

| Constant | Provisional value | §  | Effect if wrong | Approval owner |
| --- | --- | --- | --- | --- |
| Weight table (capacity 30, coherence 20, progress 15, redundancy 10, freshness 10, durability 10, provider 5) | as listed | 4.3 | Mis-prioritized lifecycle actions | Founder |
| `CONTINUE_MIN_OVERALL` | 60 | 5.3 | Too high ⇒ needless churn; too low ⇒ degraded work continues | Founder |
| `CONTINUE_HYSTERESIS` / `HYSTERESIS_TURNS` | 8 / 3 | 5.3 | Oscillation | Lead Engineer |
| `F-CAPACITY-LOW` threshold | capacity < 25 | 4.5 | Late compaction | Founder |
| `F-COHERENCE` / `F-REFERENCE` | ≥1 / ≥3 | 4.5 | False quarantine or missed incoherence | Founder |
| `PROGRESS_WINDOW_TURNS` / `PROGRESS_STALL_CALLS` | 12 / 8 | 4.4 | Stall detection sensitivity | Lead Engineer |
| `MIN_COMPACTION_GAIN` | 15 | 4.4 | Compaction treadmill | Lead Engineer |
| `MAX_COMPACTIONS_PER_SESSION` / `MAX_INEFFECTIVE_COMPACTIONS` | 3 / 2 | 4.4 | Premature or delayed rollover | Founder |
| `CHECKPOINT_TURN_INTERVAL` / `CHECKPOINT_MUTATION_INTERVAL` | 20 / 5 | 4.4 | Checkpoint density vs cost | Founder |
| `COMPACT_MIN_RECLAIM` | max(4000, limit/40) | 5.4 | Wasted compaction | Lead Engineer |
| `SPLIT_OBJECTIVE_THRESHOLD` | 6 | 5.6 | Over/under splitting | Founder |
| `SWITCH_WAIT_TOLERANCE_MS` / `SWITCH_DEGRADED_TURNS` | 300000 / 3 | 5.7 | Premature provider churn | Founder |
| `MAX_SESSION_TURNS` | 400 | 5.8 | Session longevity | Founder |
| `MAX_SEAL_ATTEMPTS` | 2 | 7.1 | Block sensitivity | Lead Engineer |
| `MAX_RESTORATION_ATTEMPTS` / `MAX_FALLBACK_DEPTH` | 2 / 3 | 10.3 | Recovery persistence vs stall | Founder |
| `MAX_QUARANTINE_TURNS` / `MAX_QUARANTINE_MS` | 10 / 30 min | 9.10 | Uncertainty tolerance | Founder |
| `RELEVANCE_PROPAGATION_DEPTH` | 2 | 9.3 | Over/under retention | Lead Engineer |
| `CONTEXT_SAMPLE_INTERVAL_MS` | **unset** | 4.7 | Staleness rendering. **Must be set before any band is emitted** | Founder |
| Band boundaries (`safe`/`elevated`/`critical`) | derived from floors above | 4.7 | **Directly determines when work halts** | **Founder — highest sensitivity** |
| Metric targets in §11.3 | as listed | 11.3 | Release-gate strictness | Founder |
| Declared cost table (§3.8) | not populated | 3.8 | Under-projection strands sessions | Lead Engineer + calibration |

**Two values are not provisional and are not negotiable**, because they are invariants rather
than thresholds: the absolute-zero metrics of §11.3 (`duplicate_owner_incidents`,
`orphaned_work_incidents`, `inherited_evidence_miscitation`, `scoring_replay_divergence`) and
the constraint-preservation rate of 100%. A threshold decides tolerance; these decide
correctness.

# 15. Failure Taxonomy

Codes are stable and enter events, escalations, and metrics.

## 15.1 Severity Ladder

| Severity | Meaning | Default response |
| --- | --- | --- |
| **S0 Catastrophic** | An invariant was violated; the world may be inconsistent | Halt all sessions on the work unit, escalate immediately, enumerate mutations for human reconciliation |
| **S1 Critical** | Work cannot safely continue | `BLOCKED` + escalation |
| **S2 Major** | Continuation unsafe without resolution | `QUARANTINED` + bounded resolution |
| **S3 Minor** | Degraded but bounded | Recorded; automatic recovery |
| **S4 Informational** | Expected operational event | Metric only |

## 15.2 Taxonomy

### Input / Probe (`F-IN-*`)

| Code | Failure | Sev | Response |
| --- | --- | --- | --- |
| F-IN-01 | Snapshot incomplete (`missingInputs`) | S2 | No `CONTINUE`; re-probe; persist ⇒ quarantine |
| F-IN-02 | Span enumeration unavailable | S2 | Degrade to coarse granularity; disable span-level compaction; record |
| F-IN-03 | Token accounting disagrees with provider | S2 | Trust the **larger** figure; raise safety reserve |
| F-IN-04 | Cost table version unknown | S1 | Block — projections would be meaningless |
| F-IN-05 | Clock skew beyond tolerance | S3 | Use monotonic turn counts; mark durations unreliable |

### Scoring / Decision (`F-DEC-*`)

| Code | Failure | Sev | Response |
| --- | --- | --- | --- |
| F-DEC-01 | Scoring replay divergence | S0 | Halt; release blocker; INV-8 violated |
| F-DEC-02 | Policy version mismatch mid-session | S1 | Block; a session must not change decision policy mid-flight |
| F-DEC-03 | Decision oscillation beyond hysteresis | S2 | Force `CHECKPOINT` then `ROLLOVER`; flag tuning defect |
| F-DEC-04 | No rule matched (impossible if total) | S0 | Block; total-function violation |

### Checkpoint (`F-CKPT-*`)

| Code | Failure | Sev | Response |
| --- | --- | --- | --- |
| F-CKPT-01 | Seal write failed | S1 | Retry to `MAX_SEAL_ATTEMPTS`, then block |
| F-CKPT-02 | Self-verification hash mismatch | S1 | Mark corrupt; never use; retry once; then block |
| F-CKPT-03 | Chain break (parent unverifiable) | S1 | Fall back to last verifiable ancestor; escalate |
| F-CKPT-04 | Required group missing | S1 | Block; incomplete checkpoints are worse than none |
| F-CKPT-05 | Insufficient tokens to emit | S0 | Emergency minimal checkpoint (`CRITICAL` groups only), then block; raise reserve (CLM-C6) |
| F-SEC-01 | Secret value detected pre-seal | S0 | Abort seal; purge; escalate as a security incident (INV-7) |

### Packet (`F-PKT-*`)

| Code | Failure | Sev | Response |
| --- | --- | --- | --- |
| F-PKT-01 | Hash mismatch | S1 | Regenerate from checkpoint |
| F-PKT-INCOMPLETE | Required section absent | S1 | Regenerate; then fall back |
| F-PKT-SCOPESHRINK | Constraint list shrank | S0 | **INV-3 violation**; halt rollover; regenerate; escalate regardless |
| F-PKT-04 | Source checkpoint corrupt | S1 | Fall back (§10.4) |

### Compaction (`F-CMP-*`)

| Code | Failure | Sev | Response |
| --- | --- | --- | --- |
| F-CMP-01 | Assertion conservation violated | S1 | Revert; disable compaction for the session; rollover instead |
| F-CMP-02 | Dangling reference produced | S1 | Revert |
| F-CMP-03 | `CRITICAL` span targeted for removal | S0 | Reject plan; **defect in the compactor**; escalate |
| F-CMP-04 | Ineffective (gain < threshold) | S3 | Count; two consecutive ⇒ rollover |
| F-CMP-05 | Revert impossible | S0 | `FAILED_RESTORATION`; restore from last checkpoint |
| F-CMP-06 | Target unreachable without touching `HIGH` | S3 | Stop at `MEDIUM`; escalate decision to `ROLLOVER` |

### Restoration / Environment (`F-ENV-*`, `F-AUTH-*`, `F-EVD-*`)

| Code | Failure | Sev | Response |
| --- | --- | --- | --- |
| F-ENV-WRONGREPO | Repository identity mismatch (G3) | S0 | Never auto-repair; halt; escalate |
| F-ENV-BRANCH | Branch mismatch (G4) | S1 | Authorized repair if clean and non-destructive; else escalate |
| F-ENV-HEAD | HEAD moved (G5) | S1 | Fast-forward containing expected ⇒ quarantine + re-validate; divergent ⇒ escalate |
| F-ENV-DIFF | Working-tree delta unexplained (G6) | S1 | Escalate |
| F-ENV-DEPS | Lockfile/env mismatch (G9) | S1 | Authorized reinstall; lockfile itself differs ⇒ escalate |
| F-ENV-MISSINGKEY | Required env key absent (G9) | S1 | Block; never fabricate |
| F-EVD-STALE | Inherited validation invalid for current state (G7) | S2 | Mark stale; re-run under repair token; never cite as current |
| F-AUTH-EXPIRED | Authority expired (G8) | S1 | Block; escalate; never self-extend |
| F-AUTH-ROLE | Successor role ≠ `handoffRole` | S1 | Block; escalate |

### Ownership (`F-OWN-*`)

| Code | Failure | Sev | Response |
| --- | --- | --- | --- |
| F-OWN-01 | Custody CAS lost | S1 | Successor terminates cleanly; **never retry** |
| F-OWN-02 | Stale epoch presented at a mutation site | S0 | **INV-2 risk**; halt writer; enumerate its mutations; escalate |
| F-OWN-03 | Reservation expired before successor creation | S3 | Predecessor re-reserves (idempotent) or sweeper recovers |
| F-OWN-04 | Two active owners detected | S0 | INV-2 violated; halt both; full reconciliation; incident |
| F-OWN-05 | Custody released with work incomplete and no successor | S1 | Escalate (INV-11) |
| F-OWN-06 | Predecessor resurrection attempt after transfer | S2 | Reject via epoch; force terminal state; record |

### Lifecycle (`F-LC-*`)

| Code | Failure | Sev | Response |
| --- | --- | --- | --- |
| F-LC-01 | Handoff deadline exceeded | S2 | Sweeper → `RECOVERING`; retry successor once; then abandon + escalate |
| F-LC-02 | Quarantine timeout | S1 | `BLOCKED` + escalate |
| F-LC-03 | Fallback depth exhausted | S1 | `BLOCKED` + escalate |
| F-LC-04 | Session terminated without checkpoint | S1 | Sweeper detects; last sealed checkpoint becomes head; enumerate unrecorded interval |
| F-LC-05 | Split units with overlapping footprints | S1 | Reject plan (CLM-D9) |
| F-LC-06 | No capable provider for required switch | S1 | Block; escalate |

---

# 16. Acceptance Criteria and Test Strategy

## 16.1 Acceptance Criteria

Each is objectively checkable. `AC-*` map to deliverables and invariants.

**Inputs and scoring**

- **AC-01** — A `ContextHealthSnapshot` populates every field of §3.3–3.8 or names
  the missing field in `missingInputs`. No field is ever silently defaulted.
- **AC-02** — `health-scorer` is pure: given an archived snapshot it produces a
  byte-identical `HealthScore` on any machine, any OS, any run.
- **AC-03** — The scorer uses no floating-point arithmetic. Verified by static check.
- **AC-04** — Every degradation signal is monotone in its dimension (property test).
- **AC-05** — Every floor in §4.5 has a test that trips it in isolation and asserts
  the mandated consequence.

**Decisions**

- **AC-06** — `decision-engine` is total: a fuzz corpus of ≥ 100k valid snapshots
  produces a decision for every one, with a non-empty `ruleId`.
- **AC-07** — First-match ordering is verified: for each rule, a snapshot exists
  that fires it while a later rule would also match.
- **AC-08** — `CONTINUE` is never produced on a degraded snapshot or with any floor
  breached (exhaustive over the floor set).
- **AC-09** — `SPLIT`/`SWITCH`/`ROLLOVER` always carry `requiresCheckpointFirst`.
- **AC-10** — Hysteresis suppresses oscillation: an adversarial sequence oscillating
  around each threshold produces no more than one action per `HYSTERESIS_TURNS`.
- **AC-11** — Two consecutive ineffective compactions force `ROLLOVER`.
- **AC-12** — A switch target lacking any `requiredCapabilities` is never selected;
  absence of a compliant target yields `BLOCK`, never a degraded switch.

**Checkpoints**

- **AC-13** — A sealed checkpoint cannot be modified; a mutation attempt is rejected
  and detected by chain verification.
- **AC-14** — `checkpointId` is derived; replaying creation yields the same id and
  does not fork the chain.
- **AC-15** — All ten schema groups are present on every non-emergency checkpoint;
  absence fails the seal.
- **AC-16** — No secret value appears in any checkpoint (scanner over a corpus
  containing planted secrets: 100% caught, seal aborted).
- **AC-17** — `objective.statementHash` is stable across a chain absent an
  authorized change record.
- **AC-18** — `outOfScope`, `forbiddenActions`, `rejectedApproaches` never shrink
  across a chain without an authority-stamped removal.
- **AC-19** — A session that cannot afford to emit a checkpoint is a detected
  defect (F-CKPT-05), and the reserve is raised.

**Packets**

- **AC-20** — Packet generation is a pure function of the checkpoint; two runs are
  byte-identical.
- **AC-21** — Generation **fails** rather than truncating any `CRITICAL` content.
- **AC-22** — Constraint lists are verbatim: item-hash equality with the source.
- **AC-23** — Every inherited validation is marked `performedByThisSession: false`.

**Compaction**

- **AC-24** — No compaction removes a `CRITICAL` span. Exhaustive over a corpus;
  any occurrence is an S0 defect.
- **AC-25** — Assertion conservation holds after every compaction, or the compaction
  reverts.
- **AC-26** — No compaction produces a dangling reference.
- **AC-27** — Duplicate removal keeps exactly one instance and rewrites references.
- **AC-28** — Conflicting values are recorded as contradictions, never deduplicated.
- **AC-29** — Stale `CRITICAL` content is retained-and-marked, never deleted.
- **AC-30** — Every removal has a ledger entry; the ledger digest matches the checkpoint.

**Restoration and ownership**

- **AC-31** — No mutation is possible before `restorationVerified` (INV-1), verified
  by attempting a mutation in every non-`ACTIVE` state.
- **AC-32** — Gates G1–G10 run in order; a hard failure stops the ladder and later
  gates are marked `skipped`.
- **AC-33** — Every gate re-measures the world; a gate satisfied by a packet-copied
  value is a detected defect.
- **AC-34** — A `RestorationReport` is written for every attempt, pass or fail.
- **AC-35** — Under concurrent successor creation, exactly one obtains custody
  (INV-2), verified under randomized interleavings.
- **AC-36** — A predecessor presenting a stale epoch cannot mutate.
- **AC-37** — Custody is never held by a session in `FAILED_RESTORATION` or `RECOVERING`.
- **AC-38** — Fallback candidates are ordered deterministically; fallback beyond one
  checkpoint escalates.
- **AC-39** — Fallback enumerates the discarded mutation interval and tells the
  successor it is behind.
- **AC-40** — Restoration failure does not consume execution retry or review budget.

**Uncertain / blocked**

- **AC-41** — In `QUARANTINED`, every mutation attempt is rejected; read-only
  operations succeed.
- **AC-42** — A contradiction on a re-measurable key is resolved by re-measurement;
  on a decision key it escalates. No path resolves by preference or recency.
- **AC-43** — Quarantine is bounded; timeout blocks and escalates.
- **AC-44** — Every block writes a diagnostic checkpoint, raises an escalation with
  the AGENT-001 required content, and retains custody.
- **AC-45** — No session can unblock itself by relaxing the blocking condition.

**Metrics**

- **AC-46** — Every state transition emits exactly one event; replay produces no
  duplicates.
- **AC-47** — Every §11.3 metric is reproducible from archived records alone.
- **AC-48** — Absolute-zero metrics (`duplicate_owner_incidents`,
  `orphaned_work_incidents`, `inherited_evidence_miscitation`,
  `scoring_replay_divergence`, `rework_rate`) are zero across the full test corpus.
  Any non-zero value is a release blocker.

## 16.2 Test Strategy — Layer 1: Golden Vectors

A committed corpus of `(snapshot, scoringVersion, policyVersion) → (score, decision)`
triples, including every floor, every rule, and every boundary value ±1. Any change
to a constant must change `scoringVersion` and update vectors in the same commit —
a vector diff without a version bump fails CI. This is the primary defense for AC-02
and INV-8.

## 16.3 Layer 2: Property-Based Tests

- **Monotonicity** — increasing any degradation signal never improves its dimension.
- **Totality** — every generated valid snapshot yields a decision.
- **Determinism** — `f(x) == f(x)` across process boundaries and serialization round-trips.
- **Compaction conservation** — for all plans, assertion sets are conserved (AC-25).
- **Reference closure** — retained spans' references are always satisfiable (AC-26).
- **Constraint monotonicity** — for all chains, constraint lists are non-shrinking (AC-18).
- **Hash stability** — canonicalization is invariant to key insertion order, newline
  style, and Unicode normalization form of the input.

## 16.4 Layer 3: State-Machine Conformance

Model-based testing over §6: generate random valid transition sequences and assert
no illegal transition is reachable; assert mutable work occurs **only** in `ACTIVE`;
assert every path from `BLOCKED` to `ACTIVE` passes through `VERIFYING`; assert
every terminal state has released custody or an open escalation.

## 16.5 Layer 4: Integration and Concurrency

- Full rollover against a real git repository: seal → packet → successor → gates →
  custody → active → predecessor retired.
- Every gate failure mode injected individually, asserting the §10.3 route.
- Concurrency: N successors racing one reservation; predecessor waking mid-transfer;
  sweeper firing during handoff; process kill at each step of CLM-C2 and the CAS.
- Crash-recovery: kill between reserve and create, between seal and packet, between
  CAS and token issue — assert convergence with no double owner and no orphan.

## 16.6 Layer 5: Shadow Mode (calibration, OI-1)

Before the CLM is permitted to act, it runs in **shadow**: probing, scoring, and
deciding on every turn, logging decisions and their would-be consequences without
executing them. Constants are calibrated against that corpus. Promotion to
enforcing mode requires: ≥ N sessions of shadow data, `false_block_rate` within
target, and zero absolute-metric violations. This is how the DEFAULTs in this spec
become trustworthy numbers rather than plausible ones.

## 16.7 Layer 6: Adversarial (§17)

## 16.8 What This Test Strategy Does Not Cover

Stated explicitly per AGENT-001:

- Compaction **quality** — whether a summary is *good* — is not machine-checkable
  here. Only assertion conservation and class preservation are. Human review of a
  sampled corpus is required.
- Relevance classification correctness beyond its rule table.
- Real provider behavior under switch (tokenizer and tool-semantic differences) —
  requires live multi-provider testing, out of scope for unit and integration layers.
- Long-horizon drift over hundreds of rollovers — requires soak testing.

---

# 17. Adversarial Test Cases

Each names the attack, the invariant at risk, and the expected defense. These are
designed to **fail** the naive implementation.

## 17.1 Ownership

- **ADV-01 Split-brain successor.** Two successors created from one reservation
  under a partition; both pass G1–G9 simultaneously. *Expect:* exactly one wins the
  CAS at G10; the loser terminates cleanly and never receives a token. (INV-2)
- **ADV-02 Zombie predecessor.** A predecessor is suspended mid-turn, transfer
  completes, then it resumes and attempts a write with its cached token. *Expect:*
  stale epoch rejected at the mutation site — not merely at the next probe. (INV-2, F-OWN-02)
- **ADV-03 Reservation replay.** The rollover step is replayed 50× (durable-task
  retry storm). *Expect:* one reservation, one successor, one transfer, one event.
- **ADV-04 Custody CAS lost, successor retries.** *Expect:* no retry — F-OWN-01 is
  terminal for that successor. A retry loop here is how you manufacture two owners.
- **ADV-05 Split then rollover race.** A split proposal commits while a rollover is
  in flight. *Expect:* split does not transfer ownership (CLM-D10); the parent
  rollover proceeds; child units remain unclaimed.
- **ADV-06 Predecessor checkpoints after handoff.** *Expect:* rejected — checkpoint
  writes require a valid epoch; a post-handoff checkpoint would fork the chain.

## 17.2 Context integrity

- **ADV-07 Negative-scope laundering.** A summarization step "helpfully" compresses
  five out-of-scope items into "various items deferred". *Expect:* rejected —
  `outOfScope` is `CRITICAL`, verbatim-only; packet generation fails; F-PKT-SCOPESHRINK.
- **ADV-08 Rejected-approach amnesia.** The single span recording "approach X was
  tried and failed because Y" is old, unreferenced for 200 turns, and large.
  *Expect:* retained — recency never demotes `CRITICAL` (CLM-X7). The successor is
  told not to retry X.
- **ADV-09 Contradiction laundering by dedup.** Two spans assert
  `repository.head = A` and `repository.head = B`. *Expect:* recorded as a
  contradiction, **not** deduplicated to the newer. Quarantine, then re-measure. (AC-28)
- **ADV-10 Reference severing.** A compaction removes a tool result that a retained
  `CRITICAL` decision's rationale references. *Expect:* removal rejected or the
  assertion inlined; never a dangling reference. (AC-26)
- **ADV-11 Assertion drift through summarization.** A `MEDIUM` summarization changes
  "3 of 5 criteria satisfied" to "most criteria satisfied". *Expect:* conservation
  check fails on the typed key; compaction reverts. (AC-25)
- **ADV-12 Objective rewrite.** A checkpoint's `objective.statement` is subtly
  reworded — one clause dropped. *Expect:* `statementHash` mismatch across the chain
  is detected and blocks. (AC-17)
- **ADV-13 Compaction under contradiction.** Capacity is critical *and* a
  contradiction exists. Naive systems compact, deleting the contradiction evidence.
  *Expect:* compaction forbidden while a non-capacity floor is breached (CLM-D5);
  quarantine first.

## 17.3 Restoration

- **ADV-14 Wrong repository, right shape.** A fork with identical branch name, an
  identical-looking HEAD subject, and matching file layout. *Expect:* G3 fails on
  `rootCommit`/`repoFingerprint`. Branch and file names must never be sufficient identity.
- **ADV-15 HEAD advanced by a teammate.** Fast-forward containing the expected HEAD.
  *Expect:* not a silent pass — recorded, inherited validations marked stale (CLM-K4),
  quarantine and re-validate before mutable work.
- **ADV-16 History rewritten.** Force-push replaced the expected HEAD with a rebased
  equivalent. *Expect:* G5 hard fail — the diff may apply cleanly and still be wrong.
- **ADV-17 Tree matches, lockfile doesn't.** Source identical, `package-lock.json`
  regenerated. *Expect:* G9 fails; inherited test evidence is invalid because the
  dependency graph changed.
- **ADV-18 Env key present but empty.** *Expect:* `present` must mean usable;
  empty-string is absent. F-ENV-MISSINGKEY. And the *value* is never checked into
  the checkpoint either way (INV-7).
- **ADV-19 Inherited-green citation.** The packet carries "317 tests passed"; the
  successor reports it as its own validation in a handoff. *Expect:* blocked by
  `performedByThisSession: false` propagation; metric target 0. (INV-9 — this is the
  precise error Sprint 1E's completion notes had to correct for the production build.)
- **ADV-20 Gate short-circuit.** An implementation "optimizes" by trusting the
  packet's `workingTreeDigest` instead of recomputing. *Expect:* detected — each
  gate must record a fresh measurement source and timestamp (AC-33).
- **ADV-21 Repair token escalation.** A repair token for `npm ci` is used to also
  modify tracked source. *Expect:* rejected — single operation, allowlisted,
  single-use, no tracked-source writes (CLM-R11).

## 17.4 Checkpoint and packet

- **ADV-22 Tampered checkpoint.** A byte is flipped in `objective.outOfScope` after
  sealing. *Expect:* group digest and `contentHash` mismatch at G1; chain hash
  mismatch downstream; F-CKPT-02.
- **ADV-23 Chain forgery.** A fabricated checkpoint is inserted with a plausible
  `parentCheckpointId`. *Expect:* `chainHash` fails to verify to the root.
- **ADV-24 Out-of-tokens checkpoint.** A session is driven to the exact boundary
  where a full checkpoint will not fit. *Expect:* the reserve prevents reaching it;
  if reached, emergency `CRITICAL`-only checkpoint + block + reserve raised (F-CKPT-05).
- **ADV-25 Superseded-checkpoint resurrection.** A checkpoint superseded by a
  correction is offered as a fallback candidate. *Expect:* skipped unless the
  superseding one is itself unusable (CLM-R6.5), and the choice is recorded.
- **ADV-26 Fallback loop.** Each fallback candidate fails, and the recovery engine
  cycles. *Expect:* bounded by `MAX_FALLBACK_DEPTH`; block and escalate. No infinite
  recovery.

## 17.5 Decision layer

- **ADV-27 Threshold oscillation.** Capacity is driven to sit exactly on the
  compaction boundary, alternating each turn. *Expect:* hysteresis suppresses churn;
  `decision_reversal_rate` stays low. (AC-10)
- **ADV-28 Compaction treadmill.** Each compaction reclaims just under
  `MIN_COMPACTION_GAIN`. *Expect:* two ineffective compactions force rollover
  rather than an endless reclaim loop. (AC-11)
- **ADV-29 Projection under-estimate.** The next step costs 5× the cost table's
  figure. *Expect:* the safety reserve absorbs it; the reserve is raised; the cost
  table is flagged for calibration. Under-estimation must never strand a session.
- **ADV-30 Degraded-snapshot continue.** A probe fails to read `headSha`; the
  snapshot is degraded but everything else looks healthy and `overall` is 95.
  *Expect:* `CONTINUE` forbidden. High overall never overrides a floor. (AC-08)
- **ADV-31 Capability-silent switch.** The only available provider lacks a required
  tool capability, and switching to it would "mostly work". *Expect:* `BLOCK` with
  `no_capable_provider` — never a degraded switch. (AC-12)
- **ADV-32 Split as constraint laundering.** A split plan drops the parent's
  `outOfScope` from one child ("it doesn't apply to this part"). *Expect:* rejected —
  every unit inherits the full constraint set (CLM-D9.2).
- **ADV-33 Overlapping split footprints.** Two units both write the same file.
  *Expect:* not decomposable; `SPLIT` not selected. (F-LC-05)

## 17.6 Crash and timing

- **ADV-34 Kill between seal and packet.** *Expect:* checkpoint valid; packet
  regenerated deterministically on restart (packet is derived, so no loss).
- **ADV-35 Kill between reserve and successor creation.** *Expect:* reservation
  expires or is re-used idempotently; never two successors. (F-OWN-03)
- **ADV-36 Kill between CAS and token issue.** *Expect:* custody is transferred but
  no token exists; the successor re-verifies and receives one; the predecessor is
  already epoch-stale and cannot write. No window of two writers.
- **ADV-37 Clock skew.** The successor's clock is 10 minutes behind; the reservation
  appears unexpired when it is not. *Expect:* expiry decided by a single authority
  (the custody store), never by session-local clocks. (F-IN-05)
- **ADV-38 Sweeper during handoff.** The custody sweeper fires mid-transfer.
  *Expect:* it observes `state = 'transferring'` within deadline and does not
  reclaim; past deadline it reclaims via the same CAS, so no double owner arises.
- **ADV-39 Duplicate durable-task delivery.** Every CLM durable operation is
  delivered twice. *Expect:* idempotent on `(sessionId, from, to, transitionSeq)`;
  one event, one effect (CLM-M4). This is the failure Sprint 1E's callback
  idempotency work already had to fix once at the execution layer.

---

# 18. Summary of Normative Rules

| Id | Rule |
| --- | --- |
| CLM-P1..P4 | Positioning, powers, purity, determinism boundary |
| CLM-I1..I6 | Input discipline, structural contradiction, cost table, snapshot immutability |
| CLM-S1..S4 | Integer arithmetic, versioned policy, hard floors, determinism guarantees |
| **CLM-S5..S10** | **Band vocabulary; uncertain/blocked are bands; no aggregate verdict; declared sampling interval; threshold ownership split; provisional defaults** |
| CLM-D1..D15 | Ladder ordering, checkpoint-before-transition, per-action guards, split/switch/rollover rules |
| **CLM-D16..D19** | **Provider profile-as-data; occupancy ≠ cost; tokenizer opacity; no historical-performance authority** |
| CLM-M1..M4 | `ACTIVE`-only mutation, re-verify after block, custody never held while failed, one idempotent event per transition |
| CLM-C1..C10 | Checkpoint immutability, atomic seal, derived id, emission reserve, mutation token, single-writer CAS, reserve-before-create, no orphan work |
| **CLM-C11** | **Persistence floor: durable, append-only, no eviction, read-after-write, linearizable CAS** |
| CLM-K1..K6 | Objective stability, relevance classes, no secrets, evidence validity anchoring, removal ledger, constraint monotonicity |
| **CLM-K7** | **Canonical record name `ContextCheckpoint`; disambiguated from 2J `EditCheckpoint`** |
| CLM-G1..G4 | Packet derivation, no silent lossiness, negative-scope preservation, inherited-evidence marking |
| **CLM-G5..G6** | **Continuation packet ≠ work packet (1G); Router admits, CLM governs tenure (1H); no re-assembly on restoration** |
| CLM-X1..X11 | Compaction ladder, assertion conservation, revertibility, relevance rules, reference integrity, duplicate/stale handling, removal ledger |
| CLM-R1..R11 | Gate ladder, verify-don't-trust, recorded verification, recovery routes, bounded attempts, fallback ordering, no silent regression, reconciliation, repair tokens |
| **CLM-R12..R13** | **G1–G10 are a mandatory floor; consumers add G11+ but never remove; an unrunnable gate is a hard failure** |
| CLM-U1..U3 | Quarantine permissions, no coin-flips, bounded uncertainty |
| CLM-B1..B3 | Block behavior, honest blocking, no self-authorization |
| CLM-T1..T2 | Metric derivation, event discipline |
| **CLM-T3..T7** | **`PublicContextHealth` projection only; correlation fields from day one; recorded failure attribution; no guessing; absence is a value** |
| CLM-N1 | CLM budgets never consume work budgets |
| INV-1..INV-12 | The invariants of §12 |

---

# 19. Status and Next Actions

**Status:** Draft specification, reconciled (v1.1.0). Not approved. Not implemented.

**Repository changes made in producing v1.1.0:** this file only, plus the companion
`CLM_COLLABORATION_HANDOFF.md` in the same directory. Both untracked and uncommitted. No
code, ADR, roadmap, plan, or other specialist's file was modified.

**Validation performed:** none applicable — this is a planning artifact. Repository facts
cited throughout were read from the working tree at `357f03b`. The five reconciliation source
documents are listed in the header. Where those documents are quoted, the quotation is
verbatim; where this spec disagrees with one, the disagreement is stated as such rather than
silently resolved (§14.1, §14.2, §4.8).

**Known limitations, stated plainly:**

1. Every threshold and weight is a provisional default (§14A). Not one is Founder-approved.
   Shadow mode (§16.6) remains a prerequisite for trusting any of them.
2. Span-level measurement is an unconfirmed dependency (A-1 / OI-7), and is now **doubly
   unverifiable**: Phase 1 agents are deterministic simulations with no context window at
   all (1F Q-4), so span enumeration cannot be tested until real providers land (P-8).
3. INV-2 cannot be honored across processes on the current memory-only store, and the
   200-entry event cap would truncate the integrity chain. Now normative as CLM-C11 and
   escalated as a hard prerequisite.
4. Contradiction detection is structural only and will miss prose-level drift (OI-4).
5. **This specification cannot make Mission Control View 12 light up.** It makes the dark
   state data-driven. Non-zero context measurement requires real providers and populated
   `usage`. Any plan assuming otherwise is planning against a fact this document contradicts.
6. Multi-participant custody (Phase 2 2F/2G) is **out of scope for v1.1** and unmodeled
   (OQ-C4). INV-2 currently assumes one participant per work unit.
7. Sprint ownership of the CLM is contradicted between Phase 2 P-5 and §3.3 and is
   unresolved here by design (OQ-C1).

## 19.1 Is an ADR required before implementation?

**Yes. Unambiguously.** Four independent grounds, any one of which would be sufficient:

| # | Ground | Evidence |
| --- | --- | --- |
| **1** | It introduces a **new ownership primitive** — custody with a linearizable CAS and epoch — that ADR-0001's `AgentAssignment` lease does not cover and cannot be read as covering | §7.3–7.5; ADR-0001 D3 defines assignment as agent↔execution, not session↔work-unit |
| **2** | It requires **additive amendments to an accepted ADR** — `EscalationOrigin` and `EventEntityType` members (ADR-0002) | §13.1, OI-3. GOVERNANCE.md: an ADR conflict requires escalation, not local resolution |
| **3** | **Phase 2 already depends on an invariant this spec defines.** Phase 2 §3.9 requires *"Restoration verification (CLM) must pass before a resumed packet mutates"* — a downstream plan built on an unrecorded architectural guarantee | Phase 2 §3.9; INV-1 |
| **4** | It fixes a **persistence precondition** (CLM-C11) that constrains the ADR-0003 persistence decision already in flight | §14.7; 1F Q-1; Phase 2 P-1 |

**Numbering caution.** Do **not** claim a number in this document. Sprint 1F has already
claimed **ADR-0003** for the persistence/deployment decision, and Phase 2 explicitly asks
that its ADRs be numbered **from ADR-0004** with *"the Founder… assign the numbers centrally
to prevent two workstreams claiming one number."* A Phase 1 CLM ADR falls outside both
reservations and therefore **needs an explicit central assignment**. Flagging this is itself
one of the findings: three workstreams are now producing ADR-grade decisions concurrently
with no central numbering authority in operation.

**Scope of the required ADR** (recommended — the Founder decides): the ownership and custody
model, checkpoint immutability and the integrity chain, the restoration gate floor, the
determinism and replayability guarantee, and the threshold-ownership split of §4.8. **Not**
the numeric thresholds — those are a governed policy record that the ADR should point to,
versioned separately, so tuning does not require an architecture decision each time.

**Required next actions:**

| # | Action | Owner |
| --- | --- | --- |
| 1 | Resolve OQ-C1 (CLM sprint ownership) and OQ-C2 (threshold ownership) | **Founder** |
| 2 | Assign a central ADR number and commission the CLM ADR | **Founder** |
| 3 | Architecture review against ADR-0001/0002 boundaries, focused on custody vs `AgentAssignment` (OQ-C5) | Architecture Reviewer |
| 4 | Confirm §14.2's reclassification of 1F D-G/D-H with the 1F planning workstream | Lead Engineer + Founder |
| 5 | Confirm §4.8's threshold split with the Design workstream (amends UX CX-2 / OQ-7) | Director of Operations |
| 6 | Sequence CLM against ADR-0003 persistence; shadow mode as the first shippable increment | Lead Engineer |

**Recommendation, unchanged and now better supported:** this specification should become an
**ADR**, not a sprint plan. v1.0.0 argued this on internal grounds. v1.1.0 adds an external
one: a downstream program plan is already depending on its invariants in writing.
