"""Negative controls for verify-record-claims.py.

A verifier that has only ever been seen green proves nothing, so this harness
exists to make it go red on demand and to prove it goes red for the reason
claimed. It follows the shape of scripts/test-verify-workflow-structure.py and
inherits its two hard-won rules: every case starts from a state where the null
arm is genuinely green (rule 2), and every "could not evaluate" case asserts the
message as well as the exit code (rule 5). See
standards/CONTROL_VERIFICATION_STANDARD.md.

Run from the repository root:

    python scripts/test-verify-record-claims.py

Three phases:

  1. MATRIX -- a hermetic fixture repository and fixture manifest exercising
     every probe type in both directions, plus every path on which the verifier
     must refuse to reach a verdict;
  2. NULL AUDIT -- every matrix case re-run with its mutation SKIPPED, which
     must produce exit 0 for all of them. A case that produces its expected
     non-zero code without its mutation is measuring the starting state and
     proves nothing about the verifier;
  3. LIVE DISCRIMINATION -- every claim actually seeded in docs/claims.json,
     each one inverted inside a throwaway clone of this repository and required
     to go red naming itself, then restored and required to go green again.
     Without this phase every seeded claim could be a tautology and neither of
     the first two phases would notice.

Phase 3 also fails when the manifest grows a claim this harness cannot invert,
so a future seeded claim cannot quietly arrive unproven.

Nothing here runs git against the Savrio Dev HQ working tree. Every mutation
happens inside a temporary directory, asserted before each git call.

Pass --matrix-only, --null-audit, or --live to run one phase.
"""

import json
import os
import pathlib
import shutil
import subprocess
import sys
import tempfile

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VERIFIER = "scripts/verify-record-claims.py"
MANIFEST = os.path.join(REPO, "docs", "claims.json")
SANDBOX_ROOT = os.path.realpath(tempfile.gettempdir())

NEEDLE = "keep-this-needle"
FORBIDDEN = "forbidden-needle"
ANCHOR = "anchor-of-the-claim"


def assert_sandbox(cwd):
    """Refuse to run git anywhere but a throwaway directory.

    The controls in this repository are edited by several agents at once, and a
    harness that mutated real tags or files to prove a point would be the most
    expensive kind of correct.
    """
    real = os.path.realpath(cwd)
    if not real.startswith(SANDBOX_ROOT) or os.path.realpath(REPO) == real:
        raise SystemExit(f"refusing to run git outside the sandbox: {cwd}")
    return real


def git(args, cwd, check=True):
    assert_sandbox(cwd)
    env = dict(os.environ)
    env.update({
        "GIT_CEILING_DIRECTORIES": SANDBOX_ROOT,
        "GIT_AUTHOR_NAME": "harness", "GIT_AUTHOR_EMAIL": "h@example.invalid",
        "GIT_COMMITTER_NAME": "harness",
        "GIT_COMMITTER_EMAIL": "h@example.invalid",
        "GIT_CONFIG_GLOBAL": os.path.join(cwd, ".gitconfig-none"),
        "GIT_CONFIG_SYSTEM": os.path.join(cwd, ".gitconfig-none"),
    })
    out = subprocess.run(["git", *args], cwd=cwd, env=env, capture_output=True)
    if check and out.returncode != 0:
        raise SystemExit(
            f"fixture git {args} failed: "
            f"{out.stderr.decode('utf-8', errors='replace')}")
    return out.stdout.decode("utf-8", errors="replace").strip()


def run_in(root, manifest="claims.json"):
    """Run the verifier inside `root`, honouring the git-sabotage markers.

    The markers follow the precedent in test-verify-workflow-structure.py: a
    mutation that has to change the environment rather than the tree leaves a
    file saying so, because a mutation function only receives a path.
    """
    root = pathlib.Path(root)
    env = dict(os.environ)
    if (root / ".break-git-absent").exists():
        env["PATH"] = str(root / "emptybin")
    elif (root / ".break-git-failing").exists():
        env["GIT_DIR"] = str(root / "no-such-git-dir")
    out = subprocess.run(
        [sys.executable, VERIFIER, "--manifest", manifest],
        cwd=root, capture_output=True, env=env,
    )
    blob = (out.stdout.decode("utf-8", errors="replace")
            + out.stderr.decode("utf-8", errors="replace"))
    return out.returncode, blob


# ---------------------------------------------------------------------------
# the fixture repository
# ---------------------------------------------------------------------------

def fixture_manifest(pinned_sha):
    """One green claim of every probe type the verifier implements.

    Built here rather than copied from docs/claims.json so that the matrix
    measures the verifier and not the seeded claims. Each claim owns its own
    file, so deleting one file produces exactly one changed verdict.
    """
    return {
        "version": 1,
        "claims": [
            {"id": "t-present", "document": "FIXTURE.md",
             "statement": "the fixture tag exists", "probe": "tag-present",
             "args": {"tag": "fixture-present-tag"}, "red_means": "fixture"},
            {"id": "t-absent", "document": "FIXTURE.md",
             "statement": "the fixture tag does not exist",
             "probe": "tag-absent",
             "args": {"tag": "fixture-never-created-tag"},
             "red_means": "fixture"},
            {"id": "t-pinned", "document": "FIXTURE.md",
             "statement": "the fixture tag is unmoved",
             "probe": "tag-at-commit",
             "args": {"tag": "fixture-pinned-tag", "commit": pinned_sha},
             "red_means": "fixture"},
            {"id": "f-present", "document": "FIXTURE.md",
             "statement": "the fixture file exists", "probe": "file-present",
             "args": {"path": "present.txt"}, "red_means": "fixture"},
            {"id": "f-absent", "document": "FIXTURE.md",
             "statement": "the fixture file does not exist",
             "probe": "file-absent",
             "args": {"path": "never-created.txt"}, "red_means": "fixture"},
            {"id": "g-present", "document": "FIXTURE.md",
             "statement": "the needle is in the fixture file",
             "probe": "grep-present",
             "args": {"path": "lib/needle.txt", "pattern": NEEDLE},
             "red_means": "fixture"},
            {"id": "g-absent", "document": "FIXTURE.md",
             "statement": "the forbidden needle is not in the fixture file",
             "probe": "grep-absent",
             "args": {"path": "lib/clean.txt", "pattern": FORBIDDEN},
             "red_means": "fixture"},
            {"id": "t-annotated", "document": "FIXTURE.md",
             "statement": "the fixture tag exists and is annotated",
             "probe": "tag-annotated",
             "args": {"tag": "fixture-annotated-tag"}, "red_means": "fixture"},
            {"id": "g-scoped", "document": "FIXTURE.md",
             "statement": "the needle is on the anchor's own line",
             "probe": "grep-scoped",
             "args": {"path": "lib/scoped.txt", "anchor": ANCHOR,
                      "pattern": NEEDLE, "within": 0},
             "red_means": "fixture"},
            {"id": "gsa-scoped", "document": "FIXTURE.md",
             "statement": "the forbidden needle is not on the anchor's line",
             "probe": "grep-scoped-absent",
             "args": {"path": "lib/scoped.txt", "anchor": ANCHOR,
                      "pattern": FORBIDDEN, "within": 0},
             "red_means": "fixture"},
            {"id": "nt-events", "document": "FIXTURE.md",
             "statement": "nothing shortens store.events in the fixture module",
             "probe": "no-truncation",
             "args": {"path": "lib/collection.ts",
                      "collection": "store.events"},
             "red_means": "fixture"},
        ],
    }


