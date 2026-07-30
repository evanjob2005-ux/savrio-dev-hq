"""Fixture harness for the inline control logic in pr.yml.

Extracts the shell and Python that run inside the "Validate Pull Request" job
and executes it locally against constructed pull requests. GitHub Actions
itself is never run here.

Usage:  python scripts/test-pr-controls.py [--prohibited-baseline <rev>]
                                           [--whitespace-baseline <rev>]

Why this exists
---------------
`docs/plans/OPEN_OBLIGATIONS.md` carries Package B, which records only that
pr.yml "ran throughout the PKG-3 validation campaign and failed every time"
and diagnoses nothing. Two causes were later found by accident, because a pull
request happened to touch the affected paths:

  1. the prohibited-file allowlist named exactly ".env.example", ".env.sample"
     and ".env.template", so this repository's tracked ".env.local.example"
     was refused (repaired in 2d6699a);
  2. `git diff --check` reported Markdown hard line breaks -- two trailing
     spaces -- as whitespace errors, 59 of them (repaired in 6ccc953 via
     `.gitattributes`).

Nothing systematically exercised these checks, so a remaining cause would stay
hidden until some future pull request tripped it. This harness runs every
`run:` block in pr.yml against a red arm and a null arm, and pins both known
causes with a regression arm that goes red only against the unrepaired
version.

Fixtures are inputs; the logic under test is always the real extracted step.
Nothing here re-implements a check. Where a control carries a pattern list
that could grow, the harness derives that list from the workflow and fails if
a pattern has no fixture.

Every git call runs inside a throwaway sandbox repository, asserted to be
outside this working tree before the call is made.

Exit codes
----------
  0  every expectation met
  1  at least one expectation failed
  3  COULD NOT EVALUATE -- a harness precondition is broken (no bash, a step
     that no longer exists, a workflow whose shape changed, a sandbox that
     does not reproduce an attribute a case depends on). Never a pass.
"""

import argparse
import fnmatch
import os
import re
import shutil
import subprocess
import sys
import tempfile

import yaml

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PR = os.path.join(REPO, ".github", "workflows", "pr.yml")
JOB = "validate-pull-request"

EXIT_CANNOT_EVALUATE = 3


class CannotEvaluate(Exception):
    """A precondition failed, so a case could not be judged either way.

    Raised rather than returned so no caller can mistake an unevaluated case
    for a satisfied one. Caught once, at the bottom of the file, which exits
    with EXIT_CANNOT_EVALUATE.
    """


# --------------------------------------------------------------------------
# extraction
#
# These mirror scripts/test-release-controls.py. They are duplicated rather
# than imported because that harness is outside this package's scope and may
# not be modified to introduce a shared module.
# --------------------------------------------------------------------------

def load(path, text=None):
    if text is None:
        with open(path, encoding="utf-8") as handle:
            text = handle.read()
    return yaml.safe_load(text)


def step(doc, job, name):
    try:
        steps = doc["jobs"][job]["steps"]
    except (KeyError, TypeError) as error:
        raise CannotEvaluate(f"job {job!r} not found in pr.yml: {error}") from error
    for candidate in steps:
        if candidate.get("name") == name:
            return candidate
    raise CannotEvaluate(f"step {name!r} not found in job {job!r}")


def run_of(doc, name, job=JOB):
    body = step(doc, job, name).get("run")
    if not body:
        raise CannotEvaluate(f"step {name!r} has no `run:` body to execute")
    return body


def heredoc(run_text, marker="PYTHON"):
    pattern = r"python <<'%s'\n(.*?)\n%s(?:\n|$)" % (marker, marker)
    match = re.search(pattern, run_text, re.S)
    if not match:
        raise CannotEvaluate(f"no {marker} heredoc found in the extracted step")
    return match.group(1)


def find(pattern, text, what, flags=0):
    """A required piece of the workflow, or a refusal to guess at it."""
    match = re.search(pattern, text, flags)
    if not match:
        raise CannotEvaluate(
            f"could not read {what} out of pr.yml; that step's shape changed "
            f"and the fixtures below would no longer be testing it")
    return match


def bash_exe():
    candidate = r"C:\Program Files\Git\bin\bash.exe"
    if os.path.isfile(candidate):
        return candidate
    found = shutil.which("bash")
    if not found:
        raise CannotEvaluate(
            "no bash interpreter is available; every step in pr.yml runs "
            "under `shell: bash` and none of them can be executed here")
    return found


def run_python(source, env, cwd):
    assert_sandbox(cwd)
    with tempfile.TemporaryDirectory() as tmp:
        script = os.path.join(tmp, "extracted.py")
        with open(script, "w", encoding="utf-8", newline="\n") as handle:
            handle.write(source)
        full = dict(os.environ)
        full.update({k: str(v) for k, v in env.items()})
        proc = subprocess.run([sys.executable, script], capture_output=True,
                              text=True, env=full, cwd=cwd)
    return proc


def run_bash(source, env, cwd):
    # Extracted steps run real git against their cwd. Nothing may run against
    # the Savrio Dev HQ working tree, which other agents edit concurrently.
    assert_sandbox(cwd)
    with tempfile.NamedTemporaryFile("w", suffix=".sh", delete=False,
                                     encoding="utf-8", newline="\n") as handle:
        handle.write(source)
        script = handle.name
    try:
        full = dict(os.environ)
        full.update({k: str(v) for k, v in env.items()})
        proc = subprocess.run([bash_exe(), script], capture_output=True,
                              text=True, env=full, cwd=cwd)
    finally:
        os.unlink(script)
    return proc


# --------------------------------------------------------------------------
# sandbox
# --------------------------------------------------------------------------

SANDBOX_ROOT = os.path.realpath(tempfile.gettempdir())


def assert_sandbox(cwd):
    real = os.path.realpath(cwd)
    if not real.startswith(SANDBOX_ROOT) or os.path.realpath(REPO) in real:
        raise SystemExit(f"refusing to run git outside the sandbox: {cwd}")
    return real


