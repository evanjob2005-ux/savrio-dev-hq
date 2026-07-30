"""Option A manifest changes: one retirement, five restatements.

Text replacement rather than a JSON round-trip, so the hand-laid formatting
survives and the diff shows only the six intended changes. Every replacement is
asserted.
"""
import json
import pathlib
import sys

p = pathlib.Path("docs/claims.json")
text = p.read_text(encoding="utf-8")
applied = []


def sub(label, old, new):
    global text
    if text.count(old) != 1:
        sys.exit(f"REFUSING {label!r}: matched {text.count(old)}, expected 1")
    text = text.replace(old, new, 1)
    applied.append(label)


# ---------------------------------------------------------------- retirement
# The probe is a whole-file grep for randomUUID(). It is satisfied by a comment,
# and it decides nothing whatever about how nextCapabilityToken is implemented.
# Retiring rather than restating: a claim that says only "this identifier occurs
# somewhere in this file" occupies a slot that reads as coverage of the CSPRNG
# property, and no honest restatement of it is worth keeping.
sub("retire capability-token-uses-node-crypto", '''    {
      "id": "capability-token-uses-node-crypto",
      "document": "docs/validation/sprint-1e-overnight-2026-07-26/SPRINT_1F_FOLLOWUP_REGISTER.md",
      "statement": "SEC-6 correction: lib/dev-hq/id.ts implements nextCapabilityToken over randomUUID() from node:crypto.",
      "probe": "grep-present",
      "args": {
        "path": "lib/dev-hq/id.ts",
        "pattern": "randomUUID\\\\(\\\\)"
      },
      "red_means": "The CSPRNG behind every capability token was replaced. sec6-review-token-from-csprng can stay green while this goes red, because the call site is unchanged and only its implementation was hollowed -- which is why this is a separate claim."
    },
''', "")

# -------------------------------------------------------------- restatements
sub("restate pkg3-approval-tag-exists",
    '"statement": "The CORRECTION of 2026-07-29 supersedes the register\'s sentence \\"sprint-1f-pkg3-approved does not exist\\": the tag exists and is annotated.",',
    '"statement": "The CORRECTION of 2026-07-29 supersedes the register\'s sentence \\"sprint-1f-pkg3-approved does not exist\\": the tag exists. Whether it is ANNOTATED is not decided by this probe -- a lightweight ref satisfies it.",')

sub("restate sec6-review-token-from-csprng",
    '"statement": "SEC-6 / CR-1 CORRECTION 2026-07-29: the review callback token is minted by nextCapabilityToken(\\"rvt\\") in lib/dev-hq/review-service.ts.",',
    '"statement": "SEC-6 / CR-1 CORRECTION 2026-07-29: the text nextCapabilityToken(\\"rvt\\") occurs somewhere in lib/dev-hq/review-service.ts. This is a whole-file search and does NOT bind the call to the mint site, so it is occurrence evidence and not proof that the callback token is minted by it.",')

sub("restate event-store-has-no-retention-cap",
    '"statement": "RAT-5 CORRECTION 2026-07-29: there is no slice, splice, shift, or cap of any kind in lib/dev-hq/store.ts, so nothing is evicted and RAT-5\'s stated consequence cannot occur.",',
    '"statement": "RAT-5 CORRECTION 2026-07-29: none of the identifiers EVENT_BUFFER_SIZE, .slice(, .splice(, .shift( or .pop( occurs in lib/dev-hq/store.ts. This does NOT decide that no cap of any kind exists: a cap written by other means -- assigning to .length, rebinding the array, or evicting from another file -- passes this probe unchanged.",')

sub("restate event-buffer-size-is-a-page-limit",
    '"statement": "RAT-5 correction: EVENT_BUFFER_SIZE = 200 still exists in lib/dev-hq/constants.ts, where it now bounds only the limit parameter of /api/dev-hq/events rather than retention.",',
    '"statement": "RAT-5 correction: the declaration EVENT_BUFFER_SIZE = 200 still exists in lib/dev-hq/constants.ts. What the constant BOUNDS is not decided by this probe; the register\'s account of it as a page limit rather than a retention policy rests on ADR-0004 Section 2, not on this check.",')

sub("restate timeline-retention-guarded-by-test",
    '"statement": "RAT-5 correction: the append-only timeline is guarded by lib/dev-hq/audit-timeline.test.ts, which asserts 205 distinct events are retained.",',
    '"statement": "RAT-5 correction: the literal toHaveLength(205) occurs in lib/dev-hq/audit-timeline.test.ts. This does NOT decide that the test retains 205 distinct events -- an unrelated assertion of the same shape satisfies it. The executed guard is the test itself, which runs in the Vitest node project; this claim detects only the file going missing or the literal being removed.",')

p.write_text(text, encoding="utf-8")
data = json.loads(p.read_text(encoding="utf-8"))
ids = [c["id"] for c in data["claims"]]
print(f"applied {len(applied)} change(s); {len(ids)} claims remain")
for label in applied:
    print("  -", label)
assert "capability-token-uses-node-crypto" not in ids, "retirement did not take"
print("retired id absent from manifest: confirmed")
