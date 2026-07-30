"""Re-apply every loop-2 change to docs/claims.json, deterministically.

Written as one asserted script rather than a series of edits because an
evidence script's `git checkout -- docs/claims.json` twice discarded this work:
the manifest was uncommitted while mutations were being restored around it.
Every replacement is asserted, so a silent miss fails loudly.
"""
import json
import pathlib
import sys

p = pathlib.Path("docs/claims.json")
text = p.read_text(encoding="utf-8")
applied = []


def sub(label, old, new, count=1):
    global text
    found = text.count(old)
    if found != count:
        sys.exit(f"REFUSING: {label!r} matched {found}, expected {count}")
    text = text.replace(old, new, count)
    applied.append(label)


# ---------------------------------------------------------------- baseline pin
sub("baseline gains a durable tag anchor",
    '''  "required_claims_baseline": {
    "commit": "5064526bd32007575303e94c7bfab522b3308734",
    "path": "docs/claims.json",''',
    '''  "required_claims_baseline": {
    "tag": "claims-baseline-1",
    "commit": "5064526bd32007575303e94c7bfab522b3308734",
    "path": "docs/claims.json",''')

sub("baseline rationale covers bodies, tags, and direction",
    '''      "'delete the claim' the cheapest way to turn any red green. Every claim",
      "id present at this commit must still be present here, or be named in",
      "retired_claims with a reason and an authority.",
      "",
      "Read out of git history rather than from a sibling file, so that the",
      "change deleting a claim cannot also supply the list of what was",
      "required. This needs full history: the verifier exits 2, never 0, when",
      "the pinned commit cannot be read.",
      "",
      "Moving this pin forward is a reviewable act. Do it only when claims are",
      "legitimately retired, and say so in the retirement record."''',
    '''      "'delete the claim' the cheapest way to turn any red green. Every claim",
      "present at this baseline must still be present here AND still have the",
      "same probe and args, or be named in retired_claims / amended_claims",
      "with a reason and an authority.",
      "",
      "Comparing ids alone was not enough. Keeping an id while swapping its",
      "probe for a tautology is a deletion that does not change the claim",
      "count, and it left the summary line byte-identical to a clean run.",
      "",
      "Read out of git history rather than from a sibling file, so that the",
      "change deleting a claim cannot also supply the list of what was",
      "required. This needs full history AND tags: the verifier exits 2, never",
      "0, when the baseline cannot be read.",
      "",
      "The TAG is the durable anchor and is tried first; the commit is only a",
      "fallback, reachable while this branch exists. GIT_STANDARD.md prefers",
      "squash merges, after which the commit is unreachable from the default",
      "branch. The tag MUST be pushed to origin before this branch merges.",
      "",
      "Moving this pin is a reviewable act. Do it only when claims are",
      "legitimately retired or amended, and say so in that record. The pin must",
      "be an ancestor of HEAD, so it cannot be moved backward past a claim's",
      "introduction to drop it silently."''')

# ------------------------------------------------------------- probe selection
sub("sec6 mint anchor bound to the reservation call",
    '''        "anchor": "token:",''' + '\n' + '''        "pattern": "nextCapabilityToken\\\\(\\\\s*\\"rvt\\"\\\\s*\\\\)",
        "within": 0''',
    '''        "anchor": "reserveCallbackToken\\\\(",''' + '\n' + '''        "pattern": "nextCapabilityToken\\\\(\\\\s*\\"rvt\\"\\\\s*\\\\)",
        "within": 3''')

sub("appends-205 bound to the awaited call, tighter window",
    '''        "anchor": "index < 205",
        "pattern": "logger\\\\.log",
        "within": 3''',
    '''        "anchor": "index < 205",
        "pattern": "await logger\\\\.log\\\\(\\\\{",
        "within": 2''')

# code_only must not exist on an absent-style claim: removing text can only
# hide a violation, which is the one direction a control may not fail in.
sub("drop code_only from the nextId-absence claim",
    '''        "pattern": "nextId\\\\(\\\\s*\\"rvt\\"\\\\s*\\\\)",
        "code_only": true''',
    '''        "pattern": "nextId\\\\(\\\\s*\\"rvt\\"\\\\s*\\\\)"''')