def write_manifest(root, data, name="claims.json"):
    (pathlib.Path(root) / name).write_text(
        json.dumps(data, indent=2) + "\n", encoding="utf-8", newline="")


def scratch(tmp):
    """A fixture repository in which every claim in the manifest is TRUE.

    Rule 2: unless this starting state is green, a case asserting exit 1 could
    be passing because of where it started rather than because of its mutation.
    The null-audit phase is what proves it really is green.
    """
    root = pathlib.Path(tmp) / "fixture"
    (root / "scripts").mkdir(parents=True)
    shutil.copy(os.path.join(REPO, VERIFIER), root / "scripts")
    (root / "present.txt").write_text("a file that exists\n",
                                      encoding="utf-8", newline="")
    (root / "lib").mkdir()
    (root / "lib" / "needle.txt").write_text(
        f"alpha\n{NEEDLE}\nomega\n", encoding="utf-8", newline="")
    (root / "lib" / "clean.txt").write_text(
        "nothing objectionable here\n", encoding="utf-8", newline="")
    # The scoped fixture carries a DECOY: the needle appears both on the
    # anchor's line and, far away, on a line of its own. A whole-file grep is
    # satisfied by the decoy alone, so removing the needle from the anchor line
    # is exactly CTL-01's "matching text elsewhere in the file" bypass, and the
    # matrix case below requires the scoped probe to still go red.
    (root / "lib" / "scoped.txt").write_text(
        f"preamble\n{ANCHOR} {NEEDLE}\nmiddle\n{NEEDLE}\nomega\n",
        encoding="utf-8", newline="")
    (root / "lib" / "collection.ts").write_text(
        "export function append(store, event) {\n"
        "  store.events.unshift(event);\n"
        "}\n", encoding="utf-8", newline="")

    git(["init", "-b", "main", "."], root)
    git(["add", "-A"], root)
    git(["commit", "-m", "fixture"], root)
    pinned = git(["rev-parse", "HEAD"], root)
    git(["tag", "fixture-present-tag"], root)
    git(["tag", "fixture-pinned-tag"], root)
    git(["tag", "-a", "fixture-annotated-tag", "-m", "fixture annotation"],
        root)
    # A second commit, so "the tag moved" has somewhere to move to.
    (root / "second.txt").write_text("second\n", encoding="utf-8", newline="")
    git(["add", "-A"], root)
    git(["commit", "-m", "second"], root)

    # The manifest is committed, and only then rewritten to pin its
    # required-claims baseline at that commit. The verifier reads the baseline
    # out of git history, so a fixture whose manifest existed only in the
    # working tree could not be evaluated at all.
    write_manifest(root, fixture_manifest(pinned))
    git(["add", "claims.json"], root)
    git(["commit", "-m", "fixture manifest"], root)
    baseline = git(["rev-parse", "HEAD"], root)

    data = fixture_manifest(pinned)
    data["required_claims_baseline"] = {"commit": baseline,
                                       "path": "claims.json"}
    data["retired_claims"] = []
    write_manifest(root, data)
    (root / "emptybin").mkdir()
    return root


def amend(root, claim_id, mutate):
    """Rewrite one claim in the fixture manifest."""
    data = json.loads((root / "claims.json").read_text(encoding="utf-8"))
    for claim in data["claims"]:
        if claim["id"] == claim_id:
            mutate(claim)
            break
    else:
        raise SystemExit(f"fixture manifest has no claim {claim_id!r}")
    write_manifest(root, data)


CASES = []


def case(label, expect, expect_text=None):
    """Register a case. `expect_text` must appear in the verifier's output."""
    def wrap(fn):
        CASES.append((label, expect, expect_text, fn))
        return fn
    return wrap


@case("NULL ARM: no mutation applied (must PASS)", 0)
def _(root):
    # Rule 2. Without this arm, every "must FAIL" case below could be passing
    # for reasons that have nothing to do with its mutation.
    pass


# ------------------------------------------------------- probe discrimination

@case("tag-present: the tag is deleted", 1, "tag does not exist")
def _(root):
    git(["tag", "-d", "fixture-present-tag"], root)


@case("tag-absent: the tag is created", 1, "now EXISTS")
def _(root):
    git(["tag", "fixture-never-created-tag"], root)


@case("tag-at-commit: the tag is force-moved to another commit", 1, "tag -> ")
def _(root):
    git(["tag", "-f", "fixture-pinned-tag", "HEAD"], root)


@case("file-present: the file is deleted", 1, "file does not exist")
def _(root):
    (root / "present.txt").unlink()


@case("file-absent: the file is created", 1, "path now EXISTS")
def _(root):
    (root / "never-created.txt").write_text("x\n", encoding="utf-8",
                                            newline="")


@case("grep-present: the matching text is removed", 1, "no longer matches")
def _(root):
    (root / "lib" / "needle.txt").write_text("alpha\nomega\n",
                                             encoding="utf-8", newline="")


@case("grep-absent: the forbidden text appears", 1, "now MATCHES")
def _(root):
    with (root / "lib" / "clean.txt").open("a", encoding="utf-8",
                                           newline="") as handle:
        handle.write(f"{FORBIDDEN}\n")


@case("a red claim reports its document and what red means", 1,
      "red means: fixture")
def _(root):
    (root / "present.txt").unlink()


