"""Detect unintended structural changes to GitHub Actions workflows.

Why this exists: a comment-rewriting script once deleted two `if:` guards from
CI gate steps in this repository. YAML stayed valid, every step name resolved,
and all twenty gates went green. Nothing here could see it.

A first version of this script was written, reviewed, and REMOVED unmerged
because it was unsound in exactly the way it was meant to prevent -- it
compared only `if:` while collecting five fields, and it printed
"structure preserved" and exited 0 when the base ref failed to resolve, which is
the default state under actions/checkout at fetch-depth 1. It would have
reported success in every situation it existed to catch.

This version therefore:
  * resolves the base ref FIRST and exits non-zero if it is missing, so a
    comparison against nothing can never be reported as a pass;
  * compares every collected field, plus job identity and step order;
  * decodes git output as UTF-8 explicitly, because these workflows contain
    em-dashes and locale decoding produced spurious diffs during review.

It is a tripwire, not a policy: it asserts "nothing changed since base", so a
DELIBERATE workflow change is expected to fail it. Read the reported diff, and
if every line is intended, that is the signal to proceed -- not to edit this
script.

Exit 2 means "could not evaluate", per rule 5 of
standards/CONTROL_VERIFICATION_STANDARD.md: a control that cannot perform its
comparison must be distinguishable from one that performed it and found a
violation. Every path that ends without a completed comparison -- missing
PyYAML, missing git, an unresolvable base ref, an unreadable file, a YAML parse
failure -- exits 2 and prints what it could not do. An uncaught exception would
exit 1, which is the code for "property violated", so those paths are caught.

Usage:  python scripts/verify-workflow-structure.py [base-ref]
Exit:   0 no structural change | 1 changes found | 2 cannot compare
"""

import subprocess
import sys

try:
    import yaml
except ImportError as _error:
    # Not a violation: nothing was compared. `die` is not defined yet, so the
    # same two lines are written out by hand here.
    _reason = f"PyYAML is not importable ({_error}). Nothing was compared."
    print(f"::error::Workflow structure check could not run: {_reason}")
    print(f"CANNOT COMPARE: {_reason}")
    sys.exit(2)

DEFAULT_BASE = "origin/feature/dev-hq-operating-system"
WORKFLOW_DIR = ".github/workflows"

# Every field that changes what a step DOES. `id` is included because deleting
# `id: detect` silently breaks every `steps.detect.outputs.*` guard referring to
# it -- the step count and guard count both stay identical while the guarded
# steps stop running.
STEP_FIELDS = ("name", "id", "if", "uses", "run", "with", "env", "shell",
               "working-directory", "continue-on-error", "timeout-minutes")


def git(args):
    """Run git and decode as UTF-8 regardless of locale."""
    try:
        out = subprocess.run(["git", *args], capture_output=True)
    except OSError as error:
        # No git means no baseline to compare against, which is exit 2 and not
        # the exit 1 an uncaught OSError would produce.
        die(f"git could not be executed ({error}). Nothing was compared.")
    return out.returncode, out.stdout.decode("utf-8", errors="replace")


def die(reason):
    print(f"::error::Workflow structure check could not run: {reason}")
    print(f"CANNOT COMPARE: {reason}")
    sys.exit(2)


def parse(text, source):
    """Parse YAML, treating a parse failure as 'could not evaluate', not 'ok'.

    An unhandled YAMLError exits 1, which is the exit code reserved for "the
    property is violated" -- so a syntactically broken workflow would be
    reported as a detected structural change rather than as a file the checker
    could not read. Rule 5 requires those two outcomes stay distinguishable.
    """
    try:
        return yaml.safe_load(text)
    except yaml.YAMLError as error:
        detail = " ".join(str(error).split()) or error.__class__.__name__
        die(f"{source} is not parseable YAML, so it was not compared: {detail}")


# Keys that decide whether a job runs at all, and under what authority. These
# are NOT step fields, and omitting them was a real hole: `if: false` on a job
# disables every step inside it while step and guard counts stay identical.
#
# `continue-on-error` is the worst of the set and was missing until an
# independent reviewer wrote the mutation: `continue-on-error: true` on a job
# lets lint, type-check and build all fail while the workflow reports success,
# and it moves neither the step count nor the guard count. The remaining three
# are the same shape -- `env` rewrites what every step in the job sees, `uses`
# replaces the job body wholesale with someone else's reusable workflow, and
# `outputs` is what downstream `needs.<job>.outputs.*` guards read.
JOB_FIELDS = ("if", "runs-on", "needs", "permissions", "strategy", "environment",
              "container", "services", "timeout-minutes", "defaults", "concurrency",
              "continue-on-error", "env", "uses", "outputs")

# Workflow-level keys. Removing a `pull_request:` trigger stops a gate running
# on the event it exists for; widening `permissions:` is a security regression.
# Neither touches a single step. `name` is here because it is the identity a
# required status check is matched on -- renaming it leaves branch protection
# waiting on a check that no longer reports.
WORKFLOW_FIELDS = ("name", "on", True, "permissions", "concurrency", "env", "defaults")