def hermetic_git_env(cwd):
    """Git with this machine's global and system configuration removed.

    A developer's core.whitespace or core.autocrlf would otherwise decide the
    outcome of the whitespace cases, and a GitHub runner has neither. Git
    defaults only, in both the sandbox setup and the extracted step.
    """
    return {
        "GIT_CEILING_DIRECTORIES": SANDBOX_ROOT,
        "GIT_AUTHOR_NAME": "harness", "GIT_AUTHOR_EMAIL": "h@example.invalid",
        "GIT_COMMITTER_NAME": "harness",
        "GIT_COMMITTER_EMAIL": "h@example.invalid",
        "GIT_CONFIG_GLOBAL": os.path.join(cwd, ".gitconfig-none"),
        "GIT_CONFIG_SYSTEM": os.path.join(cwd, ".gitconfig-none"),
    }


def git_sandbox(args, cwd, check=True):
    assert_sandbox(cwd)
    env = dict(os.environ)
    env.update(hermetic_git_env(cwd))
    proc = subprocess.run(["git", *args], cwd=cwd, env=env,
                          capture_output=True, text=True)
    if check and proc.returncode != 0:
        raise CannotEvaluate(f"sandbox git {args} failed: {proc.stderr.strip()}")
    return proc


def write_files(root, files):
    for name, body in files.items():
        path = os.path.join(root, *name.split("/"))
        parent = os.path.dirname(path)
        if parent:
            os.makedirs(parent, exist_ok=True)
        if isinstance(body, bytes):
            with open(path, "wb") as handle:
                handle.write(body)
        else:
            with open(path, "w", encoding="utf-8", newline="\n") as handle:
                handle.write(body)


DEFAULT_BASE = {"README.md": "seed\n"}


def pr_repo(tmp, head_files=None, base_files=None, deleted=(),
            gitattributes=None):
    """A sandbox repository with a base commit and a head commit.

    Returns (work, base_sha, head_sha) -- the two values pr.yml receives as
    `github.event.pull_request.base.sha` and `.head.sha`.
    """
    work = os.path.join(tmp, "work")
    os.makedirs(work, exist_ok=True)
    git_sandbox(["init", "-b", "main", "."], work)

    base = dict(base_files if base_files is not None else DEFAULT_BASE)
    if gitattributes is not None:
        base[".gitattributes"] = gitattributes
    write_files(work, base)
    git_sandbox(["add", "-A"], work)
    git_sandbox(["commit", "-m", "base"], work)
    base_sha = git_sandbox(["rev-parse", "HEAD"], work).stdout.strip()

    if head_files:
        write_files(work, head_files)
    for name in deleted:
        os.remove(os.path.join(work, *name.split("/")))
    git_sandbox(["add", "-A"], work)
    if head_files or deleted:
        git_sandbox(["commit", "-m", "head"], work)
    else:
        git_sandbox(["commit", "--allow-empty", "-m", "head"], work)
    head_sha = git_sandbox(["rev-parse", "HEAD"], work).stdout.strip()
    return work, base_sha, head_sha


def actions_env(tmp, work, extra=None):
    env = {
        "GITHUB_OUTPUT": os.path.join(tmp, "out.txt"),
        "GITHUB_STEP_SUMMARY": os.path.join(tmp, "summary.md"),
        "RUNNER_TEMP": tmp,
    }
    env.update(hermetic_git_env(work))
    if extra:
        env.update(extra)
    return env


def step_outputs(env):
    path = env["GITHUB_OUTPUT"]
    if not os.path.exists(path):
        return {}
    with open(path, encoding="utf-8") as handle:
        return dict(line.strip().split("=", 1) for line in handle if "=" in line)


def blob(rev, path):
    proc = subprocess.run(["git", "show", f"{rev}:{path}"], cwd=REPO,
                          capture_output=True, text=True)
    if proc.returncode != 0:
        raise CannotEvaluate(
            f"could not read {path} at {rev}: {proc.stderr.strip()}")
    return proc.stdout


# --------------------------------------------------------------------------
# reporting
# --------------------------------------------------------------------------

RESULTS = []
NOT_EVALUATED = []
FINDINGS = []


def record(label, ok, detail=""):
    RESULTS.append(bool(ok))
    verdict = "ok  " if ok else "FAIL"
    print(f"  [{verdict}] {label}{': ' + detail if detail else ''}")
    return ok


def expect(label, proc, code, needle=None):
    ok = proc.returncode == code
    detail = ""
    text = proc.stdout + proc.stderr
    if ok and needle:
        ok = needle in text
        if not ok:
            detail = f" (expected text {needle!r} not printed)"
    RESULTS.append(ok)
    verdict = "ok  " if ok else "FAIL"
    print(f"  [{verdict}] {label}: exit {proc.returncode} (wanted {code}){detail}")
    if needle or not ok:
        for line in text.splitlines():
            if line.startswith("::error") or line.startswith("::warning") or \
                    (not ok and line.strip()):
                print(f"         | {line}")
    return proc


def section(title):
    print()
    print("=" * 78)
    print(title)
    print("=" * 78)


def annotations(proc, kind="::error"):
    return [ln for ln in (proc.stdout + proc.stderr).splitlines()
            if ln.startswith(kind)]


def annotated_files(proc, kind="::error"):
    out = set()
    for line in annotations(proc, kind):
        match = re.search(r"file=([^:]+)::", line)
        if match:
            out.add(match.group(1))
    return out


# --------------------------------------------------------------------------
# step inventory -- every step in pr.yml is exercised or explained
# --------------------------------------------------------------------------

