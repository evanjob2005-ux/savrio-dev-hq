"""Negative controls for verify-workflow-structure.py.

The previous version of that verifier passed review-by-reading and failed
review-by-mutation: it caught 3 of these 10 and reported success when it had
compared nothing. So the verifier now ships with the mutations that killed it.

Each case mutates a workflow in a scratch copy of the repository, runs the
verifier, and asserts the expected exit code. Run from the repository root:

    python scripts/test-verify-workflow-structure.py
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


def case(label, expect):
    def wrap(fn):
        CASES.append((label, expect, fn))
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


@case("base ref missing: must NOT report success", 2)
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


def main():
    passed = failed = 0
    print(f"{'case':58s} {'expect':>6s} {'got':>4s}  result")
    for label, expect, mutate in CASES:
        with tempfile.TemporaryDirectory() as tmp:
            root = scratch(tmp)
            mutate(root)
            code, _out = run_in(root)
            ok = code == expect
            passed += ok
            failed += not ok
            print(f"{label:58s} {expect:>6d} {code:>4d}  {'PASS' if ok else '*** FAIL ***'}")
    print(f"\n{passed} passed, {failed} failed")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
