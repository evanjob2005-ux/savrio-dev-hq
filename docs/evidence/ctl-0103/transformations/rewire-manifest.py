"""Reapply the CTL-01/CTL-02 manifest rewiring by exact text replacement.

Not a JSON round-trip: that would reformat every hand-laid inline object in the
file and bury the six real changes in a whole-file diff. Every replacement is
asserted, so a string that no longer matches fails loudly instead of silently
leaving a claim on its old probe -- which is the failure mode that produced
"probes added but nothing rewired" in the first place.
"""
import pathlib
import sys

p = pathlib.Path("docs/claims.json")
text = p.read_text(encoding="utf-8")
edits = []


def sub(label, old, new, count=1):
    global text
    found = text.count(old)
    if found != count:
        sys.exit(f"REFUSING: {label!r} matched {found} time(s), expected {count}")
    text = text.replace(old, new, count)
    edits.append(label)


sub("required_claims_baseline block", """{
  "version": 1,
  "_readme": [""", """{
  "version": 1,
  "required_claims_baseline": {
    "commit": "5064526bd32007575303e94c7bfab522b3308734",
    "path": "docs/claims.json",
    "_why": [
      "CTL-02: nothing checked this manifest, so deleting an entry took",
      "coverage from 15 claims to 14 and still exited 0 -- which made",
      "'delete the claim' the cheapest way to turn any red green. Every claim",
      "id present at this commit must still be present here, or be named in",
      "retired_claims with a reason and an authority.",
      "",
      "Read out of git history rather than from a sibling file, so that the",
      "change deleting a claim cannot also supply the list of what was",
      "required. This needs full history: the verifier exits 2, never 0, when",
      "the pinned commit cannot be read.",
      "",
      "Moving this pin forward is a reviewable act. Do it only when claims are",
      "legitimately retired, and say so in the retirement record."
    ]
  },
  "retired_claims": [],
  "_readme": [""")

sub("readme probe guidance",
    """    "Only add a claim you have personally executed at the commit you add it on.",
    "Probe types: tag-present, tag-absent, tag-at-commit, file-present,",
    "file-absent, grep-present, grep-absent. Patterns are Python regular",
    "expressions searched against the whole file; paths are repository-relative",
    "and use forward slashes." """.rstrip() + "\n",
    """    "Only add a claim you have personally executed at the commit you add it on.",
    "",
    "Probe types: tag-present, tag-absent, tag-annotated, tag-at-commit,",
    "file-present, file-absent, grep-present, grep-absent, grep-scoped,",
    "no-truncation. Patterns are Python regular expressions; paths are",
    "repository-relative and use forward slashes.",
    "",
    "Choosing a probe (CTL-01 exists because these were chosen carelessly):",
    "  * A claim naming a SITE -- 'the token is minted at this call' -- wants",
    "    grep-scoped, which requires the pattern to match within `within`",
    "    lines of `anchor`. `within: 0` means the anchor's own line. A",
    "    whole-file grep-present only proves the text exists SOMEWHERE, which",
    "    a copy in an unrelated helper satisfies.",
    "  * A claim that nothing SHORTENS a collection wants no-truncation, which",
    "    looks for the operation rather than for the identifier that a previous",
    "    cap happened to use.",
    "  * A claim saying a tag is ANNOTATED wants tag-annotated. tag-present is",
    "    satisfied by a lightweight ref that carries no annotation at all.",
    "  * grep-scoped and no-truncation ignore comment-only lines by default, so",
    "    a comment describing what the code used to do cannot satisfy a claim",
    "    about the code. Pass code_only:true on grep-present/grep-absent to get",
    "    the same treatment; pass code_only:false on the scoped probes for a",
    "    claim genuinely about prose."
""")

sub("pkg3 tag -> tag-annotated",
    """      "probe": "tag-present",
      "args": { "tag": "sprint-1f-pkg3-approved" },""",
    """      "probe": "tag-annotated",
      "args": { "tag": "sprint-1f-pkg3-approved" },""")

sub("sec6 mint site -> grep-scoped",
    """      "probe": "grep-present",
      "args": {
        "path": "lib/dev-hq/review-service.ts",
        "pattern": "nextCapabilityToken\\\\(\\\\s*\\"rvt\\"\\\\s*\\\\)"
      },""",
    """      "probe": "grep-scoped",
      "args": {
        "path": "lib/dev-hq/review-service.ts",
        "anchor": "token:",
        "pattern": "nextCapabilityToken\\\\(\\\\s*\\"rvt\\"\\\\s*\\\\)",
        "within": 0
      },""")

