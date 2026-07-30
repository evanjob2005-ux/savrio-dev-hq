"""Verify that the factual claims made by this repository's records still hold.

Why this exists: an audit of one governance register found six statements that
were false at HEAD. Every one of them had been TRUE when it was written and had
gone stale when the repository moved underneath it:

  * "`sprint-1f-pkg3-approved` does not exist" -- the tag exists;
  * "`handbooks/INDEPENDENT_CODE_REVIEWER.md` is absent" -- the file exists;
  * "`review-service.ts:354` uses `nextId(\"rvt\")`" -- it uses
    `nextCapabilityToken`;
  * "the event store caps retained events at 200 (`store.ts:224`)" -- no cap
    exists.

Prose cannot be gated, but claims of this shape are not really prose. Each one
is an executable probe written in English: a tag either exists or it does not, a
file is either there or it is not, a regex either matches a named file or it
does not. `docs/claims.json` pairs each such claim with the probe that decides
it, and this script runs every probe.

Roadmap Section 9 requires gates to be proved by executable checks rather than
by prose. This applies that rule to the records themselves.

Exit 2 means "could not evaluate", per rule 5 of
standards/CONTROL_VERIFICATION_STANDARD.md. Every probe here is designed to FAIL
CLOSED: a grep whose file is missing, a tag probe in a checkout that never
fetched tags, an unreadable or malformed manifest, an unknown probe type, a
pattern that is not a valid regular expression -- all of these exit 2 and say
what could not be done. None of them may ever read as "the claim still holds".
This repository has been burned twice by controls that reported green when they
had measured nothing; scripts/test-release-controls.py NBF-5 exists for exactly
that failure mode.

Exit 2 also DOMINATES exit 1. If one claim is red and another could not be
evaluated, the run exits 2 -- both are printed, but a run that did not measure
everything must not be reported as a completed verdict about anything.

An empty manifest, or one whose probes all fail to evaluate, is likewise exit 2
rather than a vacuous pass.

A red result is not automatically a defect. It means a record and the repository
now disagree. Read the claim, decide which one is wrong, and fix that one --
correcting the record where the world moved on, or the world where the record
was right. Editing this script or deleting the claim to restore green is the one
response that is never correct.

Usage:  python scripts/verify-record-claims.py [--manifest docs/claims.json]
Exit:   0 every claim holds | 1 one or more no longer hold | 2 cannot evaluate
"""

import argparse
import json
import pathlib
import re
import subprocess
import sys

DEFAULT_MANIFEST = "docs/claims.json"
REQUIRED_FIELDS = ("document", "statement", "probe", "args", "red_means")
HEX_NAME = re.compile(r"[0-9a-f]{7,40}")
DRIVE_LETTER = re.compile(r"^[A-Za-z]:")


class CannotEvaluate(Exception):
    """A probe that reached no verdict.

    Raised, never returned, so that there is no code path on which "I could not
    ask" can be mistaken for "the claim still holds".
    """


def die(reason):
    """Manifest-level failure: nothing was measured, so this is exit 2."""
    print(f"::error::Record-claim check could not run: {reason}")
    print(f"CANNOT EVALUATE: {reason}")
    sys.exit(2)


# ---------------------------------------------------------------------------
# git tags
#
# Read once, as a whole index, rather than asking git per claim. `git tag --list
# <name>` and `git show-ref` both answer "absent" and "I could not ask" with
# shapes that are easy to conflate; building the index up front means a git
# failure is seen once, before any verdict is formed.
# ---------------------------------------------------------------------------

_TAG_INDEX = None