COVERED = {
    "Determine changed files":
        "executed against sandbox pull requests; its real outputs feed every "
        "downstream step rather than being hand-written",
    "Reject empty pull requests": "red and null arms",
    "Validate pull request title":
        "red and null arms; both thresholds and the vague-title word list "
        "derived from the step",
    "Validate pull request description":
        "red and null arms; the required-section list derived from the step",
    "Warn about pull request size":
        "advisory only -- both thresholds derived from the step, asserted to "
        "warn without failing, plus the no-warn boundary",
    "Classify documentation-only changes": "red and null arms",
    "Detect prohibited files":
        "red and null arms, a regression arm pinning the 2d6699a cause, and a "
        "completeness assertion that every glob in the step has a fixture",
    "Detect sensitive file changes":
        "advisory only -- one fixture per derived pattern, warn and quiet arms",
    "Detect merge conflict markers and whitespace errors":
        "red and null arms plus a regression arm pinning the 6ccc953 cause",
    "Validate changed structured and Markdown files":
        "red and null arms for YAML, JSON, Markdown fences, and the "
        "missing-parser branch",
    "Pull request summary": "smoke arm -- reporting only, no policy verdict",
}

NOT_COVERABLE = {
    "Check out repository":
        "actions/checkout@3d3c42e -- a pinned marketplace action with no "
        "inline logic in this repository. Nothing to extract or execute.",
    "Set up Python":
        "actions/setup-python@5fda3b9 -- a pinned marketplace action. "
        "Provisioning, not a control.",
    "Install PyYAML":
        "`pip install pyyaml==6.0.2` over the network. Provisioning, not a "
        "control. Its FAILURE MODE is covered: the validator's ImportError "
        "branch is exercised below with yaml shadowed out of the path.",
}


def inventory(doc):
    section("INVENTORY  every step in pr.yml is exercised or explained")
    steps = doc["jobs"][JOB]["steps"]
    names = [s.get("name") for s in steps]
    if not all(names):
        raise CannotEvaluate(
            "pr.yml has an unnamed step; this harness addresses steps by name "
            "and cannot prove it covered one")
    unknown = [n for n in names if n not in COVERED and n not in NOT_COVERABLE]
    if unknown:
        raise CannotEvaluate(
            "pr.yml has step(s) this harness knows nothing about: "
            + ", ".join(repr(n) for n in unknown)
            + " -- refusing to report a pass over an unmeasured control")
    stale = [n for n in list(COVERED) + list(NOT_COVERABLE) if n not in names]
    if stale:
        raise CannotEvaluate(
            "this harness claims step(s) pr.yml no longer has: "
            + ", ".join(repr(n) for n in stale))
    for name in names:
        mark = "cover" if name in COVERED else " NOT "
        why = COVERED.get(name) or NOT_COVERABLE[name]
        print(f"  [{mark}] {name}\n          {why}")
    record(f"all {len(names)} step(s) in pr.yml accounted for", True,
           f"{len(COVERED)} covered, {len(NOT_COVERABLE)} not coverable offline")


# --------------------------------------------------------------------------
# constants derived FROM the workflow, never copied into it
# --------------------------------------------------------------------------

def derived(src):
    title, desc, size = src["title"], src["description"], src["size"]
    return {
        "title_min": int(find(r"-lt (\d+) \]\]", title,
                              "the title minimum length").group(1)),
        "title_max": int(find(r"-gt (\d+) \]\]", title,
                              "the title maximum length").group(1)),
        "vague": find(r"=~ \^\(([^)]+)\)\$", title,
                      "the vague-title word list").group(1).split("|"),
        "body_min": int(find(r"-lt (\d+) \]\]", desc,
                             "the description minimum length").group(1)),
        "sections": re.findall(
            r'"([^"]+)"',
            find(r"required_sections=\(\n(.*?)\n\s*\)", desc,
                 "the required pull request sections", re.S).group(1)),
        "size_files": int(find(r'"\$\{TOTAL_COUNT\}" -gt (\d+)', size,
                               "the file-count size threshold").group(1)),
        "size_lines": int(find(r'"\$\{changed_lines\}" -gt (\d+)', size,
                               "the line-count size threshold").group(1)),
        "sensitive": re.findall(
            r'"([^"]+)"',
            find(r"sensitive_patterns=\(\n(.*?)\n\s*\)", src["sensitive"],
                 "the sensitive path patterns", re.S).group(1)),
        "docs_globs": find(r'case "\$file" in\n\s*([^)]+)\)', src["docs"],
                           "the documentation-only path list"
                           ).group(1).split("|"),
    }


def prohibited_globs(src):
    """Every glob the prohibited-file step acts on, read out of its own
    `case` arms.

    Three kinds of arm, distinguished by what follows the closing paren:
      `<globs>) reason="...";;`  refuses  -> needs a red fixture
      `<globs>) ;;`              exempts  -> needs a null fixture
      `<globs>)`                 opens a nested branch (the .env family)
                                          -> needs a red fixture

    Parsed rather than transcribed so that a pattern added to pr.yml without a
    fixture turns this harness red instead of riding along unmeasured.
    """
    refuse, exempt, family = [], [], []
    for line in src.splitlines():
        match = re.match(r"\s*([^\s#(][^()]*?)\)\s*(reason=\"[^\"]*\";;|;;)?\s*$",
                         line)
        if not match:
            continue
        globs = [g.strip() for g in match.group(1).split("|") if g.strip()]
        tail = match.group(2)
        if tail is None:
            family.extend(g for g in globs if g != "*")
        elif tail == ";;":
            exempt.extend(globs)
        else:
            refuse.extend(g for g in globs if g != "*")
    if not (refuse and exempt and family):
        raise CannotEvaluate(
            "could not read the prohibited-file case arms out of pr.yml "
            f"(refuse={refuse}, exempt={exempt}, family={family}); the step's "
            "shape changed and the fixtures below would not be testing it")
    return refuse + family, exempt


# --------------------------------------------------------------------------
# extraction of every executed step
# --------------------------------------------------------------------------