# ------------------------------------------- CTL-01: the four closed bypasses
#
# Each of these passed before the CTL-01 repair. They are kept as cases rather
# than as prose in a handoff so that re-opening any one of them fails here.

@case("CTL-01/4 an annotated tag replaced by a LIGHTWEIGHT one", 1,
      "is LIGHTWEIGHT")
def _(root):
    # tag-present cannot tell these apart, which is how a claim whose statement
    # says "and is annotated" survived the annotation being thrown away.
    at = git(["rev-parse", "fixture-annotated-tag^{commit}"], root)
    git(["tag", "-d", "fixture-annotated-tag"], root)
    git(["tag", "fixture-annotated-tag", at], root)


@case("CTL-01/4 tag-annotated when the tag is gone entirely", 1,
      "tag does not exist")
def _(root):
    git(["tag", "-d", "fixture-annotated-tag"], root)


@case("CTL-01/5 the needle leaves the anchor line but survives ELSEWHERE", 1,
      "does NOT match within")
def _(root):
    # The bypass verbatim: a whole-file grep is still satisfied by the decoy on
    # its own line, so only a site-bound probe can see that the claim broke.
    text = (root / "lib" / "scoped.txt").read_text(encoding="utf-8")
    text = text.replace(f"{ANCHOR} {NEEDLE}", ANCHOR, 1)
    (root / "lib" / "scoped.txt").write_text(text, encoding="utf-8",
                                             newline="")


@case("grep-scoped when the anchor itself is gone: red, not satisfied", 1,
      "no longer exists")
def _(root):
    text = (root / "lib" / "scoped.txt").read_text(encoding="utf-8")
    (root / "lib" / "scoped.txt").write_text(
        text.replace(ANCHOR, "renamed-anchor", 1), encoding="utf-8",
        newline="")


@case("CTL-01/2 the needle survives only in a COMMENT on the anchor line", 1,
      "does NOT match within")
def _(root):
    # The id.ts shape: the call is replaced by something predictable and the
    # identifier is left behind in a comment describing what it used to do.
    text = (root / "lib" / "scoped.txt").read_text(encoding="utf-8")
    text = text.replace(f"{ANCHOR} {NEEDLE}",
                        f"{ANCHOR}\n// {NEEDLE}", 1)
    (root / "lib" / "scoped.txt").write_text(text, encoding="utf-8",
                                             newline="")


@case("CTL-01/2 the needle survives only in a TRAILING comment on that line", 1,
      "does NOT match within")
def _(root):
    # Found by this harness against the first CTL-01 fix, which blanked whole
    # comment LINES only. `token: nextId("rvt"), // nextCapabilityToken("rvt")`
    # kept the searched-for call on the exact line the claim names.
    text = (root / "lib" / "scoped.txt").read_text(encoding="utf-8")
    text = text.replace(f"{ANCHOR} {NEEDLE}", f"{ANCHOR} // {NEEDLE}", 1)
    (root / "lib" / "scoped.txt").write_text(text, encoding="utf-8",
                                             newline="")


@case("a URL's // is not treated as a comment (must PASS)", 0)
def _(root):
    # The over-stripping guard. If `//` after a colon were cut, every claim
    # about a line containing a URL would go red for no reason.
    text = (root / "lib" / "scoped.txt").read_text(encoding="utf-8")
    text = text.replace(f"{ANCHOR} {NEEDLE}",
                        f"{ANCHOR} {NEEDLE} https://example.invalid/x", 1)
    (root / "lib" / "scoped.txt").write_text(text, encoding="utf-8",
                                             newline="")


@case("CTL-01/1 a cap by .length assignment, naming no searched-for symbol", 1,
      "is TRUNCATED")
def _(root):
    # The decisive bypass. The old probe grepped for the identifier a PREVIOUS
    # cap used, so a genuinely equivalent cap written any other way passed.
    with (root / "lib" / "collection.ts").open(
            "a", encoding="utf-8", newline="") as handle:
        handle.write("store.events.length = 200;\n")


# ------------------------------- what independent review found still bypassable
#
# Every case below is a mutation an independent reviewer executed against the
# FIRST version of this repair, each of which exited 0. They are the reason the
# repair changed shape, so they stay as regressions.

@case("REVIEW/1 a cap by .filter rebind, naming no listed operation", 1,
      "is TRUNCATED")
def _(root):
    # The first no-truncation enumerated six spellings. `.filter` rebinds the
    # collection to a shorter copy and was in none of them.
    with (root / "lib" / "collection.ts").open(
            "a", encoding="utf-8", newline="") as handle:
        handle.write("store.events = store.events.filter((_, i) => i < 200);\n")


@case("REVIEW/1 the maximal truncation, store.events = []", 1, "is TRUNCATED")
def _(root):
    with (root / "lib" / "collection.ts").open(
            "a", encoding="utf-8", newline="") as handle:
        handle.write("store.events = [];\n")


@case("REVIEW/1 a spread-then-slice rebind", 1, "is TRUNCATED")
def _(root):
    # The idiom already used in the very file the real claim is about.
    with (root / "lib" / "collection.ts").open(
            "a", encoding="utf-8", newline="") as handle:
        handle.write("store.events = [...store.events].slice(0, 200);\n")


@case("REVIEW/3 a read-only .length === guard is NOT a cap (must PASS)", 0)
def _(root):
    # `\\.length\\s*=` also matched `===`, so a correct guard clause was
    # reported as a live retention cap. A control that cries wolf on correct
    # code teaches readers to ignore it.
    with (root / "lib" / "collection.ts").open(
            "a", encoding="utf-8", newline="") as handle:
        handle.write("const first = store.events.length === 0;\n")


@case("REVIEW/3 a no-argument .slice() defensive copy is NOT a cap (PASS)", 0)
def _(root):
    with (root / "lib" / "collection.ts").open(
            "a", encoding="utf-8", newline="") as handle:
        handle.write("const copy = store.events.slice();\n")


@case("REVIEW/2 a /* ... */ body is not code", 1, "does NOT match within")
def _(root):
    # Comment stripping was line-local, so any line inside a block comment that
    # did not itself begin with `*` was read as code. Two lines re-opened the
    # CSPRNG bypass on the real tree.
    text = (root / "lib" / "scoped.txt").read_text(encoding="utf-8")
    text = text.replace(f"{ANCHOR} {NEEDLE}",
                        f"{ANCHOR}\n/*\nwas {NEEDLE}\n*/", 1)
    (root / "lib" / "scoped.txt").write_text(text, encoding="utf-8",
                                             newline="")