def _build_tag_index():
    """Map tag name -> the commit it resolves to, or a string saying why not.

    `%(*objectname)` is the peeled target of an annotated tag and is empty for a
    lightweight one, so the fallback to `%(objectname)` handles both.
    """
    try:
        out = subprocess.run(
            ["git", "for-each-ref",
             "--format=%(refname:short)\t%(objectname)\t%(*objectname)",
             "refs/tags"],
            capture_output=True,
        )
    except OSError as error:
        # No git means no tag could be read. That is exit 2, not the exit 1 an
        # uncaught OSError would produce.
        return f"git could not be executed ({error}), so no tag was read"
    if out.returncode != 0:
        detail = " ".join(out.stderr.decode("utf-8", errors="replace").split())
        return (f"`git for-each-ref refs/tags` failed with exit "
                f"{out.returncode} ({detail or 'no diagnostic output'}), so no "
                f"tag was read")

    index = {}
    for line in out.stdout.decode("utf-8", errors="replace").splitlines():
        parts = line.split("\t")
        if len(parts) != 3 or not parts[0]:
            continue
        name, objectname, peeled = parts
        index[name] = peeled or objectname

    if not index:
        # The decisive fail-closed case. A shallow checkout that never fetched
        # tags reports zero tags, and in that state "the tag is not here" and
        # "the tags were never fetched" are the same observation. Reporting the
        # first would turn every tag claim red for a reason that has nothing to
        # do with the claim -- and, worse, would report tag-absent claims GREEN
        # on no evidence at all.
        return ("this repository reports no tags whatsoever. A checkout that "
                "did not fetch tags cannot tell an absent tag from an "
                "unfetched one, so no tag claim was evaluated. In CI, check "
                "out with fetch-tags: true")
    return index


def tag_index():
    global _TAG_INDEX
    if _TAG_INDEX is None:
        _TAG_INDEX = _build_tag_index()
    if isinstance(_TAG_INDEX, str):
        raise CannotEvaluate(_TAG_INDEX)
    return _TAG_INDEX


# ---------------------------------------------------------------------------
# argument handling
# ---------------------------------------------------------------------------

def require(args, field):
    if not isinstance(args, dict):
        raise CannotEvaluate("args is not an object")
    value = args.get(field)
    if not isinstance(value, str) or not value.strip():
        raise CannotEvaluate(f"args.{field} is missing, blank, or not a string")
    return value


def repo_path(args, field="path"):
    """A manifest path, constrained to this repository.

    A claim is about this repository, so a path that escapes it cannot be one.
    Rejecting rather than following such a path keeps the manifest from
    becoming a way to read arbitrary files on whatever machine runs the check.
    """
    raw = require(args, field)
    if raw != raw.strip():
        raise CannotEvaluate(f"args.{field} {raw!r} has surrounding whitespace")
    if "\\" in raw:
        raise CannotEvaluate(
            f"args.{field} {raw!r} must use forward slashes so the manifest "
            f"means the same thing on every platform")
    if raw.startswith("/") or DRIVE_LETTER.match(raw):
        raise CannotEvaluate(
            f"args.{field} {raw!r} is absolute; claims are about paths inside "
            f"this repository")
    parts = pathlib.PurePosixPath(raw).parts
    if ".." in parts:
        raise CannotEvaluate(
            f"args.{field} {raw!r} leaves the repository via '..'")
    return raw, pathlib.Path(*parts)


def compiled(args, field="pattern"):
    raw = require(args, field)
    try:
        return raw, re.compile(raw)
    except re.error as error:
        raise CannotEvaluate(
            f"args.{field} {raw!r} is not a valid regular expression: {error}"
        ) from error


def read_text(raw, path):
    try:
        return path.read_text(encoding="utf-8")
    except FileNotFoundError as error:
        # The SEC-6 class of claim. A grep over a file that is not there
        # matches nothing, which is indistinguishable from a genuine
        # grep-absent pass -- so this is never allowed to reach a verdict.
        raise CannotEvaluate(
            f"{raw} does not exist, so its contents were never searched"
        ) from error
    except (OSError, UnicodeDecodeError) as error:
        raise CannotEvaluate(
            f"{raw} could not be read ({error}), so its contents were never "
            f"searched") from error


def exists(raw, path):
    try:
        # lexists, so a broken symlink counts as something being there.
        return path.exists() or path.is_symlink()
    except OSError as error:
        raise CannotEvaluate(
            f"{raw} could not be inspected ({error}), so its presence is "
            f"unknown") from error