def pr_sources(text=None):
    doc = load(PR, text)
    src = {
        "changes": run_of(doc, "Determine changed files"),
        "empty": run_of(doc, "Reject empty pull requests"),
        "title": run_of(doc, "Validate pull request title"),
        "description": run_of(doc, "Validate pull request description"),
        "size": run_of(doc, "Warn about pull request size"),
        "docs": run_of(doc, "Classify documentation-only changes"),
        "prohibited": run_of(doc, "Detect prohibited files"),
        "sensitive": run_of(doc, "Detect sensitive file changes"),
        "whitespace": run_of(
            doc, "Detect merge conflict markers and whitespace errors"),
        "validate_files": run_of(
            doc, "Validate changed structured and Markdown files"),
        "summary": run_of(doc, "Pull request summary"),
    }
    src["validate_py"] = heredoc(src["validate_files"])
    return doc, src


def prepare(work, tmp, base_sha, head_sha, src):
    """Run the real "Determine changed files" step, so every downstream case
    reads the changed-*.txt files the workflow itself produced."""
    env = actions_env(tmp, work, {"BASE_SHA": base_sha, "HEAD_SHA": head_sha})
    proc = run_bash(src["changes"], env, cwd=work)
    if proc.returncode != 0:
        raise CannotEvaluate(
            "the 'Determine changed files' step failed inside the sandbox, so "
            f"no downstream case can be judged: {proc.stderr.strip()}")
    return env, step_outputs(env)


# --------------------------------------------------------------------------
# cases
# --------------------------------------------------------------------------

def changed_files_cases(src):
    section("CHANGED SET  the step every later control reads from")

    with tempfile.TemporaryDirectory() as tmp:
        work, base, head = pr_repo(
            tmp,
            base_files={"README.md": "seed\n", "keep.ts": "a\n",
                        "gone.ts": "x\n"},
            head_files={"README.md": "seed\nmore\n", "new.ts": "b\n"},
            deleted=["gone.ts"])
        _, out = prepare(work, tmp, base, head, src)
        ok = (out.get("total_count") == "3" and out.get("content_count") == "2"
              and out.get("insertions") == "2" and out.get("deletions") == "1")
        record("null arm: 1 modified, 1 added, 1 deleted", ok,
               f"total={out.get('total_count')} content="
               f"{out.get('content_count')} +{out.get('insertions')} "
               f"-{out.get('deletions')} (wanted 3 / 2 / +2 / -1)")
        with open(os.path.join(work, "changed-content.txt"),
                  encoding="utf-8") as handle:
            content = handle.read().split()
        record("deleted paths are excluded from the content set",
               "gone.ts" not in content, f"changed-content.txt = {content}")

    with tempfile.TemporaryDirectory() as tmp:
        work, base, head = pr_repo(tmp)
        _, out = prepare(work, tmp, base, head, src)
        record("null arm: an empty pull request reports zero files",
               out.get("total_count") == "0",
               f"total_count={out.get('total_count')}")


def empty_pr_cases(src):
    section("EMPTY PULL REQUEST")
    with tempfile.TemporaryDirectory() as tmp:
        work, _, _ = pr_repo(tmp)
        env = actions_env(tmp, work)
        expect("KNOWN-BAD: a pull request that changes nothing",
               run_bash(src["empty"], {**env, "TOTAL_COUNT": "0"}, cwd=work),
               1, "does not change any files")
        expect("null arm: a pull request that changes 3 files",
               run_bash(src["empty"], {**env, "TOTAL_COUNT": "3"}, cwd=work), 0)


def title_cases(src, d):
    section("TITLE  thresholds and vague-word list read out of the step")
    print(f"  derived: min={d['title_min']} max={d['title_max']} "
          f"vague={d['vague']}")
    with tempfile.TemporaryDirectory() as tmp:
        work, _, _ = pr_repo(tmp)
        env = actions_env(tmp, work)

        def title_case(label, value, code, needle=None):
            return expect(label, run_bash(src["title"],
                                          {**env, "PR_TITLE": value},
                                          cwd=work), code, needle)

        title_case("KNOWN-BAD: empty title", "", 1, "cannot be empty")
        title_case("KNOWN-BAD: whitespace-only title", "     ", 1,
                   "cannot be empty")
        title_case("KNOWN-BAD: one character below the minimum length",
                   "x" * (d["title_min"] - 1), 1, "at least")
        for word in d["vague"]:
            title_case(f"KNOWN-BAD: vague title {word!r} is rejected", word, 1)
            title_case(f"KNOWN-BAD: vague title {word.upper()!r} is rejected",
                       word.upper(), 1)

        title_case("null arm: a real title", "fix(ci): stop refusing env "
                   "templates by exact name", 0)
        title_case("null arm: a title exactly at the minimum length",
                   "x" * d["title_min"], 0)
        proc = title_case("null arm: an over-long title warns but does NOT "
                          "fail", "x" * (d["title_max"] + 1), 0)
        record("the over-long title emitted a warning annotation",
               bool(annotations(proc, "::warning")),
               f"{annotations(proc, '::warning')}")
        title_case("null arm: a title CONTAINING a vague word is not itself "
                   "vague", "fix the release tag rollback path", 0)

        # `${PR_TITLE// }` deletes spaces and nothing else, so the emptiness
        # test only sees U+0020. A title made of tabs clears it, then clears
        # the length test on character count, then is not one of the vague
        # words -- so it passes the whole step. Asserted as OBSERVED, because
        # pr.yml may not be edited in this package.
        proc = run_bash(src["title"],
                        {**env, "PR_TITLE": "\t" * (d["title_min"] + 2)},
                        cwd=work)
        tabs_pass = proc.returncode == 0
        record("HAZARD (observed): a title of nothing but TABS passes every "
               "title check", tabs_pass, f"exit {proc.returncode}")
        if tabs_pass:
            FINDINGS.append(
                "pr.yml 'Validate pull request title' -- the emptiness test "
                "`[[ -z \"${PR_TITLE// }\" ]]` deletes U+0020 and nothing "
                "else, so a title consisting only of tabs (or any other "
                f"whitespace) survives it, clears the {d['title_min']}-"
                "character minimum on raw character count, and passes the "
                "step. Confirmed: a title of "
                f"{d['title_min'] + 2} tab characters exits 0. The same "
                "pattern is used for PR_BODY in 'Validate pull request "
                "description', where the required-section rule happens to "
                "catch it afterwards. This FAILS OPEN. It is not a cause of "
                "Package B -- it lets bad input through rather than failing "
                "good input. NOT REPAIRED -- editing pr.yml is out of scope "
                "for this package.")

        # The vagueness test is anchored (^(update|...)$), so it can only ever
        # match a title that IS one of those words -- and every one of them is
        # shorter than the minimum length checked earlier in the same step. So
        # the earlier gate always fires first and the vagueness branch is
        # unreachable. Both arms above pass either way; this asserts WHICH
        # rule did the work, which is the part that is not obvious.
        longest = max(len(w) for w in d["vague"])
        unreachable = longest < d["title_min"]
        record("the vagueness branch is currently unreachable: the longest "
               "vague word is shorter than the minimum title length",
               unreachable,
               f"longest vague word {longest} chars < min {d['title_min']}")
        proc = run_bash(src["title"], {**env, "PR_TITLE": d["vague"][0]},
                        cwd=work)
        by_length = "at least" in (proc.stdout + proc.stderr)
        record(f"    and {d['vague'][0]!r} is in fact rejected by the LENGTH "
               f"rule, not the vagueness rule", by_length,
               f"{annotations(proc)}")
        if unreachable and by_length:
            FINDINGS.append(
                "pr.yml 'Validate pull request title' -- the vague-title rule "
                "is dead code. The match is anchored (=~ ^(update|updates|"
                "changes|change|fix|fixes|stuff|misc|wip)$), so it can only "
                "fire on a title that is exactly one of those words, and the "
                f"longest is {longest} characters while the minimum-length "
                f"rule earlier in the same step already rejects anything under "
                f"{d['title_min']}. Every input that could reach the vagueness "
                "branch has already exited. This FAILS OPEN in the harmless "
                "direction (the titles it targets are still rejected, by the "
                "length rule) and it is NOT a cause of Package B. NOT REPAIRED "
                "-- editing pr.yml is out of scope for this package.")