sub("capability token -> grep-scoped",
    """      "probe": "grep-present",
      "args": {
        "path": "lib/dev-hq/id.ts",
        "pattern": "randomUUID\\\\(\\\\)"
      },""",
    """      "probe": "grep-scoped",
      "args": {
        "path": "lib/dev-hq/id.ts",
        "anchor": "export function nextCapabilityToken",
        "pattern": "randomUUID\\\\(\\\\)",
        "within": 3
      },""")

sub("retention cap -> no-truncation",
    """      "probe": "grep-absent",
      "args": {
        "path": "lib/dev-hq/store.ts",
        "pattern": "EVENT_BUFFER_SIZE|\\\\.slice\\\\(|\\\\.splice\\\\(|\\\\.shift\\\\(|\\\\.pop\\\\("
      },""",
    """      "probe": "no-truncation",
      "args": {
        "path": "lib/dev-hq/store.ts",
        "collection": "store.events"
      },""")

sub("timeline guard -> grep-scoped, plus the appends-205 claim",
    """      "probe": "grep-present",
      "args": {
        "path": "lib/dev-hq/audit-timeline.test.ts",
        "pattern": "toHaveLength\\\\(205\\\\)"
      },
      "red_means": "The only executable guard on ADR-0004 Section 2's append-only ruling was weakened or removed, leaving event-store-has-no-retention-cap as the sole thing standing between this repository and a silent reintroduction of the cap."
    },""",
    """      "probe": "grep-scoped",
      "args": {
        "path": "lib/dev-hq/audit-timeline.test.ts",
        "anchor": "expect\\\\(all\\\\)",
        "pattern": "toHaveLength\\\\(205\\\\)",
        "within": 0
      },
      "red_means": "The only executed guard on ADR-0004 Section 2's append-only ruling was weakened or removed, leaving event-store-has-no-retention-cap as the sole thing standing between this repository and a silent reintroduction of the cap."
    },
    {
      "id": "timeline-retention-test-appends-205",
      "document": "docs/validation/sprint-1e-overnight-2026-07-26/SPRINT_1F_FOLLOWUP_REGISTER.md",
      "statement": "RAT-5 correction: the guard in lib/dev-hq/audit-timeline.test.ts genuinely appends 205 events, looping over logger.log, rather than asserting 205 about anything else.",
      "probe": "grep-scoped",
      "args": {
        "path": "lib/dev-hq/audit-timeline.test.ts",
        "anchor": "index < 205",
        "pattern": "logger\\\\.log",
        "within": 3
      },
      "red_means": "The guard no longer appends the 205 events its assertion counts. CTL-01 bypass 3 was exactly this shape: the loop bound was lowered to 1 and an unrelated toHaveLength(205) left behind, and a whole-file grep could not tell the difference. Retention would then be unguarded while both claims read green."
    },""")

# code_only on the claims that stay whole-file greps but are about CODE.
for label, needle in [
    ("nextId absence", """        "path": "lib/dev-hq/review-service.ts",
        "pattern": "nextId\\\\(\\\\s*\\"rvt\\"\\\\s*\\\\)"
      },"""),
    ("EVENT_BUFFER_SIZE declaration", """        "path": "lib/dev-hq/constants.ts",
        "pattern": "EVENT_BUFFER_SIZE\\\\s*=\\\\s*200"
      },"""),
    ("next.config standalone", """        "path": "next.config.ts",
        "pattern": "output\\\\s*:\\\\s*[\\"']standalone[\\"']"
      },"""),
    ("smoke exact:true", """        "path": "e2e/smoke.spec.ts",
        "pattern": "exact:\\\\s*true"
      },"""),
    ("playwright spec glob", """        "path": "playwright.config.ts",
        "pattern": "spec\\\\.\\\\?\\\\(c\\\\|m\\\\)\\\\[jt\\\\]s\\\\?\\\\(x\\\\)"
      },"""),
    ("vitest exclude", """        "path": "vitest.config.ts",
        "pattern": "\\\\.\\\\.\\\\.configDefaults\\\\.exclude[\\\\s\\\\S]*\\"e2e/\\\\*\\\\*\\""
      },"""),
]:
    body, tail = needle.rsplit("\n      },", 1)
    sub(f"code_only: {label}", needle, body + ',\n        "code_only": true\n      },')

p.write_text(text, encoding="utf-8")
print(f"applied {len(edits)} replacement(s):")
for label in edits:
    print(f"  - {label}")