sub("drop code_only from the next.config standalone claim",
    '''        "pattern": "output\\\\s*:\\\\s*[\\"']standalone[\\"']",
        "code_only": true''',
    '''        "pattern": "output\\\\s*:\\\\s*[\\"']standalone[\\"']"''')

sub("capability-token red_means names its partner claim",
    "which is why this is a separate claim.\"",
    "which is why this is a separate claim. Proximity alone does not decide "
    "this: capability-token-not-from-nextid is the other half, and neither is "
    "sufficient by itself.\"")

# ------------------------------------------------------------------ new claims
sub("add the scoped-absent and executed-arm claims",
    '''    {
      "id": "event-store-has-no-retention-cap",''',
    '''    {
      "id": "capability-token-not-from-nextid",
      "document": "docs/validation/sprint-1e-overnight-2026-07-26/SPRINT_1F_FOLLOWUP_REGISTER.md",
      "statement": "SEC-6 correction: nextCapabilityToken does not delegate to nextId. The docstring in lib/dev-hq/id.ts records that it is \\"Deliberately NOT nextId()\\", and that is enforced rather than merely asserted.",
      "probe": "grep-scoped-absent",
      "args": {
        "path": "lib/dev-hq/id.ts",
        "anchor": "export function nextCapabilityToken",
        "pattern": "nextId\\\\(",
        "within": 4
      },
      "red_means": "The capability-token generator is delegating to the prefix-epoch-counter scheme an independent reviewer brute-forced in roughly 250k guesses. This claim exists because requiring randomUUID() NEAR the generator is satisfiable by a decoy: `const unused = randomUUID(); void unused; return nextId(prefix);` keeps capability-token-uses-node-crypto green while every token in the system becomes predictable. Presence of the CSPRNG and absence of the counter must both hold."
    },
    {
      "id": "retention-test-executes-in-ci",
      "document": "docs/decisions/ADR-0004-dev-hq-local-execution-boundary.md",
      "statement": "ADR-0004 Section 2's append-only ruling has an EXECUTED guard: .github/workflows/frontend-tests.yml runs the Vitest node project, which collects lib/dev-hq/audit-timeline.test.ts.",
      "probe": "grep-scoped",
      "args": {
        "path": ".github/workflows/frontend-tests.yml",
        "anchor": "vitest run",
        "pattern": "--project node",
        "within": 0
      },
      "red_means": "Nothing executes the retention test any more. timeline-retention-guarded-by-test and timeline-retention-test-appends-205 pin that test's TEXT; this claim is what makes them mean something, because a pinned test that no workflow runs proves nothing. Without it the append-only guarantee would rest entirely on static probes over store.ts."
    },
    {
      "id": "event-store-has-no-retention-cap",''')

# ----------------------------------------------------------------- readme text
sub("readme: new probe, refused args",
    '''    "Probe types: tag-present, tag-absent, tag-annotated, tag-at-commit,",
    "file-present, file-absent, grep-present, grep-absent, grep-scoped,",
    "no-truncation. Patterns are Python regular expressions; paths are",
    "repository-relative and use forward slashes.",''',
    '''    "Probe types: tag-present, tag-absent, tag-annotated, tag-at-commit,",
    "file-present, file-absent, grep-present, grep-absent, grep-scoped,",
    "grep-scoped-absent, no-truncation. Patterns are Python regular",
    "expressions; paths are repository-relative and use forward slashes. An",
    "arg a probe does not read is REFUSED, not ignored: a misspelled `within`",
    "would otherwise fall back to a laxer default and the claim would go on",
    "reporting that it holds.",''')

sub("readme: proximity and code_only direction",
    '''    "  * A claim saying a tag is ANNOTATED wants tag-annotated. tag-present is",
    "    satisfied by a lightweight ref that carries no annotation at all.",''',
    '''    "  * A claim saying a tag is ANNOTATED wants tag-annotated. tag-present is",
    "    satisfied by a lightweight ref that carries no annotation at all.",
    "  * A scoped claim proves PROXIMITY, not data flow. `randomUUID()` three",
    "    lines from a generator can be an unused decoy while the generator",
    "    returns a counter. Where that matters, pair grep-scoped with",
    "    grep-scoped-absent so the right call must be present AND the wrong one",
    "    absent at the same site.",
    "  * code_only is NOT available on grep-absent. For a claim that something",
    "    is absent, removing text can only hide a violation, and a control may",
    "    not fail in the direction that reads as satisfied.",''')