# ---------------------------------------------------------------------------
# probes
#
# Each returns (holds, detail) or raises CannotEvaluate. No probe returns a
# verdict it did not measure.
# ---------------------------------------------------------------------------

def probe_tag_present(args):
    tag = require(args, "tag")
    index = tag_index()
    if tag in index:
        return True, f"tag exists at {index[tag][:12]}"
    return False, f"tag does not exist ({len(index)} tags read)"


def probe_tag_absent(args):
    tag = require(args, "tag")
    index = tag_index()
    if tag in index:
        return False, f"tag now EXISTS at {index[tag][:12]}"
    return True, f"tag does not exist ({len(index)} tags read)"


def probe_tag_at_commit(args):
    tag = require(args, "tag")
    want = require(args, "commit")
    if not HEX_NAME.fullmatch(want):
        raise CannotEvaluate(
            f"args.commit {want!r} is not a 7-to-40 character lowercase "
            f"hexadecimal object name")
    index = tag_index()
    if tag not in index:
        return False, "tag does not exist, so it points at nothing"
    got = index[tag]
    if got.startswith(want):
        return True, f"tag -> {got[:12]}"
    return False, f"tag -> {got[:12]}, not {want[:12]}"


def probe_file_present(args):
    raw, path = repo_path(args)
    if path.is_file():
        return True, "file exists"
    if exists(raw, path):
        return False, "path exists but is not a regular file"
    return False, "file does not exist"


def probe_file_absent(args):
    raw, path = repo_path(args)
    if exists(raw, path):
        return False, "path now EXISTS"
    return True, "path does not exist"


def probe_grep_present(args):
    raw, path = repo_path(args)
    pattern_text, pattern = compiled(args)
    text = read_text(raw, path)
    match = pattern.search(text)
    if match:
        line = text.count("\n", 0, match.start()) + 1
        return True, f"{pattern_text} matches at {raw}:{line}"
    return False, f"{pattern_text} no longer matches anywhere in {raw}"


def probe_grep_absent(args):
    raw, path = repo_path(args)
    pattern_text, pattern = compiled(args)
    text = read_text(raw, path)
    match = pattern.search(text)
    if match:
        line = text.count("\n", 0, match.start()) + 1
        return False, f"{pattern_text} now MATCHES at {raw}:{line}"
    return True, f"{pattern_text} matches nothing in {raw}"


PROBES = {
    "tag-present": probe_tag_present,
    "tag-absent": probe_tag_absent,
    "tag-at-commit": probe_tag_at_commit,
    "file-present": probe_file_present,
    "file-absent": probe_file_absent,
    "grep-present": probe_grep_present,
    "grep-absent": probe_grep_absent,
}


# ---------------------------------------------------------------------------
# manifest
# ---------------------------------------------------------------------------

def load_manifest(location):
    path = pathlib.Path(location)
    try:
        raw = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError) as error:
        die(f"cannot read the claim manifest {location}: {error}")
    try:
        manifest = json.loads(raw)
    except ValueError as error:
        die(f"claim manifest {location} is not parseable JSON: {error}")
    if not isinstance(manifest, dict) or manifest.get("version") != 1:
        die(f"claim manifest {location} is not a version-1 object")
    claims = manifest.get("claims")
    if not isinstance(claims, list):
        die(f"claim manifest {location} has no 'claims' list")
    if not claims:
        # A manifest with nothing in it would run zero probes and print a
        # green summary having measured nothing at all.
        die(f"claim manifest {location} contains no claims, so a pass would "
            f"assert nothing")

    seen = set()
    for index, claim in enumerate(claims):
        if not isinstance(claim, dict):
            die(f"claim #{index} in {location} is not an object")
        identifier = claim.get("id")
        if not isinstance(identifier, str) or not identifier.strip():
            die(f"claim #{index} in {location} has no usable 'id'")
        if identifier in seen:
            die(f"claim id {identifier!r} appears more than once in "
                f"{location}; results could not be attributed")
        seen.add(identifier)
    return claims