def description_cases(src, d):
    section("DESCRIPTION  required sections read out of the step")
    print(f"  derived: min={d['body_min']} sections={d['sections']}")

    filler = "\nThis change repairs the prohibited-file allowlist.\n"

    def body(omit=None):
        return "\n".join(f"{name}\n{filler}" for name in d["sections"]
                         if name != omit)

    with tempfile.TemporaryDirectory() as tmp:
        work, _, _ = pr_repo(tmp)
        env = actions_env(tmp, work)

        def desc_case(label, value, code, needle=None):
            return expect(label, run_bash(src["description"],
                                          {**env, "PR_BODY": value},
                                          cwd=work), code, needle)

        desc_case("KNOWN-BAD: empty description", "", 1, "cannot be empty")
        desc_case("KNOWN-BAD: space-only description", "      ", 1,
                  "cannot be empty")
        # `${PR_BODY// }` deletes spaces only, so a body with a newline in it
        # survives the emptiness test and is caught by the length rule
        # instead. Both reject it; this pins WHICH rule does the work.
        desc_case("KNOWN-BAD: a blank-lines-only description is caught by the "
                  "LENGTH rule, not the emptiness rule", "   \n  \n ", 1,
                  "at least")
        desc_case("KNOWN-BAD: one character below the minimum length",
                  "x" * (d["body_min"] - 1), 1, "at least")
        for name in d["sections"]:
            desc_case(f"KNOWN-BAD: description missing {name!r}", body(name),
                      1, f"Missing required pull request section: {name}")
        full = body()
        record("the null-arm body clears the length gate on its own, so the "
               "section arms above are testing the section rule",
               len(full) >= d["body_min"], f"{len(full)} chars")
        desc_case("null arm: every required section present", full, 0,
                  "description is valid")
        proc = desc_case("null arm: an unresolved TODO warns but does NOT "
                         "fail", full + "\nTODO: follow up.\n", 0)
        record("the TODO body emitted a warning annotation",
               bool(annotations(proc, "::warning")),
               f"{annotations(proc, '::warning')}")


def size_cases(src, d):
    section("SIZE  advisory only -- it must warn and must never fail")
    print(f"  derived: files>{d['size_files']} lines>{d['size_lines']}")
    with tempfile.TemporaryDirectory() as tmp:
        work, _, _ = pr_repo(tmp)
        env = actions_env(tmp, work)

        def size_case(label, files, ins, dels, warn):
            proc = run_bash(src["size"],
                            {**env, "TOTAL_COUNT": str(files),
                             "INSERTIONS": str(ins), "DELETIONS": str(dels)},
                            cwd=work)
            expect(label, proc, 0)
            got = bool(annotations(proc, "::warning"))
            record(f"    warning {'emitted' if warn else 'withheld'}",
                   got == warn, f"{annotations(proc, '::warning')}")

        size_case("null arm: a small pull request", 3, 10, 4, False)
        size_case(f"warn arm: more than {d['size_files']} files",
                  d["size_files"] + 1, 10, 4, True)
        size_case(f"warn arm: more than {d['size_lines']} changed lines", 3,
                  d["size_lines"], 1, True)
        size_case("boundary: exactly at both thresholds does not warn",
                  d["size_files"], d["size_lines"], 0, False)


def docs_cases(src, d):
    section("DOCS-ONLY CLASSIFICATION")
    print(f"  derived: {d['docs_globs']}")

    def docs_case(label, head_files, want):
        with tempfile.TemporaryDirectory() as tmp:
            work, base, head = pr_repo(tmp, head_files=head_files)
            env, _ = prepare(work, tmp, base, head, src)
            os.remove(env["GITHUB_OUTPUT"])
            proc = run_bash(src["docs"], env, cwd=work)
            got = step_outputs(env).get("docs_only")
            record(label, proc.returncode == 0 and got == want,
                   f"docs_only={got} (wanted {want}), exit {proc.returncode}")

    docs_case("null arm: Markdown, docs/ and handbooks/ only",
              {"docs/plan.md": "# plan\n", "notes.txt": "hi\n",
               "handbooks/x.md": "# h\n"}, "true")
    docs_case("KNOWN-BAD: one source file makes it not docs-only",
              {"docs/plan.md": "# plan\n", "lib/app.ts": "export {}\n"},
              "false")
    docs_case("null arm: an empty change set is not classified docs-only",
              None, "false")


