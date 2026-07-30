"""Loop-2 corrections to Option A, from the independent review.

Restates the eight remaining overclaiming statements found by auditing all 14
against their args, so the completeness claim becomes true rather than being
narrowed. Text only: no probe, path, pattern or arg changes.
"""
import json
import pathlib
import sys

applied = []


def sub(path, label, old, new):
    p = pathlib.Path(path)
    t = p.read_text(encoding="utf-8")
    if t.count(old) != 1:
        sys.exit(f"REFUSING {label!r}: matched {t.count(old)}, expected 1")
    p.write_text(t.replace(old, new, 1), encoding="utf-8")
    applied.append(label)


C = "docs/claims.json"

# --- MINOR-1: the probe decides text, not that it is a declaration ----------
sub(C, "event-buffer-size: declaration -> text",
    '"statement": "RAT-5 correction: the declaration EVENT_BUFFER_SIZE = 200 still exists in lib/dev-hq/constants.ts.',
    '"statement": "RAT-5 correction: the text EVENT_BUFFER_SIZE = 200 occurs in lib/dev-hq/constants.ts -- a comment satisfies this equally.')

# --- tag claims: tag-at-commit decides where a tag points NOW ---------------
sub(C, "pkg3-approval-tag-target",
    '"statement": "sprint-1f-pkg3-approved points at commit b7386f0521f296a5411e77e15d4dd385eb65691d, the same commit the register names as candidate 1, so the checkpoint was created against the frozen candidate and not a new one.",',
    '"statement": "sprint-1f-pkg3-approved currently resolves to commit b7386f0521f296a5411e77e15d4dd385eb65691d, the same commit the register names as candidate 1. This probe decides where the tag points NOW and not how it got there: a tag force-moved onto that commit satisfies it identically, so it is not evidence that the checkpoint was CREATED against the frozen candidate.",')

sub(C, "pkg3-candidate-freeze-unmoved",
    '"statement": "PKG-3-CORRECTION-1: candidate-1f-pkg3-1 must not be moved, recreated, replaced, or re-frozen. It still resolves to commit b7386f0521f296a5411e77e15d4dd385eb65691d.",',
    '"statement": "PKG-3-CORRECTION-1 requires that candidate-1f-pkg3-1 not be moved, recreated, replaced, or re-frozen. This probe decides only the last of those: the tag still resolves to commit b7386f0521f296a5411e77e15d4dd385eb65691d. Deleting and re-creating it at the same commit, or replacing the annotated tag with a lightweight ref, both satisfy this check.",')

sub(C, "pkg2-approval-tag-target",
    '"statement": "The PKG-2 source of authority is Founder approval of commit 5c1fd6590160dd9bf41212868ed946bb9fb12123 at protected checkpoint sprint-1f-pkg2-approved.",',
    '"statement": "The register records the PKG-2 source of authority as Founder approval of commit 5c1fd6590160dd9bf41212868ed946bb9fb12123 at checkpoint sprint-1f-pkg2-approved. This probe decides only that the tag resolves to that commit. Neither the Founder approval nor the checkpoint being PROTECTED is decided here; no ruleset covers these tags.",')

# --- grep-absent: decides that a literal pattern does not occur -------------
sub(C, "sec6-review-token-not-nextid",
    '"statement": "SEC-6\'s superseded claim -- that review-service.ts mints the token with nextId(\\"rvt\\") -- is no longer true of the file.",',
    '"statement": "The literal call nextId(\\"rvt\\") does not occur in lib/dev-hq/review-service.ts. This decides the spelling, not the behaviour: minting through a variable -- const p = \\"rvt\\"; nextId(p) -- evades it. After capability-token-uses-node-crypto was retired this is the manifest\'s only remaining guard against the brute-forced generator returning to the review path, and it is a text match.",')

sub(C, "next-config-not-standalone",
    '"statement": "PKG-2 verdict-flipping condition, checked at approval and not met: output: \\"standalone\\" is not set in next.config.ts.",',
    '"statement": "PKG-2 verdict-flipping condition, checked at approval and not met: the literal output: \\"standalone\\" (or single-quoted) does not occur in next.config.ts. A computed value assigned to output would not be seen by this probe.",')

# --- config/test greps: text occurrence, not the property asserted ----------
sub(C, "smoke-heading-match-is-exact",
    '"statement": "AR N-2: e2e/smoke.spec.ts is load-bearing documentation and its exact: true must not be deleted by a future maintainer \\"repairing\\" the test.",',
    '"statement": "AR N-2 requires that the exact: true in e2e/smoke.spec.ts not be deleted by a future maintainer \\"repairing\\" the test. This probe does NOT enforce that: it matches the text anywhere in the file, and the file\'s explanatory COMMENT about exact: true satisfies it, so the executable assertion can be deleted with this claim still green. Independently demonstrated 2026-07-30; recorded in docs/governance/CTL-CLAIM-DISPOSITION-001.md.",')

sub(C, "playwright-spec-collection-widened",
    '"statement": "PKG-2 M-1, closed by b32caec: playwright.config.ts collects the widened spec-only pattern **/*.spec.?(c|m)[jt]s?(x), admitting further spec forms without permitting .test.* files.",',
    '"statement": "PKG-2 M-1, closed by b32caec: the widened pattern **/*.spec.?(c|m)[jt]s?(x) occurs in playwright.config.ts. This does NOT decide that .test.* files are excluded -- adding a second testMatch entry that admits them satisfies this claim unchanged.",')

sub(C, "vitest-projects-exclude-e2e",
    '"statement": "PKG-2 M-2 and M-3, closed by b32caec: vitest.config.ts composes the installed version\'s configDefaults.exclude and excludes e2e/** from both projects.",',
    '"statement": "PKG-2 M-2 and M-3, closed by b32caec: vitest.config.ts contains ...configDefaults.exclude followed somewhere later by \\"e2e/**\\". This matches the shared exclude list once and decides NOTHING about either project: removing exclude from the dom project entirely satisfies this claim. Independently demonstrated 2026-07-30.",')

data = json.loads(pathlib.Path(C).read_text(encoding="utf-8"))
print(f"restated {len(applied)} statement(s); {len(data['claims'])} claims")
for label in applied:
    print("  -", label)
