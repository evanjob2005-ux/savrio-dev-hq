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
import os
import json
import re
import shutil
import subprocess
import sys
import tempfile

VERIFIER = "scripts/verify-workflow-structure.py"
BASE = os.environ.get(
    "WORKFLOW_STRUCTURE_BASE", "origin/feature/dev-hq-operating-system"
)


def run_in(root, *args):
    if (pathlib.Path(root) / ".use-missing-raw-base").exists():
        args = ("0000000000000000000000000000000000000001",)
    elif not args:
        args = (BASE,)
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
    p = root / ".github/workflows/ci.yml"
    text = p.read_text(encoding="utf-8")
    match = re.search(r'node-version:\s*["\']?(\d+)', text)
    assert match, "selected baseline fixture has no node-version input"
    current = match.group(1)
    replacement = "18" if current != "18" else "20"
    p.write_text(
        text[:match.start(1)] + replacement + text[match.end(1):],
        encoding="utf-8", newline="",
    )


@case("change a frontend hygiene cancellation guard", 1)
def _(root):
    p = root / ".github/workflows/frontend-tests.yml"
    text = p.read_text(encoding="utf-8")
    pattern = re.compile(
        r"(?m)^(\s+- name: Verify repository hygiene\n\s+if:\s*)(.+)$"
    )
    match = pattern.search(text)
    assert match, "selected baseline fixture has no frontend hygiene guard"
    replacement = (
        "${{ !cancelled() }}" if match.group(2) != "${{ !cancelled() }}"
        else "always()"
    )
    p.write_text(
        text[:match.start(2)] + replacement + text[match.end(2):],
        encoding="utf-8", newline="",
    )


@case("change frontend missing-artifact handling", 1)
def _(root):
    p = root / ".github/workflows/frontend-tests.yml"
    text = p.read_text(encoding="utf-8")
    match = re.search(r"(?m)^(\s+if-no-files-found:\s*)(\S+)\s*$", text)
    assert match, "selected baseline fixture has no if-no-files-found input"
    replacement = "warn" if match.group(2) != "warn" else "ignore"
    p.write_text(
        text[:match.start(2)] + replacement + text[match.end(2):],
        encoding="utf-8", newline="",
    )


@case("change frontend event-isolated concurrency grouping", 1)
def _(root):
    p = root / ".github/workflows/frontend-tests.yml"
    text = p.read_text(encoding="utf-8")
    marker = "-${{ github.event_name }}-${{ github.ref }}"
    if marker in text:
        replacement = "-${{ github.ref }}"
        updated = text.replace(marker, replacement, 1)
    else:
        marker = "-${{ github.ref }}"
        replacement = "-${{ github.event_name }}-${{ github.ref }}"
        assert marker in text, "selected baseline fixture has no frontend concurrency group"
        updated = text.replace(marker, replacement, 1)
    p.write_text(updated, encoding="utf-8", newline="")


@case("change frontend hygiene verifier enforcement", 1)
def _(root):
    p = root / ".github/workflows/frontend-tests.yml"
    text = p.read_text(encoding="utf-8")
    verifier = "node scripts/verify-repository-hygiene.mjs"
    if verifier in text:
        updated = text.replace(verifier, f"{verifier} || true", 1)
    else:
        original = "if ! git diff --check HEAD --; then"
        assert original in text, "selected baseline fixture has no frontend hygiene gate"
        updated = text.replace(
            original, "if ! git diff --quiet HEAD --; then", 1
        )
    p.write_text(updated, encoding="utf-8", newline="")


@case("change frontend E2E file precondition surface", 1)
def _(root):
    p = root / ".github/workflows/frontend-tests.yml"
    text = p.read_text(encoding="utf-8")
    smoke = "          --file e2e/smoke.spec.ts\n"
    anchor = "          --file playwright.config.ts\n"
    if anchor in text:
        updated = (
            text.replace(smoke, "", 1)
            if smoke in text
            else text.replace(anchor, anchor + smoke, 1)
        )
    else:
        inline = "for file in playwright.config.ts e2e/smoke.spec.ts; do"
        narrowed = "for file in playwright.config.ts; do"
        assert inline in text, "selected baseline fixture has no E2E file precondition"
        updated = text.replace(inline, narrowed, 1)
    p.write_text(updated, encoding="utf-8", newline="")


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
    (root / ".use-missing-raw-base").write_text("intentional missing object\n")


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