PROHIBITED_RED = {
    ".env": "SECRET=1\n",
    ".env.local": "SECRET=1\n",
    ".env.production": "SECRET=1\n",
    ".env.development.local": "SECRET=1\n",
    "app/.env.local": "SECRET=1\n",
    "id_rsa": "key\n",
    "id_dsa": "key\n",
    "id_ecdsa": "key\n",
    "config/id_ed25519": "key\n",
    "a.pem": "cert\n",
    "secret.key": "key\n",
    "certs/server.p12": "cert\n",
    "certs/server.pfx": "cert\n",
    "app.keystore": "store\n",
    "app.jks": "store\n",
    "node_modules/x.js": "module\n",
    "app/node_modules/y.js": "module\n",
    ".next/x.js": "built\n",
    "dist/bundle.js": "built\n",
    "out/page.js": "built\n",
    "build/main.js": "built\n",
    "coverage/report.js": "built\n",
}

PROHIBITED_NULL = {
    ".env.example": "SECRET=\n",
    ".env.sample": "SECRET=\n",
    ".env.template": "SECRET=\n",
    ".env.local.example": "SECRET=\n",
    ".env.production.template": "SECRET=\n",
    "lib/app.ts": "export {}\n",
    "docs/note.md": "# note\n",
}


def prohibited_cases(src, baseline_src, baseline_rev):
    section("PROHIBITED FILES  the 2d6699a cause, pinned")

    refuse, exempt = prohibited_globs(src["prohibited"])
    print(f"  derived refuse globs: {refuse}")
    print(f"  derived exempt globs: {exempt}")

    def matched_by(glob, files):
        return sorted(f for f in files
                      if fnmatch.fnmatchcase(f, glob)
                      or fnmatch.fnmatchcase(os.path.basename(f), glob))

    for glob in refuse:
        hit = matched_by(glob, PROHIBITED_RED)
        record(f"refused glob {glob!r} has a red fixture", bool(hit), f"{hit}")
    for glob in exempt:
        hit = matched_by(glob, PROHIBITED_NULL)
        record(f"exempt glob {glob!r} has a null fixture", bool(hit), f"{hit}")

    def prohibited_run(source, files, label, code):
        with tempfile.TemporaryDirectory() as tmp:
            work, base, head = pr_repo(tmp, head_files=files)
            env, _ = prepare(work, tmp, base, head, src)
            return expect(label, run_bash(source, env, cwd=work), code)

    proc = prohibited_run(src["prohibited"], PROHIBITED_RED,
                          "KNOWN-BAD: every prohibited fixture in one pull "
                          "request", 1)
    flagged = annotated_files(proc)
    for name in PROHIBITED_RED:
        record(f"    refused {name}", name in flagged)

    proc = prohibited_run(src["prohibited"], PROHIBITED_NULL,
                          "null arm: environment templates and ordinary "
                          "sources", 0)
    record("    nothing was flagged", not annotations(proc),
           f"{annotations(proc)}")

    with tempfile.TemporaryDirectory() as tmp:
        work, base, head = pr_repo(
            tmp, base_files={"README.md": "seed\n", ".env": "SECRET=1\n"},
            head_files={"README.md": "seed\nx\n"}, deleted=[".env"])
        env, _ = prepare(work, tmp, base, head, src)
        expect("null arm: DELETING an already-committed .env is not itself a "
               "violation", run_bash(src["prohibited"], env, cwd=work), 0)

    section(f"PROHIBITED FILES BASELINE  the same fixtures against "
            f"{baseline_rev} -- cause #1, before 2d6699a")

    proc = prohibited_run(baseline_src["prohibited"], PROHIBITED_NULL,
                          "REGRESSION: the old allowlist REFUSED this "
                          "repository's own template (expected: cause "
                          "confirmed real)", 1)
    old_flagged = annotated_files(proc)
    record("    the old step named .env.local.example specifically",
           ".env.local.example" in old_flagged, f"{sorted(old_flagged)}")
    record("    and it also refused .env.production.template",
           ".env.production.template" in old_flagged, f"{sorted(old_flagged)}")
    record("    while accepting the three literal names it did list",
           not {".env.example", ".env.sample", ".env.template"} & old_flagged,
           f"{sorted(old_flagged)}")

    proc = prohibited_run(baseline_src["prohibited"], PROHIBITED_RED,
                          "the repair did not weaken the rule: every red "
                          "fixture was refused before it too", 1)
    record("    the repaired step refuses exactly what the old one refused",
           annotated_files(proc) == flagged,
           f"old={len(annotated_files(proc))} new={len(flagged)}")