@case("REVIEW/2 a one-line /* ... */ comment is not code", 1,
      "does NOT match within")
def _(root):
    text = (root / "lib" / "scoped.txt").read_text(encoding="utf-8")
    text = text.replace(f"{ANCHOR} {NEEDLE}", f"{ANCHOR} /* {NEEDLE} */", 1)
    (root / "lib" / "scoped.txt").write_text(text, encoding="utf-8",
                                             newline="")


@case("REVIEW/3 `anchor://needle` is a comment, not a match", 1,
      "does NOT match within")
def _(root):
    # `key://value` is valid JavaScript with the value on the next line. The
    # `(?<!:)` lookbehind added to spare URLs spared this too.
    text = (root / "lib" / "scoped.txt").read_text(encoding="utf-8")
    text = text.replace(f"{ANCHOR} {NEEDLE}", f"{ANCHOR}://{NEEDLE}", 1)
    (root / "lib" / "scoped.txt").write_text(text, encoding="utf-8",
                                             newline="")


@case("REVIEW/5 a protocol-relative string is not a comment (must PASS)", 0)
def _(root):
    # The mirror. Over-stripping truncates the line, which HIDES text from an
    # absent-style claim -- the direction a control may not fail in.
    text = (root / "lib" / "scoped.txt").read_text(encoding="utf-8")
    text = text.replace(f"{ANCHOR} {NEEDLE}",
                        f'const host = "//cdn.example.invalid";'
                        f' {ANCHOR} {NEEDLE}', 1)
    (root / "lib" / "scoped.txt").write_text(text, encoding="utf-8",
                                             newline="")


@case("REVIEW/2 grep-scoped-absent catches a forbidden call at the site", 1,
      "now MATCHES within")
def _(root):
    # Proximity alone is decoy-satisfiable: an unused correct call three lines
    # away kept a claim green while the generator returned a counter. Requiring
    # the WRONG call to be absent at the site is what excludes that.
    text = (root / "lib" / "scoped.txt").read_text(encoding="utf-8")
    text = text.replace(f"{ANCHOR} {NEEDLE}",
                        f"{ANCHOR} {NEEDLE} {FORBIDDEN}", 1)
    (root / "lib" / "scoped.txt").write_text(text, encoding="utf-8",
                                             newline="")


@case("grep-scoped-absent when the anchor is gone: red, not satisfied", 1,
      "no longer exists")
def _(root):
    # Deleting the site must not prove a claim about that site.
    text = (root / "lib" / "scoped.txt").read_text(encoding="utf-8")
    (root / "lib" / "scoped.txt").write_text(
        text.replace(ANCHOR, "renamed-anchor"), encoding="utf-8", newline="")


@case("REVIEW/4 an arg the probe does not read is REFUSED, not ignored", 2,
      "does not read args")
def _(root):
    # Renaming `within` to `withn` silently restored the permissive default and
    # the claim went on reporting that it held. One character re-opened a
    # closed bypass.
    def mutate(claim):
        claim["args"]["withn"] = claim["args"].pop("within")
    amend(root, "g-scoped", mutate)


@case("REVIEW/5 CTL-02 gutting a claim's BODY while keeping its id", 1,
      "REQUIRED CLAIM REDEFINED f-present")
def _(root):
    # Cheaper and quieter than deletion: the claim count is unchanged and the
    # coverage line is byte-identical to a clean run.
    def mutate(claim):
        claim["probe"] = "file-present"
        claim["args"] = {"path": "second.txt"}
    amend(root, "f-present", mutate)


@case("CTL-02 an AUTHORIZED amendment is accepted (must PASS)", 0)
def _(root):
    data = json.loads((root / "claims.json").read_text(encoding="utf-8"))
    for claim in data["claims"]:
        if claim["id"] == "f-present":
            claim["args"] = {"path": "second.txt"}
    data["amended_claims"] = [{
        "id": "f-present",
        "reason": "the fixture now tracks a different file on purpose",
        "authorized_by": "harness fixture",
    }]
    write_manifest(root, data)


@case("CTL-02 an amendment with no reason or authority: exit 2", 2,
      "not a reviewed authorization")
def _(root):
    data = json.loads((root / "claims.json").read_text(encoding="utf-8"))
    for claim in data["claims"]:
        if claim["id"] == "f-present":
            claim["args"] = {"path": "second.txt"}
    data["amended_claims"] = [{"id": "f-present"}]
    write_manifest(root, data)


@case("CTL-02 the pin moved BACKWARD past a claim: exit 2", 2,
      "is not an ancestor of HEAD")
def _(root):
    # Without an ancestry check the pin can be moved back to a commit predating
    # a claim's introduction, dropping it with no retirement record at all.
    data = json.loads((root / "claims.json").read_text(encoding="utf-8"))
    pin = git(["rev-parse", "HEAD"], root)
    # Move HEAD back FIRST -- checking out an earlier commit would otherwise
    # revert the manifest this case is about -- then rewrite it in place.
    # --force because scratch() rewrites the manifest after committing it, so
    # the working copy always differs. The manifest is rewritten below anyway.
    git(["checkout", "--quiet", "--force", "HEAD~1"], root)
    data["required_claims_baseline"]["commit"] = pin
    write_manifest(root, data)


@case("CTL-02 a baseline pinned by TAG is accepted (must PASS)", 0)
def _(root):
    # A bare branch commit does not survive a squash merge; an annotated tag
    # does. Both forms must resolve.
    git(["tag", "-a", "fixture-baseline-tag", "-m", "baseline"], root)
    data = json.loads((root / "claims.json").read_text(encoding="utf-8"))
    data["required_claims_baseline"] = {
        "tag": "fixture-baseline-tag", "path": "claims.json"}
    write_manifest(root, data)


@case("no-truncation also catches splice", 1, "is TRUNCATED")
def _(root):
    with (root / "lib" / "collection.ts").open(
            "a", encoding="utf-8", newline="") as handle:
        handle.write("store.events.splice(0, 5);\n")


@case("no-truncation: a cap hidden in a comment is NOT a cap", 0)
def _(root):
    # The mirror of the case above, and the reason comment-blanking has to cut
    # both ways: a commented-out cap evicts nothing, so reporting red here would
    # be a false alarm that trains readers to ignore the control.
    with (root / "lib" / "collection.ts").open(
            "a", encoding="utf-8", newline="") as handle:
        handle.write("// store.events.length = 200;\n")