def shape_of(doc, source):
    """Every field that decides what a workflow does, flattened for comparison."""
    if not isinstance(doc, dict):
        die(f"{source} did not parse as a mapping")

    rows = []
    # PyYAML parses the bare key `on:` as boolean True, so both are collected.
    for field in WORKFLOW_FIELDS:
        label = "on" if field is True else field
        rows.append(("<workflow>", -1, f"workflow:{label}", doc.get(field)))

    for job_name, job in (doc.get("jobs") or {}).items():
        job = job or {}
        for field in JOB_FIELDS:
            rows.append((job_name, -1, f"job:{field}", job.get(field)))
        for index, step in enumerate(job.get("steps", []) or []):
            step = step or {}
            for field in STEP_FIELDS:
                rows.append((job_name, index, f"step:{field}", step.get(field)))
    return rows


def steps_of(doc, source):
    """Step records only — used for the step and guard counts in the summary."""
    if not isinstance(doc, dict):
        die(f"{source} did not parse as a mapping")
    rows = []
    for job_name, job in (doc.get("jobs") or {}).items():
        for index, step in enumerate((job or {}).get("steps", []) or []):
            rows.append((job_name, index,
                         {f: (step or {}).get(f) for f in STEP_FIELDS}))
    return rows


def main():
    base = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_BASE

    # Resolve the base ref before anything else. This is the check whose
    # absence made the previous version worthless.
    code, _ = git(["rev-parse", "--verify", f"{base}^{{commit}}"])
    if code != 0:
        die(f"base ref '{base}' does not resolve. Nothing was compared. "
            f"If this runs in CI, the job needs fetch-depth: 0.")

    code, listing = git(["ls-tree", "--name-only", f"{base}:{WORKFLOW_DIR}"])
    if code != 0:
        die(f"cannot list {WORKFLOW_DIR} at {base}")
    base_files = sorted(n for n in listing.split("\n") if n.endswith((".yml", ".yaml")))
    if not base_files:
        die(f"no workflow files found at {base}:{WORKFLOW_DIR}")

    problems = 0
    print(f"Comparing {WORKFLOW_DIR} against {base}\n")
    print(f"{'workflow':26s} {'steps':>11s} {'guarded':>11s}   verdict")

    for name in base_files:
        code, raw = git(["show", f"{base}:{WORKFLOW_DIR}/{name}"])
        if code != 0:
            die(f"cannot read {name} at {base}")
        # A missing file is a real structural change (exit 1). Any OTHER read
        # failure -- permissions, a directory in the file's place, bytes that
        # are not UTF-8 -- means the comparison did not happen, which is exit 2.
        try:
            with open(f"{WORKFLOW_DIR}/{name}", encoding="utf-8") as handle:
                current_text = handle.read()
        except FileNotFoundError:
            print(f"{name:26s} {'DELETED':>11s}")
            problems += 1
            continue
        except (OSError, UnicodeDecodeError) as error:
            die(f"cannot read {WORKFLOW_DIR}/{name}: {error}")

        # Parsed once each, so a parse failure on either side reaches `parse`
        # and exits 2 instead of raising out of main and exiting 1.
        doc_before = parse(raw, f"{base}:{name}")
        doc_after = parse(current_text, name)

        before = steps_of(doc_before, f"{base}:{name}")
        after = steps_of(doc_after, name)

        gb = sum(1 for _, _, s in before if s["if"])
        ga = sum(1 for _, _, s in after if s["if"])

        # Compared as keyed sets rather than by position, so inserting one step
        # reports one change instead of misaligning every step after it.
        shape_before = dict(((j, i, f), v)
                            for j, i, f, v in shape_of(doc_before, f"{base}:{name}"))
        shape_after = dict(((j, i, f), v)
                           for j, i, f, v in shape_of(doc_after, name))

        details = []
        for key in sorted(set(shape_before) | set(shape_after), key=str):
            job, index, field = key
            was, now = shape_before.get(key, "<absent>"), shape_after.get(key, "<absent>")
            if was == now:
                continue
            where = f"{job} step[{index}]" if index >= 0 else job
            details.append(f"    {where} {field}: {was!r} -> {now!r}")

        ok = not details and len(before) == len(after) and gb == ga
        problems += 0 if ok else max(1, len(details))
        print(f"{name:26s} {len(before):>4d}->{len(after):<5d} {gb:>4d}->{ga:<5d}   "
              f"{'ok' if ok else '*** CHANGED ***'}")
        for line in details:
            print(line)

    # A workflow added since base is reported, not silently accepted.
    import pathlib
    try:
        current = sorted(p.name for p in pathlib.Path(WORKFLOW_DIR).glob("*.y*ml"))
    except OSError as error:
        # Cannot enumerate the working tree, so added workflows cannot be ruled
        # out. That is an incomplete comparison, not a clean one.
        die(f"cannot list {WORKFLOW_DIR} in the working tree: {error}")
    for name in current:
        if name not in base_files:
            print(f"{name:26s} {'ADDED':>11s}")
            problems += 1

    print()
    if problems:
        print(f"RESULT: {problems} structural change(s) found. Confirm each is "
              f"intended before merging.")
        sys.exit(1)
    print("RESULT: no structural change since base.")


if __name__ == "__main__":
    main()