def whitespace_cases(src, current_attrs, old_attrs, baseline_rev):
    section("CONFLICT MARKERS AND WHITESPACE  the 6ccc953 cause, pinned")

    # The Markdown null arm below is only meaningful if the sandbox actually
    # reproduces the `*.md text -whitespace` attribute that 6ccc953 added.
    # `git diff --check` reads attributes from the working tree, so each
    # sandbox commits this repository's REAL tracked .gitattributes -- not a
    # hand-written stub -- and then asks git whether the attribute is in
    # force. If it is not, the case CANNOT be evaluated, and the harness says
    # so and exits 3 rather than reporting a green arm that proves nothing.
    def attr_of(work, path, name):
        out = git_sandbox(["check-attr", name, "--", path], work).stdout
        return out.strip().rsplit(":", 1)[-1].strip()

    def ws_case(label, head_files, code, attrs, needle=None,
                want_attr="unset"):
        with tempfile.TemporaryDirectory() as tmp:
            work, base, head = pr_repo(tmp, head_files=head_files,
                                       gitattributes=attrs)
            got = attr_of(work, "sample.md", "whitespace")
            if got != want_attr:
                raise CannotEvaluate(
                    "the sandbox does not reproduce the attribute this case "
                    "depends on: `git check-attr whitespace -- sample.md` "
                    f"reported {got!r}, wanted {want_attr!r}. The case would "
                    "prove nothing, so it is not being reported either way.")
            env = actions_env(tmp, work, {"BASE_SHA": base, "HEAD_SHA": head})
            return expect(label, run_bash(src["whitespace"], env, cwd=work),
                          code, needle)

    record("precondition: the tracked .gitattributes still carries the "
           "Markdown whitespace exemption",
           bool(re.search(r"^\*\.md\s+text\s+-whitespace\s*$", current_attrs,
                          re.M)), "*.md text -whitespace")

    hard_break = "A line ending in a hard break  \nand its continuation.\n"
    fails = "Merge conflict markers or whitespace errors"

    ws_case("null arm: nothing wrong at all", {"clean.ts": "export {}\n"}, 0,
            current_attrs)
    ws_case("null arm: Markdown two-space HARD LINE BREAKS pass",
            {"doc.md": hard_break}, 0, current_attrs)
    ws_case("KNOWN-BAD: a leftover conflict marker in a .ts file",
            {"code.ts": "a\n<<<<<<< HEAD\nb\n"}, 1, current_attrs, fails)
    ws_case("KNOWN-BAD: trailing whitespace in a .ts file",
            {"code.ts": "const x = 1;   \n"}, 1, current_attrs, fails)
    ws_case("KNOWN-BAD: a blank line at end of file in a .ts file",
            {"code.ts": "const x = 1;\n\n"}, 1, current_attrs, fails)
    ws_case("PRESERVED: the exemption suppresses only the whitespace half -- "
            "a conflict marker in a .md file is still caught",
            {"doc.md": "a\n<<<<<<< HEAD\nb\n"}, 1, current_attrs, fails)

    section(f"WHITESPACE BASELINE  the same fixture against {baseline_rev} "
            "-- cause #2, before 6ccc953")
    old_md = re.search(r"^\*\.md.*$", old_attrs, re.M)
    record("precondition: the baseline .gitattributes had NO Markdown "
           "whitespace exemption",
           bool(old_md) and "-whitespace" not in old_md.group(0),
           old_md.group(0).strip() if old_md else "no *.md rule at all")
    ws_case("REGRESSION: the same Markdown hard line breaks FAILED before "
            "(expected: cause confirmed real)", {"doc.md": hard_break}, 1,
            old_attrs, fails, want_attr="unspecified")
    ws_case("the baseline agreed on the genuinely clean null arm",
            {"clean.ts": "export {}\n"}, 0, old_attrs,
            want_attr="unspecified")

    section("HAZARD  a THIRD cause of the same failure, found by this harness "
            "and NOT repaired here")
    proc = ws_case("HAZARD: a Markdown setext heading underlined with exactly "
                   "seven '=' is read as a leftover conflict marker",
                   {"doc.md": "Heading\n=======\n\nbody\n"}, 1, current_attrs,
                   fails)
    named = [ln for ln in proc.stdout.splitlines() if "conflict marker" in ln]
    record("    git names it a leftover conflict marker, and the Markdown "
           "whitespace exemption does NOT suppress it", bool(named), f"{named}")
    ws_case("null arm: EIGHT '=' is not a marker, so setext underlines of "
            "other lengths are unaffected",
            {"doc.md": "Heading\n========\n\nbody\n"}, 0, current_attrs)
    if named:
        FINDINGS.append(
            "pr.yml 'Detect merge conflict markers and whitespace errors' "
            "fails any pull request that ADDS a Markdown setext heading "
            "underlined with exactly seven '=' characters (the same applies "
            "to runs of exactly seven '<', '>' or '|'). git's "
            "is_conflict_marker() matches a run of exactly marker_size "
            "identical characters followed by whitespace or end of line, and "
            "that check does not consult the `whitespace` attribute -- so "
            "`*.md text -whitespace` from 6ccc953 does NOT suppress it. Eight "
            "or more '=' does not match, which is why this has not been seen "
            "yet. It is the same failure signature as cause #2: a legitimate, "
            "defect-free Markdown edit fails pr.yml. No tracked file trips it "
            "today, so it is latent rather than active. NOT REPAIRED -- "
            "editing pr.yml requires regenerating the structural approval "
            "record and is a separate authorized package.")


def sensitive_fixture(pattern):
    """A path that contains this derived pattern as a substring, which is what
    the step tests for."""
    if pattern.endswith("/"):
        return pattern + "fixture.txt"
    if "/" in pattern or "." in pattern:
        return pattern
    return f"src/{pattern}/fixture.ts"


def sensitive_cases(src, d):
    section("SENSITIVE PATHS  advisory only -- it must warn and never fail")
    print(f"  derived: {d['sensitive']}")

    def sensitive_case(label, files, want):
        with tempfile.TemporaryDirectory() as tmp:
            work, base, head = pr_repo(tmp, head_files=files)
            env, _ = prepare(work, tmp, base, head, src)
            proc = run_bash(src["sensitive"], env, cwd=work)
            expect(label, proc, 0)
            warned = annotated_files(proc, "::warning")
            record(f"    warned about {len(want)} path(s)", warned == want,
                   f"got {sorted(warned)}")
            return proc

    hits = {sensitive_fixture(p): "x\n" for p in d["sensitive"]}
    record("every derived sensitive pattern has its own fixture path",
           len(hits) == len(d["sensitive"]), f"{sorted(hits)}")
    sensitive_case("warn arm: one file per derived sensitive pattern", hits,
                   set(hits))

    proc = sensitive_case("null arm: ordinary source and documentation",
                          {"lib/app.ts": "export {}\n",
                           "docs/note.md": "# n\n"}, set())
    record("    and it said so explicitly",
           "No sensitive file changes detected" in proc.stdout)


