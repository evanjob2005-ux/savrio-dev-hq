"""Negative controls for verify-workflow-structure.py.

The previous version of that verifier passed review-by-reading and failed
review-by-mutation: it caught 3 of these 10 and reported success when it had
compared nothing. So the verifier now ships with the mutations that killed it.

Each case mutates a workflow in a scratch copy of the repository, runs the
verifier, and asserts the expected exit code -- and, where the case is about
the verifier explaining itself, an expected substring of its output.

Run from the repository root:

    python scripts/test-verify-workflow-structure.py

That runs two phases:

  1. the mutation matrix -- each case applied, exit code asserted;
  2. the null audit -- every case re-run with its mutation SKIPPED, which must
     produce exit 0 for all of them. See `null_audit` for why.

Pass --matrix-only or --null-audit to run just one phase.
"""

import pathlib
import shutil
import subprocess
import sys
import tempfile

VERIFIER = "scripts/verify-workflow-structure.py"
BASE = "origin/feature/dev-hq-operating-system"


def run_in(root, *args):
    out = subprocess.run([sys.executable, VERIFIER, *args], cwd=root,
                         capture_output=True)
    return out.returncode, out.stdout.decode("utf-8", errors="replace")


def scratch(tmp):
    """A copy whose workflows are RESTORED TO BASE before any mutation.

    This restore is the whole reason the harness is worth running. The previous
    version copied the working tree, which on any branch that touches a workflow
    already differs from base -- so the verifier exited non-zero before a single
    mutation was applied, and every case asserting failure passed for free.
    Replacing all ten mutations with `pass` still produced eight passes.

    Starting from base makes each case measure its own mutation. See
    standards/CONTROL_VERIFICATION_STANDARD.md rules 2 and 3.
    """
    dest = pathlib.Path(tmp) / "repo"
    dest.mkdir()
    shutil.copytree(".git", dest / ".git", symlinks=True)
    shutil.copytree(".github/workflows", dest / ".github/workflows")
    shutil.copytree("scripts", dest / "scripts")

    listing = subprocess.run(
        ["git", "ls-tree", "--name-only", f"{BASE}:.github/workflows"],
        cwd=dest, capture_output=True)
    names = [n for n in listing.stdout.decode("utf-8").split("\n") if n.strip()]
    if not names:
        raise SystemExit(f"FATAL: cannot list workflows at {BASE}; harness would be vacuous")
    for name in names:
        blob = subprocess.run(["git", "show", f"{BASE}:.github/workflows/{name}"],
                              cwd=dest, capture_output=True)
        (dest / ".github/workflows" / name).write_bytes(blob.stdout)
    for extra in (dest / ".github/workflows").glob("*.y*ml"):
        if extra.name not in names:
            extra.unlink()
    return dest


def edit(root, name, old, new, count=1):
    p = root / ".github/workflows" / name
    text = p.read_text(encoding="utf-8")
    assert old in text, f"fixture text not found in {name}: {old[:60]!r}"
    p.write_text(text.replace(old, new, count), encoding="utf-8", newline="")


CASES = []


def case(label, expect, expect_text=None):
    """Register a case. `expect_text` must appear in the verifier's stdout.

    The exit code alone is not enough for the exit-2 cases: rule 5 requires the
    control to state what it could not do, so those cases assert the message as
    well as the status.
    """
    def wrap(fn):
        CASES.append((label, expect, expect_text, fn))
        return fn
    return wrap


@case("NULL ARM: no mutation applied (must PASS)", 0)
def _(root):
    # Rule 2. Without this case, every "must FAIL" case below could be passing
    # because of the starting state rather than because of its mutation. This
    # arm is what makes the others mean anything.
    pass


@case("delete an `if:` guard (the original defect)", 1)
def _(root):
    edit(root, "ci.yml",
         "      - name: Pin npm to the version that produced the lockfile\n"
         "        if: steps.detect.outputs.node == 'true'\n",
         "      - name: Pin npm to the version that produced the lockfile\n")


@case("alter a `run:` command", 1)
def _(root):
    edit(root, "ci.yml", "run: npm ci", "run: npm install")


@case("change a pinned action SHA", 1)
def _(root):
    edit(root, "lint.yml", "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1",
         "actions/checkout@0000000000000000000000000000000000000000")