@case("add workflow run-name (future runs acquire a different identity)", 1)
def _(root):
    edit(root, "ci.yml", "name: Continuous Integration\n",
         "name: Continuous Integration\nrun-name: replaced identity\n")


@case("literal run-name '<absent>' cannot collide with missing-field state", 1)
def _(root):
    edit(root, "ci.yml", "name: Continuous Integration\n",
         "name: Continuous Integration\nrun-name: <absent>\n")


@case("add an empty job (container identity is structural)", 1)
def _(root):
    p = root / ".github/workflows/ci.yml"
    with p.open("a", encoding="utf-8", newline="") as handle:
        handle.write("\n  empty-identity-job: {}\n")


@case("add an empty steps container (presence differs from no steps key)", 1)
def _(root):
    p = root / ".github/workflows/ci.yml"
    with p.open("a", encoding="utf-8", newline="") as handle:
        handle.write("\n  empty-steps-job:\n    steps: []\n")


@case("add an empty step (step identity is structural)", 1)
def _(root):
    edit(root, "ci.yml", "    steps:\n", "    steps:\n      - {}\n", count=1)


@case("add job-level name (required-check identity changes)", 1)
def _(root):
    edit(root, "ci.yml", "    name: Application Validation (Conditional)\n",
         "    name: Replaced application check\n")


@case("add job-level with (reusable-workflow inputs change)", 1)
def _(root):
    edit(root, "ci.yml", "  application-validation:\n",
         "  application-validation:\n    with:\n      unexpected: value\n")


@case("add a future unknown workflow structural field", 1)
def _(root):
    edit(root, "ci.yml", "name: Continuous Integration\n",
         "name: Continuous Integration\nfuture-policy-field: deny\n")


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


@case("job is not a mapping: exit 2 and say so", 2, "job 'broken' did not parse as a mapping")
def _(root):
    (root / ".github/workflows/ci.yml").write_text(
        "name: broken\non: push\njobs:\n  broken: []\n",
        encoding="utf-8", newline="")


@case("steps is not a list: exit 2 and say so", 2, "steps did not parse as a list")
def _(root):
    (root / ".github/workflows/ci.yml").write_text(
        "name: broken\non: push\njobs:\n  broken:\n    steps: {}\n",
        encoding="utf-8", newline="")


@case("step is not a mapping: exit 2 and say so", 2, "step 0 did not parse as a mapping")
def _(root):
    (root / ".github/workflows/ci.yml").write_text(
        "name: broken\non: push\njobs:\n  broken:\n    steps:\n      - nope\n",
        encoding="utf-8", newline="")


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