@case("no-truncation when the collection is gone: red, nothing measured", 1,
      "does not appear")
def _(root):
    (root / "lib" / "collection.ts").write_text(
        "export function append() {}\n", encoding="utf-8", newline="")


# ----------------------------------------- CTL-02: the manifest is now checked

@case("CTL-02 DELETING a required claim: red, and it names the id", 1,
      "REQUIRED CLAIM DELETED f-present")
def _(root):
    # Before the repair this took coverage from 15 claims to 14 and exited 0,
    # which made deleting the claim the cheapest way to turn any red green.
    data = json.loads((root / "claims.json").read_text(encoding="utf-8"))
    data["claims"] = [c for c in data["claims"] if c["id"] != "f-present"]
    write_manifest(root, data)


@case("CTL-02 REPLACING a claim keeps the count and still fails", 1,
      "REQUIRED CLAIM DELETED f-present")
def _(root):
    # A count floor alone would be satisfied here: one claim in, one claim out.
    data = json.loads((root / "claims.json").read_text(encoding="utf-8"))
    for claim in data["claims"]:
        if claim["id"] == "f-present":
            claim["id"] = "a-cheap-substitute"
    write_manifest(root, data)


@case("CTL-02 an AUTHORIZED retirement is accepted (must PASS)", 0)
def _(root):
    # The escape hatch has to work, or the only way to retire a genuinely
    # obsolete claim would be to disable the check.
    data = json.loads((root / "claims.json").read_text(encoding="utf-8"))
    data["claims"] = [c for c in data["claims"] if c["id"] != "f-present"]
    data["retired_claims"] = [{
        "id": "f-present",
        "reason": "the fixture file was intentionally removed",
        "authorized_by": "harness fixture",
    }]
    write_manifest(root, data)


@case("CTL-02 a retirement with no reason or authority: exit 2", 2,
      "not a reviewed authorization")
def _(root):
    data = json.loads((root / "claims.json").read_text(encoding="utf-8"))
    data["claims"] = [c for c in data["claims"] if c["id"] != "f-present"]
    data["retired_claims"] = [{"id": "f-present"}]
    write_manifest(root, data)


@case("CTL-02 the baseline declaration is removed: exit 2, never 0", 2,
      "declares no 'required_claims_baseline'")
def _(root):
    # Deleting the check must not be a way to pass it.
    data = json.loads((root / "claims.json").read_text(encoding="utf-8"))
    data.pop("required_claims_baseline")
    write_manifest(root, data)


@case("CTL-02 the pinned baseline commit cannot be read: exit 2", 2,
      "could not be read")
def _(root):
    # The shallow-clone case. Nothing is known about what SHOULD be present, so
    # a green verdict here would assert coverage on no evidence.
    data = json.loads((root / "claims.json").read_text(encoding="utf-8"))
    data["required_claims_baseline"]["commit"] = "d" * 40
    write_manifest(root, data)


@case("CTL-02 the baseline commit is not an object name: exit 2", 2,
      "hexadecimal object name")
def _(root):
    data = json.loads((root / "claims.json").read_text(encoding="utf-8"))
    data["required_claims_baseline"]["commit"] = "HEAD"
    write_manifest(root, data)


@case("CTL-02 the baseline manifest blob is not parseable: exit 2", 2,
      "not parseable")
def _(root):
    data = json.loads((root / "claims.json").read_text(encoding="utf-8"))
    data["required_claims_baseline"]["path"] = "present.txt"
    write_manifest(root, data)


# --------------------------------------------------------- fail closed: files
#
# The SEC-6 class. A regex over a file that is not there matches nothing, which
# is byte-identical to a genuine grep-absent pass. If either of these ever
# returned 0 the control would be worthless in exactly the situation it exists
# for: someone deletes or renames the file, and the record keeps its green tick.

@case("grep-present over a MISSING file: exit 2, not a verdict", 2,
      "never searched")
def _(root):
    (root / "lib" / "needle.txt").unlink()


@case("grep-absent over a MISSING file: exit 2, NEVER 'claim still holds'", 2,
      "never searched")
def _(root):
    (root / "lib" / "clean.txt").unlink()


@case("grep over a directory in the file's place: exit 2", 2,
      "could not be read")
def _(root):
    path = root / "lib" / "clean.txt"
    path.unlink()
    path.mkdir()


@case("grep over bytes that are not UTF-8: exit 2", 2, "could not be read")
def _(root):
    (root / "lib" / "clean.txt").write_bytes(b"\xff\xfe\x00 not utf-8 \xc3\x28")


# ----------------------------------------------------------- fail closed: git

@case("git is not executable at all: exit 2, and no tag claim is judged", 2,
      "git could not be executed")
def _(root):
    (root / ".break-git-absent").write_text("intentional\n", encoding="utf-8",
                                            newline="")


@case("git exits non-zero: exit 2, not a tag verdict", 2,
      "for-each-ref refs/tags` failed")
def _(root):
    (root / ".break-git-failing").write_text("intentional\n", encoding="utf-8",
                                             newline="")


@case("repository reports NO tags (the unfetched-tags case): exit 2", 2,
      "no tags whatsoever")
def _(root):
    # The case that matters in CI. A shallow checkout that never fetched tags
    # reports zero tags, and in that state "absent" and "never fetched" are the
    # same observation -- so a tag-absent claim would otherwise pass on no
    # evidence whatsoever.
    for tag in ("fixture-present-tag", "fixture-pinned-tag",
                "fixture-annotated-tag"):
        git(["tag", "-d", tag], root)


# ------------------------------------------------------ fail closed: manifest

@case("manifest does not exist: exit 2", 2, "cannot read the claim manifest")
def _(root):
    (root / "claims.json").unlink()


@case("manifest is not JSON: exit 2", 2, "not parseable JSON")
def _(root):
    (root / "claims.json").write_text("{not json", encoding="utf-8", newline="")


@case("manifest is not version 1: exit 2", 2, "not a version-1 object")
def _(root):
    data = json.loads((root / "claims.json").read_text(encoding="utf-8"))
    data["version"] = 99
    write_manifest(root, data)


@case("manifest has no claims list: exit 2", 2, "no 'claims' list")
def _(root):
    write_manifest(root, {"version": 1, "claims": "all of them"})