@case("change a `with:` input (node-version)", 1)
def _(root):
    edit(root, "ci.yml", 'node-version: "22"', 'node-version: "18"')


@case("rename a step", 1)
def _(root):
    edit(root, "ci.yml", "- name: Verify required repository files",
         "- name: Verify repository files")


@case("delete `id: detect` (guards silently stop matching)", 1)
def _(root):
    edit(root, "ci.yml", "        id: detect\n", "")


@case("delete a whole step", 1)
def _(root):
    edit(root, "ci.yml",
         "      - name: Detect trailing whitespace\n"
         "        id: whitespace\n", "      - name: PLACEHOLDER_REMOVED\n")


@case("base ref missing: must NOT report success", 2, "CANNOT COMPARE")
def _(root):
    subprocess.run(["git", "update-ref", "-d", f"refs/remotes/{BASE.split('/', 1)[1]}"
                    if BASE.startswith("origin/") else BASE],
                   cwd=root, capture_output=True)
    subprocess.run(["git", "update-ref", "-d",
                    "refs/remotes/origin/feature/dev-hq-operating-system"],
                   cwd=root, capture_output=True)


@case("workflow file deleted", 1)
def _(root):
    (root / ".github/workflows/lint.yml").unlink()


@case("RESTORED: reorder two steps", 1)
def _(root):
    # Dropped from the previous matrix. The old verifier MISSED this, because
    # two swapped steps with identical `if` values look identical to a
    # positional comparison of `if` alone.
    p = root / ".github/workflows/ci.yml"
    s = p.read_text(encoding="utf-8")
    a = "      - name: Detect unresolved merge conflict markers\n"
    b = "      - name: Detect trailing whitespace\n"
    assert a in s and b in s
    s = s.replace(a, "@@SWAP@@").replace(b, a).replace("@@SWAP@@", b)
    p.write_text(s, encoding="utf-8", newline="")


@case("RESTORED: rename a job", 1)
def _(root):
    edit(root, "ci.yml", "  application-validation:", "  application-validation-renamed:")


@case("job-level `if: false` disables a whole job", 1)
def _(root):
    # Strictly worse than the original guard-deletion defect: one line disables
    # lint, type-check, build and the npm pin together, and both step count and
    # guard count stay identical.
    edit(root, "ci.yml",
         "  application-validation:\n",
         "  application-validation:\n    if: false\n")


@case("remove the pull_request trigger", 1)
def _(root):
    edit(root, "ci.yml",
         "  pull_request:\n    branches:\n      - main\n",
         "  pull_request_DISABLED:\n    branches:\n      - main\n")


@case("escalate workflow permissions", 1)
def _(root):
    edit(root, "ci.yml", "permissions:\n  contents: read",
         "permissions:\n  contents: write")


@case("change runs-on to a self-hosted runner", 1)
def _(root):
    edit(root, "ci.yml", "runs-on: ubuntu-latest", "runs-on: self-hosted", count=1)


# ---------------------------------------------------------------------------
# CI-03. Written by an independent reviewer, not by the verifier's author, and
# every one of these passed the verifier undetected until JOB_FIELDS and
# WORKFLOW_FIELDS were widened. Rule 4: the author's own mutations only cover
# the failure modes the author already imagined.
# ---------------------------------------------------------------------------


@case("job-level `continue-on-error: true` (lint/build may fail, job green)", 1)
def _(root):
    # The worst of the set. Lint, type-check and build can all fail while the
    # workflow reports success, and the verifier's two summary numbers do not
    # move: step count 21->21, guard count 8->8.
    edit(root, "ci.yml",
         "  application-validation:\n",
         "  application-validation:\n    continue-on-error: true\n")


@case("job-level `env:` rewrites the environment of every step", 1)
def _(root):
    edit(root, "ci.yml",
         "  application-validation:\n",
         "  application-validation:\n    env:\n      NODE_ENV: production\n")


@case("job-level `uses:` replaces the job with a reusable workflow", 1)
def _(root):
    edit(root, "ci.yml",
         "  structured-data:\n",
         "  structured-data:\n    uses: attacker/evil/.github/workflows/x.yml@main\n")


@case("job-level `outputs:` (downstream `needs.*.outputs` guards read these)", 1)
def _(root):
    edit(root, "ci.yml",
         "  application-validation:\n",
         "  application-validation:\n    outputs:\n"
         "      node: ${{ steps.detect.outputs.node }}\n")