def validate_files_cases(src):
    section("CHANGED FILE VALIDATION  YAML, JSON and Markdown fences")

    def validate_case(label, files, code, needle=None, env_extra=None):
        with tempfile.TemporaryDirectory() as tmp:
            work, base, head = pr_repo(tmp, head_files=files)
            env, _ = prepare(work, tmp, base, head, src)
            proc = run_python(src["validate_py"], {**env, **(env_extra or {})},
                              cwd=work)
            return expect(label, proc, code, needle)

    validate_case("null arm: valid YAML, JSON and Markdown", {
        "a.yml": "key: value\nlist:\n  - 1\n",
        "b.json": '{"a": 1}\n',
        "c.md": "# doc\n\n```ts\nconst x = 1;\n```\n"}, 0,
        "Changed structured and Markdown files are valid")
    validate_case("KNOWN-BAD: malformed YAML", {"a.yml": "key: [unclosed\n"},
                  1, "::error file=a.yml")
    validate_case("KNOWN-BAD: malformed JSON", {"b.json": "{oops}\n"}, 1,
                  "::error file=b.json")
    validate_case("KNOWN-BAD: unbalanced Markdown code fences",
                  {"c.md": "# doc\n\n```ts\nconst x = 1;\n"}, 1,
                  "Unbalanced Markdown code fences")
    validate_case("PRESERVED: an INDENTED fence still counts",
                  {"c.md": "- item\n\n  ```ts\n  const x = 1;\n  ```\n"}, 0)
    validate_case("PRESERVED: a BOM'd file whose fence opens on line 1",
                  {"c.md": b"\xef\xbb\xbf```ts\nconst x = 1;\n```\n"}, 0)
    validate_case("PRESERVED: a BOM'd file with an UNBALANCED fence is still "
                  "caught", {"c.md": b"\xef\xbb\xbf```ts\nconst x = 1;\n"}, 1,
                  "Unbalanced Markdown code fences")

    # The failure mode of the "Install PyYAML" step, which cannot itself run
    # offline: a missing parser must be a hard failure, never a silent skip.
    with tempfile.TemporaryDirectory() as tmp:
        work, base, head = pr_repo(tmp, head_files={"a.yml": "key: value\n"})
        env, _ = prepare(work, tmp, base, head, src)
        shim = os.path.join(tmp, "noyaml")
        os.makedirs(shim)
        write_files(shim, {"yaml.py": 'raise ImportError("no PyYAML here")\n'})
        expect("KNOWN-BAD: PyYAML unavailable -> hard failure, never a silent "
               "skip",
               run_python(src["validate_py"], {**env, "PYTHONPATH": shim},
                          cwd=work), 1, "cannot validate changed YAML files")


def summary_cases(src):
    section("SUMMARY  reporting only, asserted not to fail the job")
    with tempfile.TemporaryDirectory() as tmp:
        work, _, _ = pr_repo(tmp)
        env = actions_env(tmp, work, {
            "TOTAL_COUNT": "3", "INSERTIONS": "10", "DELETIONS": "4",
            "DOCS_ONLY": "false"})
        expect("null arm: the summary step writes and exits clean",
               run_bash(src["summary"], env, cwd=work), 0)
        with open(env["GITHUB_STEP_SUMMARY"], encoding="utf-8") as handle:
            body = handle.read()
        record("    it wrote the run's counts into the step summary",
               "Files changed: 3" in body and "+10 / -4" in body,
               repr(body.strip()[:70]))


def fail_closed_selftest(doc):
    section("FAIL CLOSED  the harness must refuse, not pass, when it cannot "
            "judge a case")
    for label, thunk in (
        ("a step that no longer exists",
         lambda: run_of(doc, "Step That Does Not Exist")),
        ("a run body with no Python heredoc", lambda: heredoc("echo hello")),
        ("a constant that can no longer be read out of the workflow",
         lambda: find(r"THIS_WILL_NEVER_MATCH", "x", "a made-up constant")),
        ("a git blob that does not exist",
         lambda: blob("0" * 40, ".github/workflows/pr.yml")),
        ("a prohibited-file step whose case arms are gone",
         lambda: prohibited_globs("echo hello")),
    ):
        try:
            thunk()
        except CannotEvaluate as error:
            record(f"{label} raises CannotEvaluate", True, f"{str(error)[:70]}")
        else:
            record(f"{label} raises CannotEvaluate", False,
                   "it returned a value instead -- an unevaluated case could "
                   "read as a pass")


# --------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--prohibited-baseline", default="2d6699a~1",
                        help="the pr.yml that refused .env.local.example")
    parser.add_argument("--whitespace-baseline", default="6ccc953~1",
                        help="the .gitattributes with no Markdown whitespace "
                             "exemption")
    args = parser.parse_args()

    bash_exe()        # fail closed here, not part-way through the first case
    doc, src = pr_sources()
    d = derived(src)

    inventory(doc)
    fail_closed_selftest(doc)
    changed_files_cases(src)
    empty_pr_cases(src)
    title_cases(src, d)
    description_cases(src, d)
    size_cases(src, d)
    docs_cases(src, d)

    _, baseline_src = pr_sources(
        blob(args.prohibited_baseline, ".github/workflows/pr.yml"))
    prohibited_cases(src, baseline_src, args.prohibited_baseline)

    whitespace_cases(src, blob("HEAD", ".gitattributes"),
                     blob(args.whitespace_baseline, ".gitattributes"),
                     args.whitespace_baseline)

    sensitive_cases(src, d)
    validate_files_cases(src)
    summary_cases(src)

    section("RESULT")
    bad = RESULTS.count(False)
    print(f"  {len(RESULTS) - bad}/{len(RESULTS)} expectations met")
    for note in NOT_EVALUATED:
        print(f"  NOT EVALUATED: {note}")
    for note in FINDINGS:
        print(f"\n  FINDING (reported, NOT repaired by this harness):\n"
              f"    {note}")
    return 1 if bad else 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except CannotEvaluate as error:
        print(f"\nCOULD NOT EVALUATE: {error}", file=sys.stderr)
        sys.exit(EXIT_CANNOT_EVALUATE)
