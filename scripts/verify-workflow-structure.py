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
  * compares the union of every structural key present in either version,
    plus job identity and step order;
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
        python scripts/verify-workflow-structure.py [base-ref] \
          --approval-manifest scripts/workflow-structure-approval.json
        python scripts/verify-workflow-structure.py [base-ref] \
          --write-approval scripts/workflow-structure-approval.json \
          --rationale "Founder/reviewer-approved reason"
Exit:   0 no structural change | 1 changes found | 2 cannot compare

Intentional changes require the explicit write command above. Review the
printed diff first, supply a specific rationale, commit the resulting manifest
beside the workflow change, and run the normal approval-manifest command. Never
generate or update the manifest inside CI: that would auto-approve the input
the gate is supposed to judge.

The SHA-256 fingerprint makes the recorded base identity, candidate workflow
tree, changed-file set, canonical diff, and rationale tamper-evident as one
unit. It is not a signature and proves no human approved it: anyone able to
change the repository can regenerate it. Requiring this workflow's job name is
also insufficient by itself: a candidate can preserve that green name while
hollowing the workflow, verifier, harness, or manifest. The trust boundary must
therefore be external to the candidate -- either a verified repository- or
organization-level required workflow/ruleset whose implementation the
candidate cannot change, or independently enforced path ownership/review over
this workflow and every load-bearing control file, including the verifier,
harness, approval manifest, and `scripts/verify-repository-hygiene.mjs`.
Closure additionally requires an observed mutation showing that hollowing the
implementation or invocation cannot preserve the required green check.
"""

import argparse
import hashlib
import json
import pathlib
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


# Structural keys are intentionally discovered from the documents rather than
# allowlisted here. The old allowlists were found short twice: first on
# continue-on-error/env/uses/outputs, then on job name/with and run-name.
def shape_of(doc, source):
    """Every present structural key, flattened for comparison.

    `jobs` and `steps` are the only exclusions: they are containers flattened
    immediately below. Comparing the union of keys emitted by base and head
    means a future GitHub Actions field is protected without first teaching
    this verifier its name.
    """
    if not isinstance(doc, dict):
        die(f"{source} did not parse as a mapping")

    rows = [("<workflow>", -1, "container:workflow", True)]
    for field in doc:
        if field == "jobs":
            continue
        label = "on" if field is True else field
        rows.append(("<workflow>", -1, f"workflow:{label}", doc.get(field)))

    jobs = doc.get("jobs", {})
    if jobs is None:
        jobs = {}
    if not isinstance(jobs, dict):
        die(f"{source} jobs did not parse as a mapping")
    for job_name, job in jobs.items():
        if not isinstance(job, dict):
            die(f"{source} job {job_name!r} did not parse as a mapping")
        rows.append((job_name, -1, "container:job", True))
        for field in job:
            if field == "steps":
                continue
            rows.append((job_name, -1, f"job:{field}", job.get(field)))
        if "steps" in job:
            rows.append((job_name, -1, "container:steps", True))
        steps = job.get("steps", [])
        if steps is None:
            steps = []
        if not isinstance(steps, list):
            die(f"{source} job {job_name!r} steps did not parse as a list")
        for index, step in enumerate(steps):
            if not isinstance(step, dict):
                die(f"{source} job {job_name!r} step {index} did not parse as a mapping")
            rows.append((job_name, index, "container:step", True))
            for field in step:
                rows.append((job_name, index, f"step:{field}", step.get(field)))
    return rows


def steps_of(doc, source):
    """Step records only — used for the step and guard counts in the summary."""
    if not isinstance(doc, dict):
        die(f"{source} did not parse as a mapping")
    rows = []
    for job_name, job in (doc.get("jobs") or {}).items():
        for index, step in enumerate((job or {}).get("steps", []) or []):
            rows.append((job_name, index, step or {}))
    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("base", nargs="?", default=DEFAULT_BASE)
    parser.add_argument("--approval-manifest")
    parser.add_argument("--write-approval")
    parser.add_argument("--rationale")
    args = parser.parse_args()
    if args.write_approval and not (args.rationale or "").strip():
        die("--write-approval requires a non-blank --rationale")
    if args.approval_manifest and args.write_approval:
        die("--approval-manifest and --write-approval are mutually exclusive")
    base = args.base

    # Resolve the base ref before anything else. This is the check whose
    # absence made the previous version worthless.
    code, resolved_base = git(["rev-parse", "--verify", f"{base}^{{commit}}"])
    if code != 0:
        die(f"base ref '{base}' does not resolve. Nothing was compared. "
            f"If this runs in CI, the job needs fetch-depth: 0.")
    resolved_base = resolved_base.strip()
    code, base_workflow_tree = git(
        ["rev-parse", f"{resolved_base}:{WORKFLOW_DIR}"]
    )
    if code != 0:
        die(f"cannot resolve the workflow tree at base {resolved_base}")
    base_workflow_tree = base_workflow_tree.strip()

    code, listing = git(["ls-tree", "--name-only", f"{base}:{WORKFLOW_DIR}"])
    if code != 0:
        die(f"cannot list {WORKFLOW_DIR} at {base}")
    base_files = sorted(n for n in listing.split("\n") if n.endswith((".yml", ".yaml")))
    if not base_files:
        die(f"no workflow files found at {base}:{WORKFLOW_DIR}")

    problems = 0
    approval_material = []
    changed_files = set()
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
            approval_material.append(f"workflow:{name}:DELETED")
            changed_files.add(name)
            continue
        except (OSError, UnicodeDecodeError) as error:
            die(f"cannot read {WORKFLOW_DIR}/{name}: {error}")

        # Parsed once each, so a parse failure on either side reaches `parse`
        # and exits 2 instead of raising out of main and exiting 1.
        doc_before = parse(raw, f"{base}:{name}")
        doc_after = parse(current_text, name)

        # Validate every nested shape before computing summary counts. A
        # malformed job/steps/step is "could not compare" (2), not a change
        # verdict (1) and never a traceback.
        before_shape = shape_of(doc_before, f"{base}:{name}")
        after_shape = shape_of(doc_after, name)
        before = steps_of(doc_before, f"{base}:{name}")
        after = steps_of(doc_after, name)

        gb = sum(1 for _, _, s in before if s.get("if"))
        ga = sum(1 for _, _, s in after if s.get("if"))

        # Compared as keyed sets rather than by position, so inserting one step
        # reports one change instead of misaligning every step after it.
        shape_before = dict(((j, i, f), v)
                            for j, i, f, v in before_shape)
        shape_after = dict(((j, i, f), v)
                           for j, i, f, v in after_shape)

        details = []
        missing = object()
        for key in sorted(set(shape_before) | set(shape_after), key=str):
            job, index, field = key
            was, now = shape_before.get(key, missing), shape_after.get(key, missing)
            if was is not missing and now is not missing and was == now:
                continue
            where = f"{job} step[{index}]" if index >= 0 else job
            show_was = "ABSENT" if was is missing else f"PRESENT({was!r})"
            show_now = "ABSENT" if now is missing else f"PRESENT({now!r})"
            details.append(f"    {where} {field}: {show_was} -> {show_now}")
            encoded_was = {"present": False} if was is missing else {
                "present": True, "value": was
            }
            encoded_now = {"present": False} if now is missing else {
                "present": True, "value": now
            }
            approval_material.append(
                json.dumps([name, job, index, field, encoded_was, encoded_now],
                           sort_keys=True, default=str)
            )
            changed_files.add(name)

        ok = not details and len(before) == len(after) and gb == ga
        problems += 0 if ok else max(1, len(details))
        print(f"{name:26s} {len(before):>4d}->{len(after):<5d} {gb:>4d}->{ga:<5d}   "
              f"{'ok' if ok else '*** CHANGED ***'}")
        for line in details:
            print(line)

    # A workflow added since base is reported, not silently accepted.
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
            approval_material.append(f"workflow:{name}:ADDED")
            changed_files.add(name)

    print()
    diff_digest = "sha256:" + hashlib.sha256(
        "\n".join(sorted(approval_material)).encode("utf-8")
    ).hexdigest()
    candidate_hasher = hashlib.sha256()
    for path in sorted(pathlib.Path(WORKFLOW_DIR).glob("*.y*ml")):
        candidate_hasher.update(path.name.encode("utf-8"))
        candidate_hasher.update(b"\0")
        candidate_hasher.update(path.read_bytes())
        candidate_hasher.update(b"\0")
    candidate_workflow_tree = "sha256:" + candidate_hasher.hexdigest()

    def approval_record(rationale):
        record = {
            "base_commit": resolved_base,
            "base_workflow_tree": base_workflow_tree,
            "candidate_workflow_tree": candidate_workflow_tree,
            "changed_files": sorted(changed_files),
            "diff_digest": diff_digest,
            "rationale": rationale.strip(),
        }
        record["fingerprint"] = "sha256:" + hashlib.sha256(
            json.dumps(record, sort_keys=True, separators=(",", ":")).encode("utf-8")
        ).hexdigest()
        return record

    if args.write_approval:
        if not problems:
            die("refusing to write an approval: there is no structural change")
        path = pathlib.Path(args.write_approval)
        existing = {"version": 2, "approvals": []}
        if path.exists():
            try:
                loaded = json.loads(path.read_text(encoding="utf-8"))
                if loaded.get("version") == 2 and isinstance(loaded.get("approvals"), list):
                    existing = loaded
            except (OSError, ValueError, AttributeError):
                pass
        record = approval_record(args.rationale)
        approvals = [
            item for item in existing["approvals"]
            if item.get("base_commit") != resolved_base
        ]
        approvals.append(record)
        path.write_text(
            json.dumps({"version": 2, "approvals": approvals}, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"WROTE INTENTIONAL-CHANGE APPROVAL: {args.write_approval}")
        print(f"FINGERPRINT: {record['fingerprint']}")
        return

    if args.approval_manifest:
        try:
            approval = json.loads(
                pathlib.Path(args.approval_manifest).read_text(encoding="utf-8")
            )
        except (OSError, ValueError) as error:
            die(f"cannot read approval manifest {args.approval_manifest}: {error}")
        if (not isinstance(approval, dict) or approval.get("version") != 2
                or not isinstance(approval.get("approvals"), list)):
            die("approval manifest is not a version-2 approvals object")
        candidates = [
            item for item in approval["approvals"]
            if isinstance(item, dict) and item.get("base_commit") == resolved_base
        ]
        if not problems:
            if candidates:
                print("RESULT: approval manifest is stale for this base: no structural change exists.")
                sys.exit(1)
            print("RESULT: no structural change; historical approvals are inactive.")
            return
        if len(candidates) != 1:
            print("RESULT: no unique approval record for the resolved base commit.")
            sys.exit(1)
        approved = candidates[0]
        rationale = approved.get("rationale")
        if not isinstance(rationale, str) or not rationale.strip():
            die("approval record has no non-blank rationale")
        expected = approval_record(rationale)
        if approved == expected:
            print(f"RESULT: {problems} structural change(s) explicitly approved.")
            print(f"APPROVAL: {rationale.strip()}")
            return
        print("RESULT: structural change does not match its approval manifest.")
        print(f"EXPECTED RECORD: {approved}")
        print(f"ACTUAL RECORD:   {expected}")
        sys.exit(1)

    if problems:
        print(f"RESULT: {problems} structural change(s) found. Confirm each is "
              f"intended before merging.")
        sys.exit(1)
    print("RESULT: no structural change since base.")


if __name__ == "__main__":
    main()