@case("manifest has ZERO claims: exit 2, never a vacuous pass", 2,
      "contains no claims")
def _(root):
    # This repository has twice shipped a control that reported green having
    # measured nothing. An empty manifest is that failure exactly.
    write_manifest(root, {"version": 1, "claims": []})


@case("two claims share one id: exit 2", 2, "appears more than once")
def _(root):
    data = json.loads((root / "claims.json").read_text(encoding="utf-8"))
    data["claims"].append(dict(data["claims"][0]))
    write_manifest(root, data)


@case("a claim has no id: exit 2", 2, "no usable 'id'")
def _(root):
    data = json.loads((root / "claims.json").read_text(encoding="utf-8"))
    data["claims"][0].pop("id")
    write_manifest(root, data)


@case("a claim has no red_means: exit 2", 2, "claim is missing")
def _(root):
    amend(root, "f-present", lambda c: c.pop("red_means"))


@case("unknown probe type: exit 2, not silently skipped", 2,
      "is not implemented by this verifier")
def _(root):
    amend(root, "f-present", lambda c: c.update({"probe": "vibes-present"}))


@case("blank probe argument: exit 2", 2, "missing, blank, or not a string")
def _(root):
    amend(root, "f-present", lambda c: c.update({"args": {"path": "  "}}))


@case("absolute path in a claim: exit 2", 2, "is absolute")
def _(root):
    amend(root, "f-present", lambda c: c.update({"args": {"path": "/etc/passwd"}}))


@case("path escaping the repository via '..': exit 2", 2,
      "leaves the repository")
def _(root):
    amend(root, "f-present",
          lambda c: c.update({"args": {"path": "../outside.txt"}}))


@case("backslash path: exit 2, so a manifest means one thing everywhere", 2,
      "must use forward slashes")
def _(root):
    amend(root, "f-present",
          lambda c: c.update({"args": {"path": "lib\\clean.txt"}}))


@case("pattern is not a valid regular expression: exit 2", 2,
      "not a valid regular expression")
def _(root):
    amend(root, "g-present", lambda c: c.update(
        {"args": {"path": "lib/needle.txt", "pattern": "unclosed(["}}))


@case("tag-at-commit given something that is not an object name: exit 2", 2,
      "hexadecimal object name")
def _(root):
    amend(root, "t-pinned", lambda c: c.update(
        {"args": {"tag": "fixture-pinned-tag", "commit": "HEAD"}}))


@case("grep-scoped with no anchor: exit 2", 2, "requires args anchor")
def _(root):
    amend(root, "g-scoped", lambda c: c.update(
        {"args": {"path": "lib/scoped.txt", "pattern": NEEDLE}}))


@case("grep-scoped with a non-integer within: exit 2", 2,
      "not a non-negative integer")
def _(root):
    amend(root, "g-scoped", lambda c: c.update(
        {"args": {"path": "lib/scoped.txt", "anchor": ANCHOR,
                  "pattern": NEEDLE, "within": "close enough"}}))


@case("grep-scoped with a negative within: exit 2", 2,
      "not a non-negative integer")
def _(root):
    amend(root, "g-scoped", lambda c: c.update(
        {"args": {"path": "lib/scoped.txt", "anchor": ANCHOR,
                  "pattern": NEEDLE, "within": -1}}))


@case("grep-scoped with an unparseable anchor: exit 2", 2,
      "not a valid regular expression")
def _(root):
    amend(root, "g-scoped", lambda c: c.update(
        {"args": {"path": "lib/scoped.txt", "anchor": "unclosed(",
                  "pattern": NEEDLE, "within": 0}}))


@case("no-truncation with no collection named: exit 2", 2,
      "requires args collection")
def _(root):
    amend(root, "nt-events", lambda c: c.update(
        {"args": {"path": "lib/collection.ts"}}))


@case("no-truncation over a MISSING file: exit 2, not a pass", 2,
      "never searched")
def _(root):
    (root / "lib" / "collection.ts").unlink()


@case("code_only given a non-boolean: exit 2", 2, "is not a boolean")
def _(root):
    amend(root, "g-present", lambda c: c.update(
        {"args": {"path": "lib/needle.txt", "pattern": NEEDLE,
                  "code_only": "yes"}}))


@case("code_only excludes a commented-out match (grep-present goes red)", 1,
      "no longer matches")
def _(root):
    # Proves the option is actually wired, not merely accepted: with the only
    # occurrence commented out, a code claim must not read as satisfied.
    amend(root, "g-present", lambda c: c.update(
        {"args": {"path": "lib/needle.txt", "pattern": NEEDLE,
                  "code_only": True}}))
    (root / "lib" / "needle.txt").write_text(
        f"alpha\n// {NEEDLE}\nomega\n", encoding="utf-8", newline="")


# ------------------------------------------------------------------ precedence

@case("one red claim AND one unevaluable claim: exit 2 dominates exit 1", 2,
      "not a complete measurement")
def _(root):
    # A run that did not measure everything has not produced a complete verdict
    # about anything, so exiting 1 here would report a finished judgement.
    (root / "present.txt").unlink()                       # red
    amend(root, "g-present", lambda c: c.update(          # unevaluable
        {"args": {"path": "lib/needle.txt", "pattern": "bad(["}}))


@case("an unevaluable claim says it reached no verdict", 2,
      "must not be read as evidence")
def _(root):
    (root / "lib" / "clean.txt").unlink()


def matrix():
    passed = failed = 0
    print(f"{'case':72s} {'expect':>6s} {'got':>4s}  result")
    for label, expect, expect_text, mutate in CASES:
        with tempfile.TemporaryDirectory() as tmp:
            root = scratch(tmp)
            mutate(root)
            code, out = run_in(root)
            ok = code == expect
            note = ""
            if ok and expect_text and expect_text not in out:
                ok = False
                note = f"  (missing from output: {expect_text!r})"
            passed += ok
            failed += not ok
            print(f"{label:72s} {expect:>6d} {code:>4d}  "
                  f"{'PASS' if ok else '*** FAIL ***'}{note}")
    return passed, failed