def evaluate(claim):
    """(state, detail) where state is 'holds', 'red', or 'unevaluated'."""
    missing = [f for f in REQUIRED_FIELDS if not claim.get(f)]
    if missing:
        return "unevaluated", f"claim is missing {', '.join(missing)}"
    probe = claim["probe"]
    if probe not in PROBES:
        return "unevaluated", (
            f"probe type {probe!r} is not implemented by this verifier "
            f"(known: {', '.join(sorted(PROBES))})")
    try:
        holds, detail = PROBES[probe](claim["args"])
    except CannotEvaluate as reason:
        return "unevaluated", str(reason)
    return ("holds" if holds else "red"), detail


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", default=DEFAULT_MANIFEST)
    args = parser.parse_args()

    claims = load_manifest(args.manifest)
    print(f"Verifying {len(claims)} documented claim(s) from {args.manifest}\n")
    print(f"{'claim':44s} {'probe':14s} verdict")

    red = []
    unevaluated = []
    for claim in claims:
        state, detail = evaluate(claim)
        if state == "red":
            red.append((claim, detail))
            verdict = "*** NO LONGER TRUE ***"
        elif state == "unevaluated":
            unevaluated.append((claim, detail))
            verdict = "*** CANNOT EVALUATE ***"
        else:
            verdict = "holds"
        probe = claim.get("probe") if isinstance(claim.get("probe"), str) else "?"
        print(f"{claim['id']:44s} {probe:14s} {verdict}")
        if state != "holds":
            print(f"    {detail}")

    for claim, detail in unevaluated:
        print(f"\n::error::CANNOT EVALUATE {claim['id']}: {detail}")
        print(f"  document:  {claim.get('document', '(unrecorded)')}")
        print(f"  claim:     {claim.get('statement', '(unrecorded)')}")
        print("  This probe reached NO verdict. It must not be read as "
              "evidence that the claim still holds.")

    for claim, detail in red:
        print(f"\n::error::CLAIM NO LONGER TRUE {claim['id']}: {detail}")
        print(f"  document:  {claim['document']}")
        print(f"  claim:     {claim['statement']}")
        print(f"  red means: {claim['red_means']}")

    print()
    if unevaluated:
        # Deliberately dominant over the red exit code below. A run that did
        # not measure every claim has not produced a complete verdict about
        # any of them, and must not be reported as one.
        print(f"RESULT: {len(unevaluated)} claim(s) COULD NOT BE EVALUATED and "
              f"{len(red)} no longer hold. Exiting 2: this run is not a "
              f"complete measurement.")
        sys.exit(2)
    if red:
        print(f"RESULT: {len(red)} of {len(claims)} documented claim(s) no "
              f"longer hold. Each is a record and the repository disagreeing. "
              f"Correct whichever is wrong; do not delete the claim.")
        sys.exit(1)
    print(f"RESULT: {len(claims)} documented claim(s) reported CONSISTENT "
          f"with the repository.")
    print()
    # Stated on every green run, deliberately, and NOT only in a handoff
    # document. A control whose caveat lives somewhere else reads as stronger
    # than it is, which is the exact defect this control exists to catch --
    # and the exact defect CTL-01 charges it with. Until CTL-01 lands, the
    # limitation travels with the output.
    print("LIMITATION -- read before relying on this result. Several probes "
          "match TEXT, not the property the claim asserts, so this is "
          "evidence of consistency and NOT proof. Confirmed false-green "
          "paths (CTL-01/CTL-02, docs/plans/HANDOFF_2026-07-30.md):")
    print("  * a retention cap written without the searched-for identifier "
          "passes `event-store-has-no-retention-cap`;")
    print("  * a matching string elsewhere in the same file satisfies a "
          "whole-file grep, without binding to the claimed call site;")
    print("  * `tag-present` does not check that the tag is ANNOTATED, so a "
          "lightweight tag satisfies a claim that names an annotation;")
    print("  * DELETING an entry from the manifest lowers the claim count and "
          "still exits 0 -- the manifest is not itself protected.")
    print("A green run here does not certify any security or audit property. "
          "Closure additionally requires the OBL-30 external trust anchor, "
          "because a candidate can edit this control and its manifest "
          "together.")


if __name__ == "__main__":
    main()
