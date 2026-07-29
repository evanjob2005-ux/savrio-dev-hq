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
    """A worktree-free copy: .git plus the files the verifier reads."""
    dest = pathlib.Path(tmp) / "repo"
    dest.mkdir()
    shutil.copytree(".git", dest / ".git", symlinks=True)
    shutil.copytree(".github/workflows", dest / ".github/workflows")
    shutil.copytree("scripts", dest / "scripts")
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


@case("baseline: workflows restored to base (must PASS)", 0)
def _(root):
    # Deliberately restore the base workflows rather than using the working
    # tree as-is. This verifier is a tripwire asserting "nothing changed since
    # base", so on a branch that legitimately changes a workflow the working
    # tree SHOULD fail -- that is the tool working, not a defect. The baseline
    # case has to establish that it reports success when there is genuinely
    # nothing to report, which requires an unmodified tree to compare.
    listing = subprocess.run(
        ["git", "ls-tree", "--name-only", f"{BASE}:.github/workflows"],
        cwd=root, capture_output=True)
    for name in listing.stdout.decode("utf-8").split("\n"):
        if not name.strip():
            continue
        blob = subprocess.run(["git", "show", f"{BASE}:.github/workflows/{name}"],
                              cwd=root, capture_output=True)
        (root / ".github/workflows" / name).write_bytes(blob.stdout)


@case("delete an `if:` guard (the original defect)", 1)
def _(root):
    edit(root, "ci.yml",
         "      - name: Pin npm to the version that produced the lockfile\n"
         "        if: steps.detect.outputs.node == 'true'\n",
         "      - name: Pin npm to the version that produced the lockfile\n")


@case("alter a `run:` command", 1)
def _(root):
    edit(root, "ci.yml", "npm install --global npm@11.16.0",
         "npm install --global npm@10.0.0")


@case("change a pinned action SHA", 1)
def _(root):
    edit(root, "lint.yml", "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1",
         "actions/checkout@0000000000000000000000000000000000000000")


@case("change a `with:` input (node-version)", 1)
def _(root):
    edit(root, "ci.yml", 'node-version: "24"', 'node-version: "18"')


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