def null_audit():
    """Rule 2, applied to every case rather than to one baseline."""
    passed = failed = 0
    print("\nNULL AUDIT -- every case with its mutation SKIPPED must exit 0")
    print(f"{'case (mutation not applied)':72s} {'expect':>6s} {'got':>4s}  result")
    for label, _expect, _text, _mutate in CASES:
        with tempfile.TemporaryDirectory() as tmp:
            root = scratch(tmp)
            # Deliberately no mutate(root) here. That omission is the test.
            code, _out = run_in(root)
            ok = code == 0
            passed += ok
            failed += not ok
            print(f"{label:72s} {0:>6d} {code:>4d}  "
                  f"{'PASS' if ok else '*** FAIL ***'}")
    if failed:
        print(f"\n{failed} case(s) produce a non-zero verdict WITHOUT their "
              f"mutation. Those cases measure the starting state, not the "
              f"mutation, and their matrix results mean nothing.")
    return passed, failed


# ---------------------------------------------------------------------------
# phase 3 -- the seeded claims, each inverted inside a throwaway clone
#
# A seeded claim that cannot be made to fail is decoration. Every grep-absent
# claim needs a literal that violates it, and no generic rule can derive one
# from a regular expression, so they are written out here. The coverage check
# fails when the manifest grows a grep-absent claim this table does not cover,
# which is what stops a future claim arriving unproven.
# ---------------------------------------------------------------------------

# Violations must be real CODE. These claims now carry code_only, which blanks
# comment-only lines, so the commented-out violations this table used to hold
# would no longer turn anything red -- the red arm would fail and the claim
# would look uninvertible. A commented-out cap is genuinely not a cap; proving
# the claim red requires breaking it for real.
GREP_ABSENT_VIOLATIONS = {
    "sec6-review-token-not-nextid":
        '\nconst staleToken = nextId("rvt");\n',
    "next-config-not-standalone":
        '\nconst deployTarget = { output: "standalone" };\n',
}

# A site-bound claim deserves a site-bound inversion. Emptying the file would
# turn these red too, but only by deleting the anchor -- which proves the probe
# reads the file and nothing about whether it binds to the claimed line. Each
# entry below leaves the searched-for text in the file and moves it OFF the
# site, which is the CTL-01 bypass itself.
# What to place AT the site to violate a scoped-absent claim. Written out per
# claim because the forbidden text is the point of the claim and no generic
# rule derives it from a regular expression.
SCOPED_ABSENT_VIOLATIONS = {
    "capability-token-not-from-nextid": "return nextId(prefix);",
}

SCOPED_VIOLATIONS = {
    "sec6-review-token-from-csprng": (
        '    token: nextCapabilityToken("rvt"),',
        '    token: nextId("rvt"), // nextCapabilityToken("rvt")',
    ),
    "capability-token-uses-node-crypto": (
        '  return `${prefix}-${randomUUID().replace(/-/g, "")}`;',
        '  // Formerly built over randomUUID() from node:crypto.\n'
        '  return nextId(prefix);',
    ),
    "timeline-retention-guarded-by-test": (
        "    expect(all).toHaveLength(205);",
        "    expect(all).toHaveLength(1);\n"
        "    expect(new Array(205)).toHaveLength(205);",
    ),
    "timeline-retention-test-appends-205": (
        "for (let index = 0; index < 205; index += 1)",
        "for (let index = 0; index < 1; index += 1)",
    ),
    # Dropping the node project stops the retention test executing anywhere,
    # while the two claims that pin its TEXT stay green.
    "retention-test-executes-in-ci": (
        "run: npx vitest run --project node",
        "run: npx vitest run --project dom",
    ),
}


def clone(tmp):
    """A clone of this repository at HEAD, carrying its real tags.

    Cloned rather than fabricated so the tags are the genuine article: a
    fixture tag would prove the probe reads tags, not that these claims read
    THESE tags. The two uncommitted control files are copied in on top.
    """
    assert_sandbox(tmp)
    dest = pathlib.Path(tmp) / "clone"
    out = subprocess.run(
        ["git", "clone", "--local", "--quiet", REPO, str(dest)],
        capture_output=True)
    if out.returncode != 0:
        raise SystemExit("could not clone this repository for the live phase: "
                         + out.stderr.decode("utf-8", errors="replace"))
    shutil.copy(os.path.join(REPO, VERIFIER), dest / "scripts")
    shutil.copy(MANIFEST, dest / "docs" / "claims.json")
    return dest


def seed_one_claim(root, claim):
    """Write, commit, and pin a one-claim manifest inside the clone.

    The verifier reads its required-claims baseline out of git history, so a
    manifest that exists only in the working tree cannot be evaluated at all
    (exit 2, by design). Committing this one and pinning the baseline at that
    commit makes the required set exactly this claim, so the phase measures the
    claim rather than the coverage check.
    """
    write_manifest(root, {"version": 1, "claims": [claim]}, "one-claim.json")
    git(["add", "one-claim.json"], root)
    git(["commit", "-m", f"seed {claim['id']}"], root, check=False)
    base = git(["rev-parse", "HEAD"], root)
    write_manifest(root, {
        "version": 1,
        "required_claims_baseline": {"commit": base, "path": "one-claim.json"},
        "retired_claims": [],
        "claims": [claim],
    }, "one-claim.json")