@case("rename the workflow (breaks required-status-check matching)", 1)
def _(root):
    edit(root, "ci.yml", "name: Continuous Integration\n", "name: CI (disabled)\n")


# ---------------------------------------------------------------------------
# CI-10. "Could not evaluate" must be distinguishable from "property violated"
# and must say what it could not do -- rule 5. Both of these exited 1 with an
# uncaught traceback before the fix, which is the code reserved for a detected
# violation.
# ---------------------------------------------------------------------------


@case("unparseable YAML: exit 2, not 1, and say so", 2,
      "is not parseable YAML")
def _(root):
    (root / ".github/workflows/ci.yml").write_text(
        "name: broken\non: push\njobs:\n  a:\n   - [unclosed\n",
        encoding="utf-8", newline="")


@case("workflow parses but is not a mapping: exit 2, and say so", 2,
      "did not parse as a mapping")
def _(root):
    (root / ".github/workflows/ci.yml").write_text(
        "- this is a list, not a workflow\n", encoding="utf-8", newline="")


@case("workflow present but unreadable: exit 2, not the exit 1 of DELETED", 2,
      "cannot read .github/workflows/ci.yml")
def _(root):
    # A directory where the file should be. The file is NOT missing, so the
    # DELETED path (exit 1, a real structural change) would be the wrong
    # answer: nothing was read, so nothing was compared.
    p = root / ".github/workflows/ci.yml"
    p.unlink()
    p.mkdir()


@case("PyYAML unimportable: exit 2 before anything is compared", 2,
      "PyYAML is not importable")
def _(root):
    # sys.path[0] is the verifier's own directory, so this shadows the real
    # PyYAML for the child process only.
    (root / "scripts/yaml.py").write_text(
        'raise ImportError("blocked by test-verify-workflow-structure.py")\n',
        encoding="utf-8", newline="")


def null_audit():
    """Rule 2, applied to every case rather than to one baseline.

    Each case is re-run with its mutation SKIPPED. From a scratch copy that was
    genuinely restored to base, every one must exit 0. A case that still
    produces its expected non-zero code without its mutation is measuring the
    starting state and proves nothing about the verifier.

    This is the third row of the table in
    standards/CONTROL_VERIFICATION_STANDARD.md, run as a check instead of
    trusted: the harness this replaced reported ten detections while every case
    failed before any mutation was applied, and replacing all ten mutations
    with `pass` still produced eight passes. That is undetectable from the
    matrix output alone, and it is exactly what this phase would have caught.
    """
    passed = failed = 0
    print("\nNULL AUDIT -- every case with its mutation SKIPPED must exit 0")
    print(f"{'case (mutation not applied)':70s} {'expect':>6s} {'got':>4s}  result")
    for label, _expect, _text, _mutate in CASES:
        with tempfile.TemporaryDirectory() as tmp:
            root = scratch(tmp)
            # Deliberately no mutate(root) here. That omission is the test.
            code, _out = run_in(root)
            ok = code == 0
            passed += ok
            failed += not ok
            print(f"{label:70s} {0:>6d} {code:>4d}  {'PASS' if ok else '*** FAIL ***'}")
    if failed:
        print(f"\n{failed} case(s) produce a non-zero verdict WITHOUT their "
              f"mutation. Those cases measure the starting state, not the "
              f"mutation, and their matrix results mean nothing.")
    return passed, failed


def matrix():
    passed = failed = 0
    print(f"{'case':70s} {'expect':>6s} {'got':>4s}  result")
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
            print(f"{label:70s} {expect:>6d} {code:>4d}  "
                  f"{'PASS' if ok else '*** FAIL ***'}{note}")
    return passed, failed


def main():
    flags = set(sys.argv[1:])
    unknown = flags - {"--matrix-only", "--null-audit"}
    if unknown:
        raise SystemExit(f"unknown argument(s): {' '.join(sorted(unknown))}")

    passed = failed = 0
    if "--null-audit" not in flags:
        p, f = matrix()
        passed, failed = passed + p, failed + f
    if "--matrix-only" not in flags:
        p, f = null_audit()
        passed, failed = passed + p, failed + f

    print(f"\n{passed} passed, {failed} failed")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