sub("readme: code_only guidance matches the probes that offer it",
    '''    "    about the code. Pass code_only:true on grep-present/grep-absent to get",
    "    the same treatment; pass code_only:false on the scoped probes for a",
    "    claim genuinely about prose."''',
    '''    "    about the code. Pass code_only:true on grep-present to get the same",
    "    treatment; pass code_only:false on the scoped probes for a claim",
    "    genuinely about prose."''')

p.write_text(text, encoding="utf-8")

# ------------------------------------------------- declared, reviewable amendments
AUTH = ("Batch 1 CTL-01 remediation (docs/plans/HANDOFF_2026-07-30.md), "
        "candidate-initiated and pending independent review; NOT "
        "Founder-authorized")
REASONS = {
    "pkg3-approval-tag-exists":
        "CTL-01 bypass 4: tag-present -> tag-annotated. The statement says the "
        "tag 'exists and is annotated', but tag-present is satisfied by a "
        "lightweight ref carrying no annotation at all.",
    "sec6-review-token-from-csprng":
        "CTL-01 bypass 5: whole-file grep-present -> grep-scoped bound to the "
        "reserveCallbackToken call. A whole-file grep proved only that the text "
        "existed somewhere in a ~945-line file, which a decoy satisfies.",
    "capability-token-uses-node-crypto":
        "CTL-01 bypass 2: whole-file grep-present -> grep-scoped at the "
        "generator. randomUUID() surviving anywhere in id.ts kept this green "
        "after the generator was replaced by a predictable counter. Paired with "
        "capability-token-not-from-nextid, because proximity alone is "
        "decoy-satisfiable.",
    "event-store-has-no-retention-cap":
        "CTL-01 bypass 1: grep-absent over five identifiers -> no-truncation "
        "over the operation applied to store.events. The old probe searched for "
        "the identifier a PREVIOUS cap happened to use, so an equivalent cap "
        "written any other way passed while evicting audit history.",
    "timeline-retention-guarded-by-test":
        "CTL-01 bypass 3: whole-file grep-present -> grep-scoped with within:0 "
        "on the assertion line. An unrelated toHaveLength(205) added as filler "
        "satisfied the whole-file grep while the guard asserted 1.",
    "timeline-retention-test-appends-205":
        "Independent review found `if (index === 0)` wrapping the append "
        "satisfied within:3. Bound to the awaited call at within:2.",
    "sec6-review-token-not-nextid":
        "code_only removed. On an absent claim, stripping text can only hide a "
        "violation, so the option's failure direction is 'reads as satisfied'.",
    "next-config-not-standalone":
        "code_only removed, for the same reason as sec6-review-token-not-nextid.",
    "event-buffer-size-is-a-page-limit":
        "code_only added: a commented-out declaration must not satisfy a claim "
        "about a live constant.",
    "smoke-heading-match-is-exact":
        "code_only added: a commented-out exact:true must not satisfy this claim.",
    "playwright-spec-collection-widened":
        "code_only added: a commented-out spec glob must not satisfy this claim.",
    "vitest-projects-exclude-e2e":
        "code_only added: a commented-out exclusion must not satisfy this claim.",
}

text = p.read_text(encoding="utf-8")
records = [{"id": k, "reason": REASONS[k], "authorized_by": AUTH}
           for k in sorted(REASONS)]
block = json.dumps(records, indent=2)
block = "\n".join(("  " + line) if line.strip() else line
                  for line in block.splitlines())
old = '  "retired_claims": [],'
if text.count(old) != 1:
    sys.exit("REFUSING: could not find the retired_claims anchor")
text = text.replace(
    old, '  "retired_claims": [],\n  "amended_claims": ' + block.lstrip() + ",", 1)
p.write_text(text, encoding="utf-8")
applied.append(f"amended_claims: {len(records)} declared amendment(s)")

data = json.loads(p.read_text(encoding="utf-8"))
print(f"applied {len(applied)} change(s); {len(data['claims'])} claims; "
      f"{len(data['amended_claims'])} amendments; manifest parses")
for label in applied:
    print(f"  - {label}")