def invert(root, claim):
    """Break exactly what `claim` asserts.

    Returns (description, undo) or (None, None) when this harness does not know
    how to invert the claim -- which is itself reported as a failure.
    """
    probe, args = claim["probe"], claim["args"]

    if probe in ("tag-present", "tag-at-commit", "tag-absent"):
        tag = args["tag"]
        was = git(["rev-parse", "--verify", "--quiet", f"refs/tags/{tag}^{{commit}}"],
                  root, check=False)

        def undo():
            if was:
                git(["tag", "-f", tag, was], root, check=False)
            else:
                git(["tag", "-d", tag], root, check=False)

        if probe == "tag-absent":
            git(["tag", tag, "HEAD"], root)
            return f"created tag {tag}", undo
        if probe == "tag-present":
            git(["tag", "-d", tag], root)
            return f"deleted tag {tag}", undo
        git(["tag", "-f", tag, "HEAD"], root)
        return f"force-moved tag {tag} onto HEAD", undo

    if probe == "tag-annotated":
        tag = args["tag"]
        # The tag OBJECT, not the commit it peels to. Restoring the ref to this
        # object is what puts the annotation back.
        obj = git(["rev-parse", f"refs/tags/{tag}"], root)
        at = git(["rev-parse", f"refs/tags/{tag}^{{commit}}"], root)

        def undo():
            git(["update-ref", f"refs/tags/{tag}", obj], root, check=False)

        git(["tag", "-d", tag], root)
        git(["tag", tag, at], root)
        return (f"replaced annotated tag {tag} with a lightweight ref at the "
                f"same commit"), undo

    path = root / args["path"]

    def restore_tracked():
        git(["checkout", "--", args["path"]], root, check=False)

    if probe == "file-present":
        path.unlink()
        return f"deleted {args['path']}", restore_tracked
    if probe == "file-absent":
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("x\n", encoding="utf-8", newline="")
        return f"created {args['path']}", lambda: path.unlink(missing_ok=True)
    if probe == "grep-present":
        path.write_text("", encoding="utf-8", newline="")
        return f"emptied {args['path']}", restore_tracked
    if probe == "grep-absent":
        violation = GREP_ABSENT_VIOLATIONS.get(claim["id"])
        if violation is None:
            return None, None
        with path.open("a", encoding="utf-8", newline="") as handle:
            handle.write(violation)
        return (f"appended {violation.strip()!r} to {args['path']}",
                restore_tracked)
    if probe == "grep-scoped":
        pair = SCOPED_VIOLATIONS.get(claim["id"])
        if pair is None:
            return None, None
        find, replace = pair
        text = path.read_text(encoding="utf-8")
        if find not in text:
            return None, None
        path.write_text(text.replace(find, replace, 1), encoding="utf-8",
                        newline="")
        return (f"moved the claimed text off its site in {args['path']}",
                restore_tracked)
    if probe == "grep-scoped-absent":
        # Derived, not tabulated: the claim says a pattern must not appear at a
        # site, so the inversion is to put it there. The anchor line is the
        # site, so appending to it is the minimal violation.
        lines = path.read_text(encoding="utf-8").splitlines()
        anchor = re.compile(args["anchor"])
        for number, line in enumerate(lines):
            if anchor.search(line):
                lines[number] = line + " " + SCOPED_ABSENT_VIOLATIONS[claim["id"]]
                path.write_text("\n".join(lines) + "\n", encoding="utf-8",
                                newline="")
                return (f"put the forbidden text on the claimed site in "
                        f"{args['path']}"), restore_tracked
        return None, None
    if probe == "no-truncation":
        # Derived from the claim rather than tabulated: the probe looks for the
        # truncating operation, so the inversion is to perform one.
        violation = f"\n{args['collection']}.length = 200;\n"
        with path.open("a", encoding="utf-8", newline="") as handle:
            handle.write(violation)
        return (f"capped {args['collection']} in {args['path']}",
                restore_tracked)
    return None, None


def live():
    """Every seeded claim, inverted in a clone, must go red naming itself."""
    passed = failed = 0
    print("\nLIVE DISCRIMINATION -- every claim in docs/claims.json, inverted")
    try:
        claims = json.loads(
            pathlib.Path(MANIFEST).read_text(encoding="utf-8"))["claims"]
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(f"  [*** FAIL ***] docs/claims.json is unusable: {error}")
        return 0, 1
    if not claims:
        print("  [*** FAIL ***] docs/claims.json seeds no claims at all")
        return 0, 1

    stale = [c["id"] for c in claims if c.get("probe") == "grep-absent"
             and c["id"] not in GREP_ABSENT_VIOLATIONS]
    ok = not stale
    passed += ok
    failed += not ok
    print(f"  [{'PASS' if ok else '*** FAIL ***'}] every grep-absent claim has "
          f"a violating fixture in this harness"
          + (f" (unproven: {', '.join(stale)})" if stale else ""))

    unscoped = [c["id"] for c in claims if c.get("probe") == "grep-scoped"
                and c["id"] not in SCOPED_VIOLATIONS]
    ok = not unscoped
    passed += ok
    failed += not ok
    print(f"  [{'PASS' if ok else '*** FAIL ***'}] every grep-scoped claim has "
          f"a site-bound violating fixture"
          + (f" (unproven: {', '.join(unscoped)})" if unscoped else ""))

    unforbidden = [c["id"] for c in claims
                   if c.get("probe") == "grep-scoped-absent"
                   and c["id"] not in SCOPED_ABSENT_VIOLATIONS]
    ok = not unforbidden
    passed += ok
    failed += not ok
    print(f"  [{'PASS' if ok else '*** FAIL ***'}] every grep-scoped-absent "
          f"claim has a forbidden-text fixture"
          + (f" (unproven: {', '.join(unforbidden)})" if unforbidden else ""))

    with tempfile.TemporaryDirectory() as tmp:
        root = clone(tmp)
        for claim in claims:
            identifier = claim["id"]
            seed_one_claim(root, claim)

            code, _out = run_in(root, "one-claim.json")
            green = code == 0
            passed += green
            failed += not green
            print(f"  [{'PASS' if green else '*** FAIL ***'}] null arm  "
                  f"{identifier:40s} exit {code} (wanted 0)")

            note, undo = invert(root, claim)
            if note is None:
                failed += 1
                print(f"  [*** FAIL ***] red arm   {identifier:40s} this "
                      f"harness cannot invert probe {claim['probe']!r}")
                continue

            code, out = run_in(root, "one-claim.json")
            named = identifier in out
            red = code != 0 and named
            passed += red
            failed += not red
            detail = "" if named else "  (output does not name the claim)"
            print(f"  [{'PASS' if red else '*** FAIL ***'}] red arm   "
                  f"{identifier:40s} exit {code} (wanted non-zero) after "
                  f"{note}{detail}")

            undo()
            code, _out = run_in(root, "one-claim.json")
            back = code == 0
            passed += back
            failed += not back
            print(f"  [{'PASS' if back else '*** FAIL ***'}] restored "
                  f"{identifier:40s} exit {code} (wanted 0)")
    return passed, failed


def main():
    flags = set(sys.argv[1:])
    unknown = flags - {"--matrix-only", "--null-audit", "--live"}
    if unknown:
        raise SystemExit(f"unknown argument(s): {' '.join(sorted(unknown))}")

    passed = failed = 0
    # `in flags`, not `== flags`: `--matrix-only --live` used to run only the
    # live phase and silently skip the matrix it named.
    if not flags or "--matrix-only" in flags:
        p, f = matrix()
        passed, failed = passed + p, failed + f
    if not flags or "--null-audit" in flags:
        p, f = null_audit()
        passed, failed = passed + p, failed + f
    if not flags or "--live" in flags:
        p, f = live()
        passed, failed = passed + p, failed + f

    print(f"\n{passed} passed, {failed} failed")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
