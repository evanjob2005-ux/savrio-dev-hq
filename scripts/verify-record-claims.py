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
import hashlib
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
    """Map tag name -> (resolved commit, ref object type), or a string saying why not.

    `%(*objectname)` is the peeled target of an annotated tag and is empty for a
    lightweight one, so the fallback to `%(objectname)` handles both.

    `%(objecttype)` is the type of the object the REF points at, which is the
    only thing that distinguishes the two: `tag` for an annotated tag object,
    `commit` for a lightweight ref pointing straight at a commit. Without it a
    lightweight tag satisfies a claim whose statement says "annotated" -- one of
    the CTL-01 false-green paths.
    """
    try:
        out = subprocess.run(
            ["git", "for-each-ref",
             "--format=%(refname:short)\t%(objectname)\t%(*objectname)"
             "\t%(objecttype)",
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
        if len(parts) != 4 or not parts[0]:
            continue
        name, objectname, peeled, objecttype = parts
        index[name] = (peeled or objectname, objecttype)

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
        return raw, re.compile(raw, re.MULTILINE)
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


def flag(args, field, default):
    value = args.get(field, default)
    if not isinstance(value, bool):
        raise CannotEvaluate(f"args.{field} {value!r} is not a boolean")
    return value


def radius(args, field="within"):
    """The scoped probes' line radius. `0` means the anchor's own line."""
    value = args.get(field, 3)
    if not isinstance(value, int) or isinstance(value, bool) or value < 0:
        raise CannotEvaluate(
            f"args.{field} {value!r} is not a non-negative integer")
    return value


def _strip_comments(lines):
    """Remove comment text from each line, preserving line numbering.

    Stateful, because two cheaper versions of this were both defeated:

      * Blanking whole comment LINES left `token: nextId("rvt"),
        // nextCapabilityToken("rvt")` -- the searched-for call still sitting on
        the exact line the claim names.
      * Adding a trailing-`//` regex with a `(?<!:)` lookbehind to spare URLs
        also spared `token://nextCapabilityToken("rvt")`, which is valid
        JavaScript with the value on the next line, and left a `/* ... */` body
        readable as code whenever a continuation line did not begin with `*`:

            export function nextCapabilityToken(prefix: string): string {
            /*
            was: randomUUID()
            */
              return `${prefix}-${counter}`;

        Both re-opened CTL-01 bypass 2 -- a claim about a CSPRNG satisfied by a
        comment -- through the very mechanism added to close it.

    So this walks the text: block-comment state carries across lines, and
    quotes are tracked so `//` inside a string or template literal is never
    mistaken for a comment. That last part matters in both directions. Stripping
    too EAGERLY hides text from an absent-style claim, which reads as
    "satisfied"; `assetPrefix: "//cdn.example.com"` is an ordinary idiom and
    must not truncate the line.

    Residue, disclosed rather than papered over: a regex literal containing
    `//` (`/\\/\\//`) is not tracked, and a template literal spanning several
    lines is only tracked within each line.
    """
    out = []
    in_block = False
    for line in lines:
        buf = []
        quote = None
        index = 0
        end = len(line)
        while index < end:
            char = line[index]
            following = line[index + 1] if index + 1 < end else ""
            if in_block:
                if char == "*" and following == "/":
                    in_block = False
                    index += 2
                    continue
                index += 1
                continue
            if quote:
                buf.append(char)
                if char == "\\":
                    if following:
                        buf.append(following)
                    index += 2
                    continue
                if char == quote:
                    quote = None
                index += 1
                continue
            if char in "\"'`":
                quote = char
                buf.append(char)
                index += 1
                continue
            if char == "/" and following == "/":
                break
            if char == "/" and following == "*":
                in_block = True
                index += 2
                continue
            buf.append(char)
            index += 1
        out.append("".join(buf))
    return out


def code_lines(text, code_only):
    """File lines, with comments removed when code_only is set.

    Emptied in place rather than dropped so that reported line numbers keep
    referring to the real file.
    """
    lines = text.splitlines()
    if not code_only:
        return lines
    return _strip_comments(lines)


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
        target, kind = index[tag]
        return True, f"tag exists at {target[:12]} ({kind} object)"
    return False, f"tag does not exist ({len(index)} tags read)"


def probe_tag_absent(args):
    tag = require(args, "tag")
    index = tag_index()
    if tag in index:
        target, kind = index[tag]
        return False, f"tag now EXISTS at {target[:12]} ({kind} object)"
    return True, f"tag does not exist ({len(index)} tags read)"


def probe_tag_annotated(args):
    """The tag must exist AND be a real annotated tag object.

    CTL-01 bypass 4: `tag-present` is satisfied by a lightweight ref, so a
    record stating that a checkpoint "exists and is annotated" stayed green
    after the annotation -- the immutable evidence PKG-3-CORRECTION-1 depends
    on -- was replaced by a bare pointer. An optional `commit` pins the peeled
    target in the same probe, so identity and annotation cannot drift apart.
    """
    tag = require(args, "tag")
    index = tag_index()
    if tag not in index:
        return False, f"tag does not exist ({len(index)} tags read)"
    target, kind = index[tag]
    if kind != "tag":
        return False, (f"tag is LIGHTWEIGHT (ref points straight at a {kind}), "
                       f"so it carries no annotation")
    want = args.get("commit")
    if want is not None:
        if not isinstance(want, str) or not HEX_NAME.fullmatch(want):
            raise CannotEvaluate(
                f"args.commit {want!r} is not a 7-to-40 character lowercase "
                f"hexadecimal object name")
        if not target.startswith(want):
            return False, (f"annotated tag -> {target[:12]}, not "
                           f"{want[:12]}")
    return True, f"annotated tag object -> {target[:12]}"


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
    got, kind = index[tag]
    if got.startswith(want):
        return True, f"tag -> {got[:12]} ({kind} object)"
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


def _grep(args):
    """(pattern_text, searched_text, raw) honouring the optional code_only arg.

    code_only defaults to false here so that every claim already written
    against these two probes keeps its exact prior meaning. A claim that needs
    comments excluded says so.
    """
    raw, path = repo_path(args)
    pattern_text, pattern = compiled(args)
    text = read_text(raw, path)
    searched = "\n".join(code_lines(text, flag(args, "code_only", False)))
    return pattern_text, pattern, searched, raw


def probe_grep_present(args):
    pattern_text, pattern, text, raw = _grep(args)
    match = pattern.search(text)
    if match:
        line = text.count("\n", 0, match.start()) + 1
        return True, f"{pattern_text} matches at {raw}:{line}"
    return False, f"{pattern_text} no longer matches anywhere in {raw}"


def probe_grep_absent(args):
    pattern_text, pattern, text, raw = _grep(args)
    match = pattern.search(text)
    if match:
        line = text.count("\n", 0, match.start()) + 1
        return False, f"{pattern_text} now MATCHES at {raw}:{line}"
    return True, f"{pattern_text} matches nothing in {raw}"


def probe_grep_scoped(args):
    """`pattern` must match within `within` lines of `anchor`.

    CTL-01 bypass 2 and 5: a whole-file grep is satisfied by a match ANYWHERE
    in the file, so `randomUUID()` surviving in an unrelated helper kept a
    claim green after the generator it names stopped using it. Binding the
    pattern to a named anchor makes the claim about the call site it asserts.

    Both the anchor and the pattern are required to appear. A file where the
    anchor itself has gone is a changed subject, not a satisfied claim.

    `within: 0` means "on the anchor's own line", which is what closes CTL-01
    bypass 3: an unrelated `toHaveLength(205)` added as filler satisfied a
    whole-file grep, and would still satisfy a generous window, but cannot
    satisfy a claim bound to the line asserting on the value under test.

    Comment-only lines are excluded by default, for both anchor and pattern, so
    that a comment cannot stand in for the code the claim describes. Pass
    `code_only: false` for a claim genuinely about prose in a file.
    """
    raw, path = repo_path(args)
    anchor_text, anchor = compiled(args, "anchor")
    pattern_text, pattern = compiled(args)
    within = radius(args)
    text = read_text(raw, path)
    lines = code_lines(text, flag(args, "code_only", True))

    anchor_lines = [i for i, line in enumerate(lines) if anchor.search(line)]
    if not anchor_lines:
        return False, (f"anchor {anchor_text} matches nothing in {raw}, so the "
                       f"claimed site no longer exists")
    for i in anchor_lines:
        lo = max(0, i - within)
        hi = min(len(lines), i + within + 1)
        window = "\n".join(lines[lo:hi])
        if pattern.search(window):
            return True, (f"{pattern_text} matches within {within} line(s) of "
                          f"{anchor_text} at {raw}:{i + 1}")
    sites = ", ".join(f"{raw}:{i + 1}" for i in anchor_lines[:4])
    return False, (f"anchor {anchor_text} is present ({sites}) but "
                   f"{pattern_text} does NOT match within {within} line(s) of "
                   f"it -- the claim's binding to that site is broken")


def probe_grep_scoped_absent(args):
    """`pattern` must NOT match within `within` lines of `anchor`.

    The complement of grep-scoped, and the answer to a proximity bypass it
    could not close on its own. `grep-scoped` asks whether the claimed text is
    NEAR the site, which a decoy satisfies:

        export function nextCapabilityToken(prefix: string): string {
          const unusedEntropy = randomUUID();
          void unusedEntropy;
          return nextId(prefix);
        }

    `randomUUID()` is present, three lines from the anchor, and every token is
    now the predictable counter that SEC-6 was closed on. Proving what must NOT
    be at a site is what excludes that: a claim can require the CSPRNG near the
    generator AND forbid the counter there.

    The anchor must still be present. If it is gone, the claimed site is gone,
    and this reports red rather than treating an absent site as satisfied --
    otherwise deleting the function would prove the claim.
    """
    raw, path = repo_path(args)
    anchor_text, anchor = compiled(args, "anchor")
    pattern_text, pattern = compiled(args)
    within = radius(args)
    text = read_text(raw, path)
    lines = code_lines(text, flag(args, "code_only", True))

    anchor_lines = [i for i, line in enumerate(lines) if anchor.search(line)]
    if not anchor_lines:
        return False, (f"anchor {anchor_text} matches nothing in {raw}, so the "
                       f"claimed site no longer exists and nothing was "
                       f"measured about it")
    for i in anchor_lines:
        lo = max(0, i - within)
        hi = min(len(lines), i + within + 1)
        window_text = "\n".join(lines[lo:hi])
        found = pattern.search(window_text)
        if found:
            return False, (f"{pattern_text} now MATCHES within {within} "
                           f"line(s) of {anchor_text} at {raw}:{i + 1}")
    return True, (f"{pattern_text} matches nothing within {within} line(s) of "
                  f"{anchor_text} in {raw}")


# How a collection loses entries. Enumerating SPELLINGS is what made the first
# version of this probe wrong: it listed six and missed `store.events = []`,
# `store.events = store.events.filter(...)`, and
# `store.events = [...store.events].slice(0, 200)` -- the last being the idiom
# already used elsewhere in the very file the claim is about. So the first form
# below is not a spelling at all: ANY rebinding of the collection is treated as
# suspect, because a rebind can shorten it in unboundedly many ways and a
# control cannot enumerate them.
#
# `(?![=>])` keeps `==`, `===` and `=>` out of the assignment forms. A read-only
# `if (store.events.length === 0)` guard used to be reported as a live retention
# cap, and a control that cries wolf on correct code teaches readers to ignore
# it.
_TRUNCATION_FORMS = (
    (r"\s*=(?![=>])", "rebound to a new value"),
    (r"\.length\s*=(?![=>])", ".length assignment"),
    (r"\.length\s*-=", ".length -="),
    (r"\.splice\s*\(", ".splice("),
    (r"\.pop\s*\(", ".pop("),
    (r"\.shift\s*\(", ".shift("),
    # An argument is required: `.slice()` with none is a defensive copy that
    # shortens nothing, and flagging it would be a false alarm.
    (r"\.slice\s*\(\s*[^)\s]", ".slice( with an argument"),
)


def probe_no_truncation(args):
    """No operation anywhere in `path` shortens the named collection.

    CTL-01 bypass 1, the decisive one. The claim asserted that no retention cap
    exists; the probe searched for the identifier a PREVIOUS cap happened to
    use, so writing a genuinely equivalent cap by other means --
    `if (store.events.length > 200) store.events.length = 200;` -- kept it
    green. This searches for the OPERATION instead of a name.

    Still a static check, and still not proof. Known residue: an alias bound to
    another variable first (`const events = store.events; events.length = 0`),
    eviction performed in a different file, and a shortening call passed as a
    callback rather than applied here. Treating any REBIND as suspect is what
    covers the open-ended cases -- a rebind can shorten a collection in
    unboundedly many ways -- at the cost of flagging a legitimate whole-array
    replacement, which is the right direction for an append-only claim.

    This probe deliberately does NOT execute the retention behaviour. The
    verifier runs in a Python-only CI job with no Node toolchain, so a probe
    that shelled out to Vitest would exit 2 on every run and report nothing.
    The executed arm lives where it can actually run: the append-more-than-200
    test in lib/dev-hq/audit-timeline.test.ts, itself bound by the
    timeline-retention-* claims below so it cannot be gutted while this stays
    green.
    """
    raw, path = repo_path(args)
    collection = require(args, "collection")
    text = read_text(raw, path)
    lines = code_lines(text, flag(args, "code_only", True))

    if collection not in "\n".join(lines):
        return False, (f"{collection} does not appear in {raw} at all, so the "
                       f"claim's subject is gone and nothing was measured "
                       f"about it")

    hits = []
    for i, line in enumerate(lines):
        for form, label in _TRUNCATION_FORMS:
            if re.search(re.escape(collection) + r"\s*" + form, line):
                hits.append(f"{raw}:{i + 1} ({label})")
    if hits:
        return False, (f"{collection} is TRUNCATED at " + "; ".join(hits[:4]) +
                       " -- a retention cap exists")
    return True, (f"{collection} appears in {raw} and is never rebound, "
                  f"spliced, popped, shifted, sliced-with-an-argument, or "
                  f"length-assigned")


PROBES = {
    "tag-present": probe_tag_present,
    "tag-absent": probe_tag_absent,
    "tag-annotated": probe_tag_annotated,
    "tag-at-commit": probe_tag_at_commit,
    "grep-scoped": probe_grep_scoped,
    "grep-scoped-absent": probe_grep_scoped_absent,
    "no-truncation": probe_no_truncation,
    "file-present": probe_file_present,
    "file-absent": probe_file_absent,
    "grep-present": probe_grep_present,
    "grep-absent": probe_grep_absent,
}

# Which args each probe reads: (required, optional). An arg NOT listed here is
# rejected rather than ignored.
#
# Ignoring it was a silent false-green path all of its own: renaming `within` to
# `withn` on a claim bound with `within: 0` restored the permissive 3-line
# default, the claim went on reporting "holds", and nothing anywhere said the
# binding had been loosened. A one-character edit re-opened a closed bypass. The
# same applied to `code_only` and `collection`. A control must not silently
# accept an instruction it did not understand.
PROBE_ARGS = {
    "tag-present": ({"tag"}, set()),
    "tag-absent": ({"tag"}, set()),
    "tag-annotated": ({"tag"}, {"commit"}),
    "tag-at-commit": ({"tag", "commit"}, set()),
    "file-present": ({"path"}, set()),
    "file-absent": ({"path"}, set()),
    "grep-present": ({"path", "pattern"}, {"code_only"}),
    # code_only is deliberately NOT offered on grep-absent. For a claim that
    # something is ABSENT, stripping text can only ever hide a violation, so the
    # option's failure direction is "reads as satisfied" -- the one direction a
    # control may not fail in. Absent claims are matched over the raw file.
    "grep-absent": ({"path", "pattern"}, set()),
    "grep-scoped": ({"path", "anchor", "pattern"}, {"within", "code_only"}),
    "grep-scoped-absent": ({"path", "anchor", "pattern"},
                           {"within", "code_only"}),
    "no-truncation": ({"path", "collection"}, {"code_only"}),
}


def check_args(probe, args):
    """Reject unknown, missing, or non-object args before any probe runs."""
    if not isinstance(args, dict):
        raise CannotEvaluate("args is not an object")
    required, optional = PROBE_ARGS[probe]
    unknown = sorted(set(args) - required - optional)
    if unknown:
        raise CannotEvaluate(
            f"probe {probe!r} does not read args {', '.join(unknown)}. A "
            f"misspelled argument would silently fall back to a more permissive "
            f"default, so it is refused rather than ignored (known: "
            f"{', '.join(sorted(required | optional))})")
    absent = sorted(required - set(args))
    if absent:
        raise CannotEvaluate(
            f"probe {probe!r} requires args {', '.join(absent)}")


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
    return manifest, claims


# ---------------------------------------------------------------------------
# manifest coverage (CTL-02)
# ---------------------------------------------------------------------------

RETIREMENT_FIELDS = ("id", "reason", "authorized_by")


def claim_body(claim):
    """The executable content of a claim, canonically serialised.

    `id` is a LABEL. Comparing only labels left the manifest open to being
    gutted in place: keep the id, the document, the statement and the
    red_means, and swap

        "probe": "no-truncation",
        "args":  {"path": "lib/dev-hq/store.ts", "collection": "store.events"}

    for

        "probe": "file-present",
        "args":  {"path": "lib/dev-hq/store.ts"}

    and a live retention cap reports green with the claim count unchanged and
    the coverage line byte-identical to a clean run -- quieter than the deletion
    CTL-02 closed. What a claim MEANS is its probe and its args, so that is what
    is compared.
    """
    return json.dumps({"probe": claim.get("probe"), "args": claim.get("args")},
                      sort_keys=True, separators=(",", ":"))


def body_digest(body):
    return "sha256:" + hashlib.sha256(body.encode("utf-8")).hexdigest()


def _git_show(spec):
    """(text, reason). Exactly one of the two is None."""
    try:
        out = subprocess.run(["git", "show", spec], capture_output=True)
    except OSError as error:
        return None, f"git could not be executed ({error})"
    if out.returncode != 0:
        detail = " ".join(out.stderr.decode("utf-8", errors="replace").split())
        return None, (f"`git show {spec}` failed with exit {out.returncode} "
                      f"({detail or 'no diagnostic output'})")
    return out.stdout.decode("utf-8", errors="replace"), None


def missing_required_claims(manifest, present):
    """Claim IDs that were required at the pinned baseline and are now gone.

    CTL-02: the verifier enumerated only the claims that REMAINED, so deleting
    an entry took coverage from 15 to 14 and still exited 0. The manifest was
    the one record here that nothing checked, which made "delete the claim"
    the cheapest way to turn any red green -- the single response the header of
    this file says is never correct.

    The authoritative base is the manifest as it stood at a pinned commit, read
    out of git history rather than from any file the same change can edit. A
    removal is legitimate only with an explicit retirement record naming the
    claim, a reason, and who authorized it.

    Fails closed. If the pin is unreadable -- a shallow clone, a rewritten
    history, no git -- then nothing is known about what SHOULD be present, and
    that is CannotEvaluate rather than a silent skip. The structured-data job
    checks out with fetch-depth: 0 for this reason.

    Residue, per OBL-30: one commit can still move the pin and rewrite the
    manifest together. This removes the SILENT change and forces it to appear in
    a diff as a retirement or amendment record; it is not an external trust
    anchor.
    """
    baseline = manifest.get("required_claims_baseline")
    if not isinstance(baseline, dict):
        raise CannotEvaluate(
            "the manifest declares no 'required_claims_baseline', so there is "
            "no authoritative base to compare its claims against and a "
            "deletion or weakening could not be detected")
    path = baseline.get("path")
    if not isinstance(path, str) or not path.strip():
        raise CannotEvaluate(
            "required_claims_baseline.path is missing, blank, or not a string")

    # A tag is tried before a bare commit because a bare commit does not
    # survive this repository's own merge strategy. GIT_STANDARD.md prefers
    # squash merges, after which the pinned branch commit is unreachable from
    # the default branch, `fetch-depth: 0` cannot fetch it, and the job exits 2
    # on every run until someone moves the pin -- teaching reviewers that pin
    # moves are routine maintenance, which launders the one act this design
    # depends on being conspicuous. An annotated tag survives a squash merge.
    refs = []
    tag = baseline.get("tag")
    if tag is not None:
        if not isinstance(tag, str) or not tag.strip():
            raise CannotEvaluate(
                "required_claims_baseline.tag is blank or not a string")
        refs.append(("tag", tag))
    commit = baseline.get("commit")
    if commit is not None:
        if not isinstance(commit, str) or not HEX_NAME.fullmatch(commit):
            raise CannotEvaluate(
                f"required_claims_baseline.commit {commit!r} is not a 7-to-40 "
                f"character lowercase hexadecimal object name")
        refs.append(("commit", commit))
    if not refs:
        raise CannotEvaluate(
            "required_claims_baseline names neither a tag nor a commit, so "
            "there is no base to read")

    raw = resolved = None
    reasons = []
    for kind, ref in refs:
        raw, reason = _git_show(f"{ref}:{path}")
        if reason is None:
            resolved = (kind, ref)
            break
        reasons.append(f"{kind} {ref}: {reason}")
    if resolved is None:
        raise CannotEvaluate(
            f"the baseline manifest at {path} could not be read from any "
            f"declared ref ({'; '.join(reasons)}), so the required claims are "
            f"unknown. In CI, check out with fetch-depth: 0 and fetch-tags")
    kind, ref = resolved

    # The pin must be behind us. Without this it can be moved BACKWARD to a
    # commit predating a claim's introduction, which drops that claim with no
    # retirement record at all.
    if not _is_ancestor(ref):
        raise CannotEvaluate(
            f"the baseline {kind} {ref} is not an ancestor of HEAD, so it does "
            f"not describe a state this commit descends from and a claim could "
            f"have been dropped by moving the pin backward")

    try:
        base = json.loads(raw)
    except ValueError as error:
        raise CannotEvaluate(
            f"the baseline manifest at {ref}:{path} is not parseable JSON "
            f"({error}), so the required claims are unknown") from error
    base_claims = base.get("claims")
    if not isinstance(base_claims, list) or not base_claims:
        raise CannotEvaluate(
            f"the baseline manifest at {ref}:{path} has no non-empty 'claims' "
            f"list, so the required claims are unknown")
    required = {c["id"]: claim_body(c) for c in base_claims
                if isinstance(c, dict) and isinstance(c.get("id"), str)}
    if not required:
        raise CannotEvaluate(
            f"the baseline manifest at {ref}:{path} yielded no usable claim ids")

    retired = set(_authorized(manifest, "retired_claims"))
    amended = _authorized(manifest, "amended_claims", pin_body=True)

    gone = sorted(set(required) - set(present) - retired)
    redefined = sorted(
        identifier for identifier, body in required.items()
        if identifier in present and present[identifier] != body
        and amended.get(identifier) != body_digest(present[identifier]))
    return gone, redefined, len(required) - len(retired)


def _is_ancestor(ref):
    try:
        out = subprocess.run(["git", "merge-base", "--is-ancestor", ref, "HEAD"],
                             capture_output=True)
    except OSError as error:
        raise CannotEvaluate(
            f"git could not be executed ({error}), so the baseline's "
            f"relationship to HEAD is unknown") from error
    if out.returncode == 0:
        return True
    if out.returncode == 1:
        return False
    detail = " ".join(out.stderr.decode("utf-8", errors="replace").split())
    raise CannotEvaluate(
        f"`git merge-base --is-ancestor {ref} HEAD` failed with exit "
        f"{out.returncode} ({detail or 'no diagnostic output'}), so the "
        f"baseline's relationship to HEAD is unknown")


def _authorized(manifest, field, pin_body=False):
    """Ids excused by an explicit record in `field`.

    A record must say what changed, why, and on whose authority. Presence of
    those three strings is all that can be checked here -- `authorized_by` is
    self-asserted, which is squarely inside the OBL-30 residue -- but it forces
    the change to appear in a diff as a claim about authority that a reviewer
    can refuse.
    """
    records = manifest.get(field, [])
    if not isinstance(records, list):
        raise CannotEvaluate(f"'{field}' is present but is not a list")
    wanted = RETIREMENT_FIELDS + (("body",) if pin_body else ())
    excused = {}
    for index, record in enumerate(records):
        if not isinstance(record, dict):
            raise CannotEvaluate(f"{field} #{index} is not an object")
        blank = [f for f in wanted
                 if not isinstance(record.get(f), str)
                 or not record[f].strip()]
        if blank:
            raise CannotEvaluate(
                f"{field} #{index} is missing {', '.join(blank)}; a record "
                f"that does not say what was changed, why, and on whose "
                f"authority is not a reviewed authorization")
        excused[record["id"]] = record.get("body")
    return excused


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
        check_args(probe, claim["args"])
        holds, detail = PROBES[probe](claim["args"])
    except CannotEvaluate as reason:
        return "unevaluated", str(reason)
    return ("holds" if holds else "red"), detail


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", default=DEFAULT_MANIFEST)
    args = parser.parse_args()

    manifest, claims = load_manifest(args.manifest)
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

    # Coverage is checked AFTER the claims so that a broken git or an
    # unreadable baseline still prints every per-claim verdict alongside it. A
    # run learns as much as it can before deciding it cannot conclude.
    missing = []
    redefined = []
    coverage_note = None
    try:
        missing, redefined, required_count = missing_required_claims(
            manifest, {claim["id"]: claim_body(claim) for claim in claims})
        coverage_note = (f"{len(claims)} claim(s) present; "
                         f"{required_count} still required at the pinned "
                         f"baseline")
    except CannotEvaluate as reason:
        unevaluated.append(({"id": "(manifest coverage)",
                             "document": args.manifest,
                             "statement": "the manifest still carries every "
                                          "claim required at its baseline, "
                                          "each still meaning what it meant"},
                            str(reason)))
        print(f"\n::error::CANNOT EVALUATE manifest coverage: {reason}")
        print("  Whether a required claim was deleted or redefined is UNKNOWN. "
              "This must not be read as evidence that none was.")

    for identifier in missing:
        print(f"\n::error::REQUIRED CLAIM DELETED {identifier}")
        print(f"  This id exists in the baseline manifest but not in "
              f"{args.manifest}, and no retired_claims record authorizes its "
              f"removal.")
        print("  Deleting a claim to restore green is the one response that "
              "is never correct. Restore it, or record an authorized "
              "retirement naming the claim, the reason, and the authority.")

    for identifier in redefined:
        print(f"\n::error::REQUIRED CLAIM REDEFINED {identifier}")
        print(f"  This id still appears in {args.manifest}, but its probe or "
              f"args no longer match the baseline, so it does not decide what "
              f"it decided before. This check cannot tell a strengthening from "
              f"a weakening -- it reports that the meaning MOVED, and a human "
              f"decides which it was.")
        print("  Keeping the id while replacing what it measures is a deletion "
              "that does not change the claim count. Restore the body, or "
              "record an authorized amended_claims entry naming the claim, the "
              "reason, and the authority.")

    print()
    if unevaluated:
        # Deliberately dominant over the red exit code below. A run that did
        # not measure every claim has not produced a complete verdict about
        # any of them, and must not be reported as one.
        absent = ""
        if missing or redefined:
            absent = (f" {len(missing)} required claim(s) are missing and "
                      f"{len(redefined)} were redefined.")
        print(f"RESULT: {len(unevaluated)} claim(s) COULD NOT BE EVALUATED and "
              f"{len(red)} no longer hold.{absent} Exiting 2: this run is not a "
              f"complete measurement.")
        sys.exit(2)
    if red or missing or redefined:
        if missing or redefined:
            print(f"RESULT: {len(missing)} required claim(s) MISSING from the "
                  f"manifest ({', '.join(missing) or 'none'}) and "
                  f"{len(redefined)} REDEFINED "
                  f"({', '.join(redefined) or 'none'}); {len(red)} of "
                  f"{len(claims)} present claim(s) no longer hold.")
        else:
            print(f"RESULT: {len(red)} of {len(claims)} documented claim(s) no "
                  f"longer hold. Each is a record and the repository "
                  f"disagreeing. Correct whichever is wrong; do not delete "
                  f"the claim.")
        sys.exit(1)
    print(f"RESULT: {len(claims)} documented claim(s) reported CONSISTENT "
          f"with the repository.")
    if coverage_note:
        print(f"        Manifest coverage: {coverage_note}.")
    print()
    # Stated on every green run, deliberately, and NOT only in a handoff
    # document. A control whose caveat lives somewhere else reads as stronger
    # than it is, which is the exact defect this control exists to catch. The
    # four CTL-01/CTL-02 false-green paths this block used to list are closed
    # and are now regression cases in scripts/test-verify-record-claims.py; what
    # remains is what is genuinely still weak, which is why the block shrank
    # rather than disappeared.
    print("LIMITATION -- read before relying on this result. Every probe here "
          "is static: it reads the tree and git refs, and executes none of the "
          "behaviour a claim describes. This is strong evidence of consistency "
          "and NOT proof. What remains weak:")
    print("  * `no-truncation` treats any REBIND of the collection as suspect "
          "rather than listing spellings, but an alias bound to another "
          "variable first (`const e = store.events; e.length = 0`), eviction "
          "performed in a different file, or a shortening call passed as a "
          "callback would still evade it;")
    print("  * comment stripping tracks quotes and /* ... */ spans, but NOT "
          "regex literals containing '//', and a template literal spanning "
          "several lines is only tracked within each line;")
    print("  * claims still written as whole-file greps prove that text "
          "exists somewhere in the file, not that it binds to the claimed "
          "site; `grep-scoped` and `grep-scoped-absent` bind one, and they are "
          "used only where a claim names a site;")
    print("  * a scoped claim proves PROXIMITY, not data flow. Requiring the "
          "CSPRNG near the generator and forbidding the predictable counter "
          "there is what makes that pair decisive; proximity alone is "
          "satisfiable by an unused decoy.")
    print("A green run here does not certify any security or audit property. "
          "Closure additionally requires the OBL-30 external trust anchor: the "
          "baseline is read from git history and compares each claim's probe "
          "and args, so a silent deletion or in-place weakening fails -- but "
          "one commit can still move the pin and rewrite the manifest "
          "together, and `authorized_by` on a retirement or amendment record "
          "is self-asserted.")


if __name__ == "__main__":
    main()