def approval_cases():
    """Exact-diff approval is explicit, exact, and cannot remain stale."""
    passed = failed = 0
    print("\nINTENTIONAL-CHANGE APPROVAL CASES")
    with tempfile.TemporaryDirectory() as tmp:
        root = scratch(tmp)
        manifest = root / "approval.json"
        original_ci = (root / ".github/workflows/ci.yml").read_text(encoding="utf-8")
        edit(root, "ci.yml", "run: npm ci", "run: npm install")
        written = subprocess.run(
            [sys.executable, VERIFIER, BASE, "--write-approval", str(manifest),
             "--rationale", "Reviewed fixture change"],
            cwd=root, capture_output=True,
        )
        approved = subprocess.run(
            [sys.executable, VERIFIER, BASE, "--approval-manifest", str(manifest)],
            cwd=root, capture_output=True,
        )
        ok = written.returncode == 0 and approved.returncode == 0
        passed += ok
        failed += not ok
        print(f"  [{'PASS' if ok else 'FAIL'}] intentional workflow + exact manifest is green")

        pristine = manifest.read_text(encoding="utf-8")
        approved_ci = (root / ".github/workflows/ci.yml").read_text(encoding="utf-8")
        for label, field, value in [
            ("base identity", "base_commit", "0" * 40),
            ("candidate workflow tree", "candidate_workflow_tree", "sha256:" + "1" * 64),
            ("changed file set", "changed_files", ["other.yml"]),
            ("canonical diff", "diff_digest", "sha256:" + "2" * 64),
            ("rationale", "rationale", "tampered rationale"),
        ]:
            data = json.loads(pristine)
            data["approvals"][0][field] = value
            manifest.write_text(json.dumps(data), encoding="utf-8")
            tampered = subprocess.run(
                [sys.executable, VERIFIER, BASE,
                 "--approval-manifest", str(manifest)],
                cwd=root, capture_output=True,
            )
            ok = tampered.returncode == 1
            passed += ok
            failed += not ok
            print(f"  [{'PASS' if ok else 'FAIL'}] tampered {label} is red")
        manifest.write_text(pristine, encoding="utf-8")

        # Container identities participate in approval material too. Otherwise
        # an empty job could be added after approval without changing any
        # field row, allowing an unapproved workflow structure to ride an
        # approved field change.
        with (root / ".github/workflows/ci.yml").open(
                "a", encoding="utf-8", newline="") as handle:
            handle.write("\n  post-approval-empty-job: {}\n")
        container_mismatch = subprocess.run(
            [sys.executable, VERIFIER, BASE,
             "--approval-manifest", str(manifest)],
            cwd=root, capture_output=True,
        )
        ok = container_mismatch.returncode == 1
        passed += ok
        failed += not ok
        print(f"  [{'PASS' if ok else 'FAIL'}] post-approval empty container is red")
        (root / ".github/workflows/ci.yml").write_text(
            approved_ci, encoding="utf-8", newline=""
        )

        # A second, unapproved structural change cannot ride the first approval.
        edit(root, "ci.yml",
             "      - name: Pin npm to the version that produced the lockfile\n"
             "        if: steps.detect.outputs.node == 'true'\n",
             "      - name: Pin npm to the version that produced the lockfile\n")
        mismatch = subprocess.run(
            [sys.executable, VERIFIER, BASE, "--approval-manifest", str(manifest)],
            cwd=root, capture_output=True,
        )
        ok = mismatch.returncode == 1
        passed += ok
        failed += not ok
        print(f"  [{'PASS' if ok else 'FAIL'}] unrelated deleted guard is red")

    with tempfile.TemporaryDirectory() as tmp:
        root = scratch(tmp)
        manifest = root / "approval.json"
        edit(root, "ci.yml", "run: npm ci", "run: npm install")
        subprocess.run(
            [sys.executable, VERIFIER, BASE, "--write-approval", str(manifest),
             "--rationale", "stale fixture"],
            cwd=root, capture_output=True,
        )
        (root / ".github/workflows/ci.yml").write_text(
            original_ci, encoding="utf-8", newline=""
        )
        stale = subprocess.run(
            [sys.executable, VERIFIER, BASE, "--approval-manifest", str(manifest)],
            cwd=root, capture_output=True,
        )
        ok = stale.returncode == 1
        passed += ok
        failed += not ok
        print(f"  [{'PASS' if ok else 'FAIL'}] manifest-only/stale approval is red")

        data = json.loads(manifest.read_text(encoding="utf-8"))
        data["approvals"][0]["base_commit"] = "0" * 40
        manifest.write_text(json.dumps(data), encoding="utf-8")
        historical = subprocess.run(
            [sys.executable, VERIFIER, BASE, "--approval-manifest", str(manifest)],
            cwd=root, capture_output=True,
        )
        ok = historical.returncode == 0
        passed += ok
        failed += not ok
        print(f"  [{'PASS' if ok else 'FAIL'}] no-diff post-merge run ignores historical approval")
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
    if not flags:
        p, f = approval_cases()
        passed, failed = passed + p, failed + f

    print(f"\n{passed} passed, {failed} failed")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
