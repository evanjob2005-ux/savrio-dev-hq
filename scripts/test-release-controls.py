"""Fixture harness for the inline control logic in release.yml / dependencies.yml.

Extracts the logic that runs inside GitHub Actions and executes it locally
against constructed fixtures. GitHub Actions itself is never run here.

Usage:  python harness.py [--baseline <git-rev>]

Fixtures are shaped like the real `GET /repos/{o}/{r}/commits/{sha}/check-runs`
response; the harness applies the same projection the workflow's `gh api --jq`
filter applies before writing check-runs.jsonl.
"""

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile

import yaml

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RELEASE = os.path.join(REPO, ".github", "workflows", "release.yml")
DEPS = os.path.join(REPO, ".github", "workflows", "dependencies.yml")

SHA = "b3f1c0d9e8a7645312f0dcba9876543210fedcba"


# --------------------------------------------------------------------------
# extraction
# --------------------------------------------------------------------------

def load(path, text=None):
    if text is None:
        with open(path, encoding="utf-8") as handle:
            text = handle.read()
    return yaml.safe_load(text)


def step(doc, job, name):
    for candidate in doc["jobs"][job]["steps"]:
        if candidate.get("name") == name:
            return candidate
    raise SystemExit(f"step {name!r} not found in job {job!r}")


def heredoc(run_text, marker="PYTHON"):
    pattern = r"python <<'%s'\n(.*?)\n%s(?:\n|$)" % (marker, marker)
    match = re.search(pattern, run_text, re.S)
    if not match:
        raise SystemExit("no python heredoc found")
    return match.group(1)


def run_python(source, env, cwd=None):
    with tempfile.TemporaryDirectory() as tmp:
        script = os.path.join(tmp, "extracted.py")
        with open(script, "w", encoding="utf-8") as handle:
            handle.write(source)
        full = dict(os.environ)
        full.update({k: str(v) for k, v in env.items()})
        proc = subprocess.run([sys.executable, script], capture_output=True,
                              text=True, env=full, cwd=cwd or tmp)
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
        bash = (r"C:\Program Files\Git\bin\bash.exe"
                if os.path.isfile(r"C:\Program Files\Git\bin\bash.exe")
                else "bash")
        proc = subprocess.run([bash, script], capture_output=True, text=True,
                              env=full, cwd=cwd)
    finally:
        os.unlink(script)
    return proc


# --------------------------------------------------------------------------
# fixtures shaped like the real check-runs response
# --------------------------------------------------------------------------

ACTIONS_APP = {"id": 15368, "slug": "github-actions", "name": "GitHub Actions"}
FOREIGN_APP = {"id": 99999, "slug": "totally-legit-checks", "name": "Impostor"}

_next_id = [1000]


def check_run(name, status="completed", conclusion="success",
              started_at="2026-07-29T10:00:00Z",
              completed_at="2026-07-29T10:05:00Z",
              app=None, run_id=None):
    """One element of the real response's `check_runs` array."""
    _next_id[0] += 1
    return {
        "id": run_id if run_id is not None else _next_id[0],
        "head_sha": SHA,
        "external_id": "",
        "name": name,
        "status": status,
        "conclusion": conclusion,
        "started_at": started_at,
        "completed_at": completed_at,
        "output": {"title": None, "summary": None},
        "check_suite": {"id": 700000 + _next_id[0]},
        "app": app if app is not None else ACTIONS_APP,
    }


def project(cr):
    """Python transcription of the workflow's `gh api --jq` projection."""
    app = cr.get("app") or {}
    return {
        "id": cr.get("id"),
        "name": cr.get("name"),
        "status": cr.get("status"),
        "conclusion": cr.get("conclusion"),
        "started_at": cr.get("started_at"),
        "completed_at": cr.get("completed_at"),
        "app_slug": app.get("slug"),
        "app_id": app.get("id"),
    }


def write_inputs(tmp, response, combined="success"):
    runs_path = os.path.join(tmp, "check-runs.jsonl")
    with open(runs_path, "w", encoding="utf-8") as handle:
        for cr in response["check_runs"]:
            handle.write(json.dumps(project(cr)) + "\n")
    status_path = os.path.join(tmp, "combined-status.txt")
    with open(status_path, "w", encoding="utf-8") as handle:
        handle.write(combined + "\n")
    return runs_path, status_path


def failed_during_wait(required):
    """Every required check green as verify-checks saw it, plus a later rerun
    of one of them that completed RED while the approval was pending."""
    response = baseline_all_green(required)
    response["check_runs"].append(
        check_run("End-to-End Smoke", run_id=4001, conclusion="failure",
                  started_at="2026-07-29T16:00:00Z",
                  completed_at="2026-07-29T16:09:00Z"))
    return response


def baseline_all_green(required):
    """Every required check green, published by GitHub Actions, plus the
    advisory checks that really do sit on a commit and are not required."""
    runs = [check_run(name) for name in required]
    runs.append(check_run("Markdown (advisory)"))
    runs.append(check_run("Verify Required Checks", status="in_progress",
                          conclusion=None,
                          started_at="2026-07-29T12:00:00Z",
                          completed_at=None))
    return {"total_count": len(runs), "check_runs": runs}


# --------------------------------------------------------------------------
# reporting
# --------------------------------------------------------------------------

RESULTS = []


def expect(label, proc, code, needle=None):
    ok = proc.returncode == code
    detail = ""
    blob = proc.stdout + proc.stderr
    if ok and needle:
        ok = needle in blob
        if not ok:
            detail = f" (expected text {needle!r} not printed)"
    RESULTS.append(ok)
    verdict = "ok  " if ok else "FAIL"
    print(f"  [{verdict}] {label}: exit {proc.returncode} (wanted {code}){detail}")
    if needle or not ok:
        for line in blob.splitlines():
            if line.startswith("::error") or line.startswith("::warning") or \
                    (not ok and line.strip()):
                print(f"         | {line}")
    return proc


def section(title):
    print()
    print("=" * 78)
    print(title)
    print("=" * 78)


# --------------------------------------------------------------------------
# release.yml: required-check verifier
# --------------------------------------------------------------------------

def release_pieces(text=None):
    doc = load(RELEASE, text)
    verify_src = heredoc(step(doc, "verify-checks",
                              "Verify every required check succeeded")["run"])
    publish_src = heredoc(step(doc, "publish",
                               "Re-verify every required check succeeded")["run"])
    verify_env = doc["jobs"]["verify-checks"]["env"]
    publish_env = doc["jobs"]["publish"]["env"]
    return doc, verify_src, publish_src, verify_env, publish_env


def verifier_case(src, label, response, expect_code, needle=None,
                  combined="success", env_extra=None):
    with tempfile.TemporaryDirectory() as tmp:
        runs_path, status_path = write_inputs(tmp, response, combined)
        env = {
            "SHA": SHA,
            "CHECK_RUNS_FILE": runs_path,
            "COMBINED_STATUS_FILE": status_path,
            "GITHUB_STEP_SUMMARY": os.path.join(tmp, "summary.md"),
            "CHECK_PHASE": "harness",
        }
        if env_extra:
            env.update(env_extra)
        proc = run_python(src, env)
    return expect(label, proc, expect_code, needle)


# --------------------------------------------------------------------------
# P0-9 / P0-10: tag lifecycle, executed against a throwaway sandbox repository
#
# Every git call below runs with cwd inside a fresh temp directory and is
# asserted to be there first. Nothing in this section touches the Savrio Dev HQ
# working tree, which other agents are editing concurrently.
# --------------------------------------------------------------------------

SANDBOX_ROOT = os.path.realpath(tempfile.gettempdir())


def assert_sandbox(cwd):
    real = os.path.realpath(cwd)
    if not real.startswith(SANDBOX_ROOT) or os.path.realpath(REPO) in real:
        raise SystemExit(f"refusing to run git outside the sandbox: {cwd}")
    return real


def git_sandbox(args, cwd):
    assert_sandbox(cwd)
    env = dict(os.environ)
    env.update({
        "GIT_CEILING_DIRECTORIES": SANDBOX_ROOT,
        "GIT_AUTHOR_NAME": "harness", "GIT_AUTHOR_EMAIL": "h@example.invalid",
        "GIT_COMMITTER_NAME": "harness", "GIT_COMMITTER_EMAIL": "h@example.invalid",
        "GIT_CONFIG_GLOBAL": os.path.join(cwd, ".gitconfig-none"),
        "GIT_CONFIG_SYSTEM": os.path.join(cwd, ".gitconfig-none"),
    })
    proc = subprocess.run(["git", *args], cwd=cwd, env=env,
                          capture_output=True, text=True)
    if proc.returncode != 0 and args[0] not in ("ls-remote", "rev-parse",
                                                "cat-file", "rev-list"):
        raise SystemExit(f"sandbox git {args} failed: {proc.stderr}")
    return proc


# The one string this workflow accepts as proof that a release is ABSENT
# rather than unreachable. It is a contract with the `gh` CLI, not an
# implementation detail of the workflow, so it is pinned in exactly one place
# here: the stub emits it, and gh_cli_contract_cases() asserts that every
# classification site in release.yml still greps for this same literal, and
# that each site fails CLOSED when the wording changes.
GH_NOT_FOUND = "release not found"

GH_STUB = """#!/usr/bin/env bash
echo "gh $*" >> "$GH_STUB_LOG"
if [[ "$1 $2" == "release view" ]]; then
  if [[ "${GH_STUB_VIEW_ERRORS:-0}" == "1" ]]; then
    echo "error connecting to api.github.com: dial tcp: lookup failed" >&2
    exit 1
  fi
  [[ -f "$GH_STUB_DIR/release-$3" ]] && exit 0
  echo "${GH_STUB_VIEW_NOT_FOUND:-__GH_NOT_FOUND__}" >&2
  exit 1
fi
if [[ "$1 $2" == "release create" ]]; then
  if [[ "${GH_STUB_CREATE_FAILS:-0}" == "1" ]]; then
    [[ "${GH_STUB_CREATE_LEAVES_RELEASE:-0}" == "1" ]] && touch "$GH_STUB_DIR/release-$3"
    echo "stubbed gh: release create failed" >&2
    exit 1
  fi
  touch "$GH_STUB_DIR/release-$3"
  exit 0
fi
exit 0
""".replace("__GH_NOT_FOUND__", GH_NOT_FOUND)


# Imported by the child interpreter that runs the extracted validate step.
GH_PYTHON_SHIM = '''\
import os
import subprocess

_STUB = os.environ["GH_STUB_SCRIPT"]
_init = subprocess.Popen.__init__


def _shimmed(self, args, *rest, **kwargs):
    if (isinstance(args, (list, tuple)) and args
            and os.path.basename(str(args[0])) in ("gh", "gh.exe")):
        args = ["bash", _STUB, *[str(a) for a in args[1:]]]
    _init(self, args, *rest, **kwargs)


subprocess.Popen.__init__ = _shimmed
'''


def sandbox(tmp):
    """A bare origin plus a working clone holding one commit."""
    origin = os.path.join(tmp, "origin.git")
    work = os.path.join(tmp, "work")
    os.makedirs(origin)
    os.makedirs(work)
    git_sandbox(["init", "--bare", "-b", "main", "."], origin)
    git_sandbox(["init", "-b", "main", "."], work)
    with open(os.path.join(work, "file.txt"), "w", encoding="utf-8") as h:
        h.write("release me\n")
    git_sandbox(["add", "file.txt"], work)
    git_sandbox(["commit", "-m", "initial"], work)
    git_sandbox(["remote", "add", "origin", origin], work)
    git_sandbox(["push", "-u", "origin", "main"], work)
    sha = git_sandbox(["rev-parse", "HEAD"], work).stdout.strip()

    bindir = os.path.join(tmp, "bin")
    os.makedirs(bindir)
    with open(os.path.join(bindir, "gh"), "w", encoding="utf-8",
              newline="\n") as h:
        h.write(GH_STUB)
    os.chmod(os.path.join(bindir, "gh"), 0o755)

    # PATH interception is enough for the bash steps: bash runs the
    # extensionless stub directly. It is NOT enough for the validate step,
    # which calls `subprocess.run(["gh", ...])` from Python -- Windows
    # CreateProcess appends only `.exe`, so PATH would resolve straight past
    # the stub to an installed gh.exe and the case would silently measure the
    # developer's real GitHub account instead of the fixture. sitecustomize is
    # the supported hook into the child interpreter; it rewrites only where the
    # executable is found, never the arguments, output, or exit code that the
    # step under test classifies. stub_saw() asserts it actually served.
    shimdir = os.path.join(tmp, "pyshim")
    os.makedirs(shimdir)
    with open(os.path.join(shimdir, "sitecustomize.py"), "w",
              encoding="utf-8") as h:
        h.write(GH_PYTHON_SHIM)

    stubdir = os.path.join(tmp, "ghstate")
    os.makedirs(stubdir)
    runner_temp = os.path.join(tmp, "runnertemp")
    os.makedirs(runner_temp)

    env = {
        "PATH": bindir + os.pathsep + os.environ["PATH"],
        "PYTHONPATH": shimdir,
        "GH_STUB_SCRIPT": os.path.join(bindir, "gh"),
        "GH_STUB_DIR": stubdir,
        "GH_STUB_LOG": os.path.join(tmp, "gh.log"),
        "GH_TOKEN": "stub",
        "RUNNER_TEMP": runner_temp,
        "GITHUB_OUTPUT": os.path.join(tmp, "out.txt"),
        "GITHUB_STEP_SUMMARY": os.path.join(tmp, "summary.md"),
        "GIT_CEILING_DIRECTORIES": SANDBOX_ROOT,
    }
    return origin, work, stubdir, env, sha


def remote_tags(origin, work):
    out = git_sandbox(["ls-remote", "--tags", "origin", "refs/tags/v*"], work)
    return sorted({line.split("refs/tags/")[1].replace("^{}", "")
                   for line in out.stdout.splitlines() if "refs/tags/" in line})


def stub_saw(env, needle):
    """True when the sandbox gh stub -- and not the installed gh -- served the
    call. Without this a PATH resolution failure turns a case into a test of
    the developer's real GitHub account, which fails for its own reasons and
    reads as a pass."""
    path = env["GH_STUB_LOG"]
    if not os.path.exists(path):
        return False
    with open(path, encoding="utf-8") as h:
        return needle in h.read()


def step_outputs(env):
    path = env["GITHUB_OUTPUT"]
    if not os.path.exists(path):
        return {}
    with open(path, encoding="utf-8") as h:
        return dict(line.strip().split("=", 1) for line in h if "=" in line)


def push_annotated(work, tag, sha):
    git_sandbox(["tag", "-a", tag, sha, "-m", tag], work)
    git_sandbox(["push", "origin", f"refs/tags/{tag}"], work)


def tag_lifecycle_cases(doc, old_doc):
    tagstate_src = step(doc, "publish", "Re-verify tag and release state")["run"]
    create_src = step(doc, "publish",
                      "Create annotated tag and GitHub release")["run"]
    digest_snap = step(doc, "validate", "Snapshot the remote release-tag set")["run"]
    digest_check = step(doc, "publish",
                        "Re-check that the remote release-tag set has not moved")["run"]
    old_absence_src = step(old_doc, "publish",
                           "Re-verify tag and release absence")["run"]
    old_create_src = step(old_doc, "publish",
                          "Create annotated tag and GitHub release")["run"]

    def release_env(sha, tag="v1.2.0"):
        return {"TAG": tag, "TITLE": f"Savrio Dev HQ {tag}", "VERSION": "1.2.0",
                "TARGET_SHA": sha, "PRERELEASE": "false", "DRAFT": "false",
                "CHANGELOG": "Fixed things.", "ROLLBACK": "Revert the tag."}

    section("P0-9  a release must be recoverable when `gh release create` "
            "fails after the tag is already on the remote")

    # (a) null arm -- the happy path still works end to end.
    with tempfile.TemporaryDirectory() as tmp:
        origin, work, stub, env, sha = sandbox(tmp)
        e = {**env, **release_env(sha), "RESUME": "false"}
        proc = run_bash(create_src, e, cwd=work)
        ok = (proc.returncode == 0 and remote_tags(origin, work) == ["v1.2.0"]
              and os.path.exists(os.path.join(stub, "release-v1.2.0")))
        RESULTS.append(ok)
        print(f"  [{'ok  ' if ok else 'FAIL'}] null arm: release create "
              f"succeeds -> exit {proc.returncode}, remote tags "
              f"{remote_tags(origin, work)}, release created")

    # (b) known-bad -- release create fails; the tag must be rolled back.
    with tempfile.TemporaryDirectory() as tmp:
        origin, work, stub, env, sha = sandbox(tmp)
        e = {**env, **release_env(sha), "RESUME": "false",
             "GH_STUB_CREATE_FAILS": "1"}
        proc = run_bash(create_src, e, cwd=work)
        tags = remote_tags(origin, work)
        ok = proc.returncode != 0 and tags == []
        RESULTS.append(ok)
        print(f"  [{'ok  ' if ok else 'FAIL'}] KNOWN-BAD: release create fails "
              f"-> exit {proc.returncode}, remote tags after rollback {tags}")
        for line in (proc.stdout + proc.stderr).splitlines():
            if line.startswith("::"):
                print(f"         | {line}")

    # (b-baseline) the same failure against e318491.
    with tempfile.TemporaryDirectory() as tmp:
        origin, work, stub, env, sha = sandbox(tmp)
        e = {**env, **release_env(sha), "GH_STUB_CREATE_FAILS": "1"}
        proc = run_bash(old_create_src, e, cwd=work)
        tags = remote_tags(origin, work)
        wedged = proc.returncode != 0 and tags == ["v1.2.0"]
        RESULTS.append(wedged)
        print(f"  [{'ok  ' if wedged else 'FAIL'}] BASELINE e318491: same "
              f"failure left remote tags {tags} standing "
              f"(expected: wedge confirmed real)")
        rerun = run_bash(old_absence_src, {**env, **release_env(sha)}, cwd=work)
        blocked = rerun.returncode != 0
        RESULTS.append(blocked)
        print(f"  [{'ok  ' if blocked else 'FAIL'}] BASELINE e318491: the "
              f"rerun is then rejected by the duplicate-tag guard -> exit "
              f"{rerun.returncode} (no path forward)")
        for line in (rerun.stdout + rerun.stderr).splitlines():
            if line.startswith("::"):
                print(f"         | {line}")

    # (c) resume -- an orphaned annotated tag at the target, no release.
    with tempfile.TemporaryDirectory() as tmp:
        origin, work, stub, env, sha = sandbox(tmp)
        push_annotated(work, "v1.2.0", sha)
        proc = run_bash(tagstate_src, {**env, **release_env(sha)}, cwd=work)
        outs = step_outputs(env)
        ok = proc.returncode == 0 and outs.get("resume") == "true"
        RESULTS.append(ok)
        print(f"  [{'ok  ' if ok else 'FAIL'}] recovery: orphaned annotated "
              f"tag at the target with no release -> exit {proc.returncode}, "
              f"resume={outs.get('resume')}")
        for line in (proc.stdout + proc.stderr).splitlines():
            if line.startswith("::"):
                print(f"         | {line}")
        # ...and the resumed run then creates the release without re-tagging.
        e = {**env, **release_env(sha), "RESUME": "true"}
        proc2 = run_bash(create_src, e, cwd=work)
        ok2 = (proc2.returncode == 0
               and os.path.exists(os.path.join(stub, "release-v1.2.0")))
        RESULTS.append(ok2)
        print(f"  [{'ok  ' if ok2 else 'FAIL'}] recovery: the resumed run "
              f"creates the release from the existing tag -> exit "
              f"{proc2.returncode}")

    # (d) an existing tag that is NOT ours must still be refused.
    with tempfile.TemporaryDirectory() as tmp:
        origin, work, stub, env, sha = sandbox(tmp)
        git_sandbox(["tag", "v1.2.0", sha], work)          # lightweight
        git_sandbox(["push", "origin", "refs/tags/v1.2.0"], work)
        proc = run_bash(tagstate_src, {**env, **release_env(sha)}, cwd=work)
        expect("null arm for the resume path: a LIGHTWEIGHT tag is not "
               "resumable", proc, 1, "not a resumable partial release")

    with tempfile.TemporaryDirectory() as tmp:
        origin, work, stub, env, sha = sandbox(tmp)
        with open(os.path.join(work, "file.txt"), "a", encoding="utf-8") as h:
            h.write("second\n")
        git_sandbox(["add", "file.txt"], work)
        git_sandbox(["commit", "-m", "second"], work)
        other = git_sandbox(["rev-parse", "HEAD"], work).stdout.strip()
        push_annotated(work, "v1.2.0", other)
        proc = run_bash(tagstate_src, {**env, **release_env(sha)}, cwd=work)
        expect("null arm for the resume path: an annotated tag at the WRONG "
               "commit is not resumable", proc, 1,
               "not a resumable partial release")

    # (e) a real existing release must still be refused.
    with tempfile.TemporaryDirectory() as tmp:
        origin, work, stub, env, sha = sandbox(tmp)
        push_annotated(work, "v1.2.0", sha)
        open(os.path.join(stub, "release-v1.2.0"), "w").close()
        proc = run_bash(tagstate_src, {**env, **release_env(sha)}, cwd=work)
        expect("preserved: an existing RELEASE still aborts the publish",
               proc, 1, "now exists; aborting to avoid a duplicate")

    # (f) gh reports failure but the release actually exists -> do not delete.
    with tempfile.TemporaryDirectory() as tmp:
        origin, work, stub, env, sha = sandbox(tmp)
        e = {**env, **release_env(sha), "RESUME": "false",
             "GH_STUB_CREATE_FAILS": "1", "GH_STUB_CREATE_LEAVES_RELEASE": "1"}
        proc = run_bash(create_src, e, cwd=work)
        tags = remote_tags(origin, work)
        ok = proc.returncode != 0 and tags == ["v1.2.0"]
        RESULTS.append(ok)
        print(f"  [{'ok  ' if ok else 'FAIL'}] rollback is NOT destructive: gh "
              f"errored but the release exists -> exit {proc.returncode}, tag "
              f"deliberately kept {tags}")
        for line in (proc.stdout + proc.stderr).splitlines():
            if line.startswith("::error"):
                print(f"         | {line}")

    # (g) gh release view cannot answer -> the tag must NOT be deleted.
    with tempfile.TemporaryDirectory() as tmp:
        origin, work, stub, env, sha = sandbox(tmp)
        e = {**env, **release_env(sha), "RESUME": "false",
             "GH_STUB_CREATE_FAILS": "1", "GH_STUB_VIEW_ERRORS": "1"}
        proc = run_bash(create_src, e, cwd=work)
        tags = remote_tags(origin, work)
        ok = proc.returncode != 0 and tags == ["v1.2.0"]
        RESULTS.append(ok)
        print(f"  [{'ok  ' if ok else 'FAIL'}] rollback withheld under "
              f"ambiguity: create failed AND `gh release view` could not "
              f"answer -> exit {proc.returncode}, tag kept {tags}")
        for line in (proc.stdout + proc.stderr).splitlines():
            if line.startswith("::error"):
                print(f"         | {line}")

    section("P0-10  a release must not publish against a tag set that moved "
            "while it waited for approval")

    with tempfile.TemporaryDirectory() as tmp:
        origin, work, stub, env, sha = sandbox(tmp)
        push_annotated(work, "v1.1.0", sha)
        snap = run_bash(digest_snap, env, cwd=work)
        digest = step_outputs(env).get("tag_digest", "")
        proc = run_bash(digest_check, {**env, "EXPECTED": digest}, cwd=work)
        expect("null arm: nothing published during the wait", proc, 0)

        os.remove(env["GITHUB_OUTPUT"])
        push_annotated(work, "v1.3.0", sha)      # another release landed
        proc = run_bash(digest_check, {**env, "EXPECTED": digest}, cwd=work)
        expect("KNOWN-BAD: another release tag appeared during the wait",
               proc, 1, "release-tag set changed between validation and publish")

        proc = run_bash(digest_check, {**env, "EXPECTED": ""}, cwd=work)
        expect("KNOWN-BAD: no digest was recorded -> could not evaluate",
               proc, 2, "cannot tell whether the tag set moved")

    old_group = old_doc["concurrency"]["group"]
    new_group = doc["concurrency"]["group"]
    ok = "${{" not in str(new_group) and "${{" in str(old_group)
    RESULTS.append(ok)
    print(f"  [{'ok  ' if ok else 'FAIL'}] concurrency group is now the "
          f"constant {new_group!r}; it was {old_group!r}, which serialized "
          f"only reruns of the same version")


# --------------------------------------------------------------------------
# MAJOR-3 / NBF-5: `gh release view` and `git ls-remote` are each ambiguous
# between "the thing is absent" and "I could not ask". Both must fail CLOSED,
# and must be distinguishable from a property violation (STD-CTRL-001 rule 5).
#
# release.yml calls `gh release view` at THREE sites: validate's resume
# decision, publish's duplicate guard, and publish's rollback. All three are
# exercised below, under the reachable arm and the unreachable arm, from
# identical starting states.
# --------------------------------------------------------------------------

# Reported at the end so a probe that could not run is never silent.
NOT_EVALUATED = []


def gh_view_sites(text):
    """The `gh release view` call sites and absence classifications in a
    release.yml, read from the raw YAML text rather than from the parsed doc so
    a site in any job or shell is seen."""
    return {
        "calls_bash": re.findall(r'gh release view "\$TAG"', text),
        "calls_python": re.findall(r'\["gh", "release", "view", \w+\]', text),
        "classify_bash": re.findall(r'grep -qi "([^"]+)" <<<"\$view_out"', text),
        "classify_python": re.findall(r'if "([^"]+)" in detail\.lower\(\):',
                                      text),
        "bare_exit_code": re.findall(r'if gh release view ', text),
    }


def gh_cli_contract_cases(text, probe):
    section("CLI CONTRACT  the string that means ABSENT is a contract with the "
            "`gh` CLI, and every call site must depend on it identically")

    sites = gh_view_sites(text)
    n_calls = len(sites["calls_bash"]) + len(sites["calls_python"])
    ok = n_calls == 3
    RESULTS.append(ok)
    print(f"  [{'ok  ' if ok else 'FAIL'}] release.yml calls `gh release view` "
          f"at exactly {n_calls} site(s) (wanted 3: validate resume, publish "
          f"duplicate guard, publish rollback) -- a fourth would be unproven")

    classified = sites["classify_bash"] + sites["classify_python"]
    ok = (len(classified) == 3
          and all(c.lower() == GH_NOT_FOUND for c in classified))
    RESULTS.append(ok)
    print(f"  [{'ok  ' if ok else 'FAIL'}] all 3 sites classify absence on the "
          f"same literal {GH_NOT_FOUND!r}; found {classified}")

    ok = not sites["bare_exit_code"]
    RESULTS.append(ok)
    print(f"  [{'ok  ' if ok else 'FAIL'}] no site reads the bare exit code of "
          f"`gh release view` as absence (found "
          f"{len(sites['bare_exit_code'])} such site(s))")

    # The three cases above pin the workflow to GH_NOT_FOUND, and GH_NOT_FOUND
    # is what the stub emits -- so on its own that is a closed loop that would
    # survive `gh` changing its wording. The loop is opened two ways: the drift
    # cases below prove each site fails CLOSED if the wording changes, and this
    # probe asks the installed CLI what it actually prints.
    if not probe:
        NOT_EVALUATED.append(
            "live `gh` CLI contract probe: does the installed gh still print "
            f"{GH_NOT_FOUND!r} for an absent release? (re-run with --gh-probe; "
            "needs network and an authenticated gh)")
        print(f"  [skip] live gh contract probe NOT RUN (hermetic by default; "
              f"pass --gh-probe)")
        return

    absent = "v0.0.0-harness-probe-does-not-exist"
    try:
        proc = subprocess.run(["gh", "release", "view", absent], cwd=REPO,
                              capture_output=True, text=True, timeout=60)
        blob = (proc.stderr + proc.stdout).strip()
    except (OSError, subprocess.SubprocessError) as exc:
        proc, blob = None, f"{type(exc).__name__}: {exc}"
    if proc is not None and proc.returncode != 0 and GH_NOT_FOUND in blob.lower():
        RESULTS.append(True)
        print(f"  [ok  ] the installed gh still prints {GH_NOT_FOUND!r} for an "
              f"absent release -> exit {proc.returncode}: "
              f"{blob.splitlines()[0]}")
    else:
        NOT_EVALUATED.append(
            f"live `gh` CLI contract probe did NOT confirm {GH_NOT_FOUND!r} "
            f"(exit {getattr(proc, 'returncode', 'n/a')}: {blob[:200]}) -- this "
            "is either an unauthenticated/offline gh or real contract drift; "
            "check by hand")
        print(f"  [????] live gh contract NOT CONFIRMED (exit "
              f"{getattr(proc, 'returncode', 'n/a')}): {blob[:200]}")


def gh_ambiguity_cases(doc, pre_doc):
    """`gh release view` / `git ls-remote` ambiguity at every call site."""
    validate_src = heredoc(step(doc, "validate",
                                "Validate version, evidence, and target")["run"])
    tagstate_src = step(doc, "publish", "Re-verify tag and release state")["run"]
    create_src = step(doc, "publish",
                      "Create annotated tag and GitHub release")["run"]
    snapshot_src = step(doc, "validate", "Snapshot the remote release-tag set")["run"]
    recheck_src = step(doc, "publish",
                       "Re-check that the remote release-tag set has not moved")["run"]
    pre_validate_src = heredoc(step(pre_doc, "validate",
                                    "Validate version, evidence, and target")["run"])
    pre_tagstate_src = step(pre_doc, "publish",
                            "Re-verify tag and release state")["run"]

    def release_env(sha, tag="v1.2.0"):
        return {"TAG": tag, "TITLE": f"Savrio Dev HQ {tag}", "VERSION": "1.2.0",
                "TARGET_SHA": sha, "PRERELEASE": "false", "DRAFT": "false",
                "CHANGELOG": "Fixed things.", "ROLLBACK": "Revert the tag."}

    def validate_env(sha):
        return {"VERSION": "1.2.0", "PRERELEASE_INPUT": "false", "TARGET": "",
                "TITLE_INPUT": "", "CHANGELOG": "Fixed things.",
                "ROLLBACK": "Revert the tag.", "ALLOW_NO_NEW_COMMITS": "false",
                "HEAD_SHA": sha}

    def run_validate(src, env, cwd):
        # Same guarantee as run_bash: the extracted step runs real git, so its
        # cwd is asserted to be a throwaway sandbox first.
        assert_sandbox(cwd)
        return run_python(src, env, cwd=cwd)

    def resume_of(env):
        return step_outputs(env).get("resume")

    def expect_stub(env, label):
        ok = stub_saw(env, "release view v1.2.0")
        RESULTS.append(ok)
        print(f"  [{'ok  ' if ok else 'FAIL'}] {label}: the case was served by "
              f"the sandbox gh stub, not by an installed gh")

    # ------------------------------------------------------------ MAJOR-3
    section("MAJOR-3  an unreachable API must not be read as 'no release is "
            "attached' -- publish duplicate guard and validate resume decision")

    # publish duplicate guard / tag-state. Starting state for both arms: an
    # orphaned annotated tag at the target, no release attached.
    with tempfile.TemporaryDirectory() as tmp:
        origin, work, stub, env, sha = sandbox(tmp)
        push_annotated(work, "v1.2.0", sha)
        proc = run_bash(tagstate_src, {**env, **release_env(sha)}, cwd=work)
        ok = proc.returncode == 0 and resume_of(env) == "true"
        RESULTS.append(ok)
        print(f"  [{'ok  ' if ok else 'FAIL'}] null arm (tagstate): gh "
              f"REACHABLE, release genuinely absent -> exit "
              f"{proc.returncode}, resume={resume_of(env)}")

    with tempfile.TemporaryDirectory() as tmp:
        origin, work, stub, env, sha = sandbox(tmp)
        push_annotated(work, "v1.2.0", sha)
        proc = run_bash(tagstate_src,
                        {**env, **release_env(sha), "GH_STUB_VIEW_ERRORS": "1"},
                        cwd=work)
        expect("KNOWN-BAD (tagstate): gh CANNOT REACH the API -> must not "
               "proceed, and must not assert 'no release attached'",
               proc, 2, "could not be determined")
        leaked = "NO RELEASE ATTACHED" in (proc.stdout + proc.stderr).upper()
        RESULTS.append(not leaked)
        print(f"  [{'ok  ' if not leaked else 'FAIL'}] KNOWN-BAD (tagstate): "
              f"no unverified 'no release attached' claim was emitted")

    with tempfile.TemporaryDirectory() as tmp:
        origin, work, stub, env, sha = sandbox(tmp)
        push_annotated(work, "v1.2.0", sha)
        proc = run_bash(pre_tagstate_src,
                        {**env, **release_env(sha), "GH_STUB_VIEW_ERRORS": "1"},
                        cwd=work)
        adopted = proc.returncode == 0 and resume_of(env) == "true"
        RESULTS.append(adopted)
        print(f"  [{'ok  ' if adopted else 'FAIL'}] BASELINE 65bdf2a "
              f"(tagstate): the same unreachable API PASSED the guard -> exit "
              f"{proc.returncode}, resume={resume_of(env)} "
              f"(expected: defect confirmed real)")
        for line in (proc.stdout + proc.stderr).splitlines():
            if line.startswith("::"):
                print(f"         | {line}")

    # validate resume decision, same two arms, same starting state.
    with tempfile.TemporaryDirectory() as tmp:
        origin, work, stub, env, sha = sandbox(tmp)
        push_annotated(work, "v1.2.0", sha)
        proc = run_validate(validate_src, {**env, **validate_env(sha)}, work)
        ok = proc.returncode == 0 and resume_of(env) == "true"
        RESULTS.append(ok)
        print(f"  [{'ok  ' if ok else 'FAIL'}] null arm (validate): gh "
              f"REACHABLE, release genuinely absent -> exit "
              f"{proc.returncode}, resume={resume_of(env)}")
        expect_stub(env, "null arm (validate)")

    with tempfile.TemporaryDirectory() as tmp:
        origin, work, stub, env, sha = sandbox(tmp)
        push_annotated(work, "v1.2.0", sha)
        proc = run_validate(validate_src,
                            {**env, **validate_env(sha),
                             "GH_STUB_VIEW_ERRORS": "1"}, work)
        expect("KNOWN-BAD (validate): gh CANNOT REACH the API -> the tag must "
               "not be adopted as a resumable partial release",
               proc, 2, "whether a release is attached to it could not be "
               "determined")
        expect_stub(env, "KNOWN-BAD (validate)")

    with tempfile.TemporaryDirectory() as tmp:
        origin, work, stub, env, sha = sandbox(tmp)
        push_annotated(work, "v1.2.0", sha)
        proc = run_validate(pre_validate_src,
                            {**env, **validate_env(sha),
                             "GH_STUB_VIEW_ERRORS": "1"}, work)
        adopted = proc.returncode == 0 and resume_of(env) == "true"
        RESULTS.append(adopted)
        print(f"  [{'ok  ' if adopted else 'FAIL'}] BASELINE 65bdf2a "
              f"(validate): the same unreachable API adopted the tag -> exit "
              f"{proc.returncode}, resume={resume_of(env)} "
              f"(expected: defect confirmed real)")
        expect_stub(env, "BASELINE 65bdf2a (validate)")

    # ------------------------------------------------- MINOR-2 contract drift
    section("CLI CONTRACT DRIFT  if a future `gh` rewords its not-found "
            "message, every site must fail CLOSED rather than fail open")

    drift = {"GH_STUB_VIEW_NOT_FOUND": "no release could be found for that tag"}

    with tempfile.TemporaryDirectory() as tmp:
        origin, work, stub, env, sha = sandbox(tmp)
        push_annotated(work, "v1.2.0", sha)
        proc = run_bash(tagstate_src, {**env, **release_env(sha), **drift},
                        cwd=work)
        expect("KNOWN-BAD (tagstate): gh reworded not-found -> could not "
               "evaluate, not 'absent'", proc, 2, "could not be determined")

    with tempfile.TemporaryDirectory() as tmp:
        origin, work, stub, env, sha = sandbox(tmp)
        push_annotated(work, "v1.2.0", sha)
        proc = run_validate(validate_src,
                            {**env, **validate_env(sha), **drift}, work)
        expect("KNOWN-BAD (validate): gh reworded not-found -> could not "
               "evaluate, not 'absent'", proc, 2,
               "whether a release is attached to it could not be determined")
        expect_stub(env, "KNOWN-BAD drift (validate)")

    # The rollback site is deliberately asymmetric: ambiguity keeps the tag.
    # Drift therefore shows up as a withheld rollback, not as an exit code.
    with tempfile.TemporaryDirectory() as tmp:
        origin, work, stub, env, sha = sandbox(tmp)
        e = {**env, **release_env(sha), "RESUME": "false",
             "GH_STUB_CREATE_FAILS": "1"}
        proc = run_bash(create_src, e, cwd=work)
        tags = remote_tags(origin, work)
        ok = proc.returncode != 0 and tags == []
        RESULTS.append(ok)
        print(f"  [{'ok  ' if ok else 'FAIL'}] null arm (rollback): current "
              f"not-found wording -> tag rolled back, remote tags {tags}")

    with tempfile.TemporaryDirectory() as tmp:
        origin, work, stub, env, sha = sandbox(tmp)
        e = {**env, **release_env(sha), "RESUME": "false",
             "GH_STUB_CREATE_FAILS": "1", **drift}
        proc = run_bash(create_src, e, cwd=work)
        tags = remote_tags(origin, work)
        ok = proc.returncode != 0 and tags == ["v1.2.0"]
        RESULTS.append(ok)
        print(f"  [{'ok  ' if ok else 'FAIL'}] KNOWN-BAD (rollback): gh "
              f"reworded not-found -> rollback WITHHELD, tag kept {tags} "
              f"(ambiguity must never delete a tag)")

    # -------------------------------------------------------------- NBF-5
    section("OBL-40  all three remaining ls-remote sites distinguish an "
            "absent ref from an unreachable remote")

    for label, src, extra in (
        ("validation tag-set snapshot", snapshot_src, {}),
        ("post-approval tag-set recheck", recheck_src,
         {"EXPECTED": "intentionally-different"}),
        ("publish resume tag probe", tagstate_src, release_env("unused")),
    ):
        with tempfile.TemporaryDirectory() as tmp:
            origin, work, stub, env, sha = sandbox(tmp)
            case_env = {**env, **extra}
            if label == "publish resume tag probe":
                case_env.update(release_env(sha))
            proc = run_bash(src, case_env, cwd=work)
            # Recheck legitimately exits 1 because EXPECTED is deliberately
            # different; reaching that policy verdict proves it evaluated the
            # reachable remote. The genuine stable exit-0 null for this same
            # step is P0-10's "nothing published during the wait" case.
            expected = 1 if label == "post-approval tag-set recheck" else 0
            ok = proc.returncode == expected
            RESULTS.append(ok)
            arm = ("reachable-evaluation arm" if
                   label == "post-approval tag-set recheck" else "null arm")
            print(f"  [{'ok  ' if ok else 'FAIL'}] {arm} ({label}): "
                  f"reachable remote -> exit {proc.returncode}")

        with tempfile.TemporaryDirectory() as tmp:
            origin, work, stub, env, sha = sandbox(tmp)
            git_sandbox(["remote", "set-url", "origin",
                         os.path.join(tmp, "gone.git")], work)
            case_env = {**env, **extra}
            if label == "publish resume tag probe":
                case_env.update(release_env(sha))
            proc = run_bash(src, case_env, cwd=work)
            expect(f"KNOWN-BAD ({label}): unreachable remote is not absence",
                   proc, 2, "::error::")

            # Mutation arm: remove exactly this production handler's explicit
            # classification branch while preserving the ls-remote call. The
            # corresponding unreachable case must stop satisfying exit-2 +
            # diagnostic, independently for all three sites.
            mutated = re.sub(
                r'if ! ([a-z_]+="\$\(git ls-remote[^\n]+\)"); then\n'
                r'.*?\n\s*fi',
                r'\1',
                src,
                count=1,
                flags=re.S,
            )
            changed = mutated != src
            proc = run_bash(mutated, case_env, cwd=work)
            caught = changed and not (
                proc.returncode == 2 and "::error::" in
                (proc.stdout + proc.stderr)
            )
            RESULTS.append(caught)
            print(f"  [{'ok  ' if caught else 'FAIL'}] mutation ({label}): "
                  "removing its failure branch makes this red arm fail")

    section("NBF-5  `git ls-remote` failing to reach the remote must not read "
            "as 'the tag does not exist there'")

    with tempfile.TemporaryDirectory() as tmp:
        origin, work, stub, env, sha = sandbox(tmp)
        proc = run_validate(validate_src, {**env, **validate_env(sha)}, work)
        ok = proc.returncode == 0 and resume_of(env) == "false"
        RESULTS.append(ok)
        print(f"  [{'ok  ' if ok else 'FAIL'}] null arm: remote REACHABLE and "
              f"the tag genuinely absent there -> exit {proc.returncode}, "
              f"resume={resume_of(env)}")

    with tempfile.TemporaryDirectory() as tmp:
        origin, work, stub, env, sha = sandbox(tmp)
        git_sandbox(["remote", "set-url", "origin",
                     os.path.join(tmp, "gone.git")], work)
        proc = run_validate(validate_src, {**env, **validate_env(sha)}, work)
        expect("KNOWN-BAD: remote UNREACHABLE -> could not evaluate, not "
               "'tag absent'", proc, 2, "exists on the remote")

    with tempfile.TemporaryDirectory() as tmp:
        origin, work, stub, env, sha = sandbox(tmp)
        git_sandbox(["remote", "set-url", "origin",
                     os.path.join(tmp, "gone.git")], work)
        proc = run_validate(pre_validate_src, {**env, **validate_env(sha)},
                            work)
        fell_open = proc.returncode == 0 and resume_of(env) == "false"
        RESULTS.append(fell_open)
        print(f"  [{'ok  ' if fell_open else 'FAIL'}] BASELINE 65bdf2a: the "
              f"unreachable remote read as 'no such tag' and validation "
              f"PASSED -> exit {proc.returncode} "
              f"(expected: defect confirmed real)")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline", default="e318491")
    parser.add_argument("--gh-baseline", default="65bdf2a",
                        help="the commit that landed the release controls "
                             "MAJOR-3 and NBF-5 were found against")
    parser.add_argument("--gh-probe", action="store_true",
                        help="additionally ask the installed `gh` what it "
                             "really prints for an absent release (network)")
    args = parser.parse_args()

    doc, verify_src, publish_src, verify_env, publish_env = release_pieces()
    required = [l.strip() for l in verify_env["REQUIRED_CHECKS"].splitlines()
                if l.strip()]
    app_env = {"REQUIRED_CHECKS": verify_env["REQUIRED_CHECKS"],
               "REQUIRED_CHECK_APP": verify_env["REQUIRED_CHECK_APP"]}

    section("STRUCTURE: the two copies of the verifier must not drift")
    same = verify_src == publish_src
    RESULTS.append(same)
    print(f"  [{'ok  ' if same else 'FAIL'}] verify-checks and publish run "
          f"byte-identical verifier source ({len(verify_src)} chars)")
    for key in ("REQUIRED_CHECKS", "REQUIRED_CHECK_APP"):
        eq = verify_env[key] == publish_env[key]
        RESULTS.append(eq)
        print(f"  [{'ok  ' if eq else 'FAIL'}] {key} identical in both jobs")
    ordered = [s.get("name") for s in doc["jobs"]["publish"]["steps"]]
    after = (ordered.index("Re-verify every required check succeeded")
             < ordered.index("Create annotated tag and GitHub release"))
    RESULTS.append(after)
    print(f"  [{'ok  ' if after else 'FAIL'}] publish re-verifies checks before "
          f"it tags; publish is gated by environment="
          f"{doc['jobs']['publish']['environment']!r}")

    # ---------------------------------------------------------------- P0-7
    section("P0-7  an obsolete completed success must not outrank a newer "
            "in-progress rerun")

    green = baseline_all_green(required)
    verifier_case(verify_src, "null arm: every required check completed green",
                  green, 0, "All 16 required check(s) succeeded", env_extra=app_env)

    stale = baseline_all_green(required)
    stale["check_runs"].append(
        check_run("Secret Scan", run_id=2001, status="in_progress",
                  conclusion=None, started_at="2026-07-29T12:00:00Z",
                  completed_at=None))
    verifier_case(verify_src,
                  "KNOWN-BAD: old completed success + newer in-progress rerun",
                  stale, 1, "still in flight", env_extra=app_env)

    queued = baseline_all_green(required)
    queued["check_runs"].append(
        check_run("Secret Scan", run_id=2002, status="queued", conclusion=None,
                  started_at="2026-07-29T12:00:00Z", completed_at=None))
    verifier_case(verify_src,
                  "KNOWN-BAD: old completed success + newer queued rerun",
                  queued, 1, "still in flight", env_extra=app_env)

    rerun_green = {"total_count": 0, "check_runs": []}
    for name in required:
        if name == "Secret Scan":
            rerun_green["check_runs"].append(
                check_run(name, run_id=1001, conclusion="failure",
                          started_at="2026-07-29T10:00:00Z",
                          completed_at="2026-07-29T10:05:00Z"))
            rerun_green["check_runs"].append(
                check_run(name, run_id=2001, conclusion="success",
                          started_at="2026-07-29T12:00:00Z",
                          completed_at="2026-07-29T12:06:00Z"))
        else:
            rerun_green["check_runs"].append(check_run(name))
    verifier_case(verify_src,
                  "null arm: historical failure superseded by a newer success "
                  "must still pass",
                  rerun_green, 0, "All 16 required check(s) succeeded",
                  env_extra=app_env)

    unorderable = baseline_all_green(required)
    unorderable["check_runs"].append(
        check_run("Secret Scan", run_id=0, started_at=None, completed_at=None))
    for cr in unorderable["check_runs"]:
        if cr["id"] == 0:
            cr["id"] = None
    verifier_case(verify_src,
                  "KNOWN-BAD: a required run with neither started_at nor id",
                  unorderable, 2, "cannot be ordered", env_extra=app_env)

    # --------------------------------------------------------------- P2-29
    section("P2-29  a required check name must be honoured only from the "
            "expected publishing app")

    impostor_only = {"total_count": 0, "check_runs": []}
    for name in required:
        app = FOREIGN_APP if name == "Secret Scan" else ACTIONS_APP
        impostor_only["check_runs"].append(check_run(name, app=app))
    verifier_case(verify_src,
                  "KNOWN-BAD: the only 'Secret Scan' run is from a foreign app",
                  impostor_only, 1, "is not the required publisher",
                  env_extra=app_env)

    impostor_beside = baseline_all_green(required)
    impostor_beside["check_runs"].append(
        check_run("npm Audit", run_id=3001, app=FOREIGN_APP,
                  started_at="2026-07-29T13:00:00Z",
                  completed_at="2026-07-29T13:01:00Z"))
    verifier_case(verify_src,
                  "KNOWN-BAD: foreign green run alongside the genuine green one",
                  impostor_beside, 1, "is not the required publisher",
                  env_extra=app_env)

    unrelated_foreign = baseline_all_green(required)
    unrelated_foreign["check_runs"].append(
        check_run("codecov/patch", app=FOREIGN_APP))
    verifier_case(verify_src,
                  "null arm: a foreign app reporting a NON-required name is fine",
                  unrelated_foreign, 0, "All 16 required check(s) succeeded",
                  env_extra=app_env)

    verifier_case(verify_src,
                  "KNOWN-BAD: publisher allowlist blank -> could not evaluate",
                  green, 2, "REQUIRED_CHECK_APP is empty",
                  env_extra={"REQUIRED_CHECKS": verify_env["REQUIRED_CHECKS"],
                             "REQUIRED_CHECK_APP": "  "})

    # ------------------------------------------------ preserved behaviour
    section("PRESERVED  behaviour landed in e318491 that must not regress")

    skipped = {"total_count": 0, "check_runs": []}
    for name in required:
        skipped["check_runs"].append(
            check_run(name, conclusion="skipped" if name == "npm Audit"
                      else "success"))
    verifier_case(verify_src, "a required check with conclusion=skipped fails",
                  skipped, 1, "conclusion=skipped", env_extra=app_env)

    missing = {"total_count": 0, "check_runs": [
        check_run(n) for n in required if n != "npm Audit"]}
    verifier_case(verify_src, "an absent required check fails",
                  missing, 1, "has no check run from", env_extra=app_env)

    verifier_case(verify_src, "combined commit status 'failure' fails",
                  baseline_all_green(required), 1,
                  "Combined commit status", combined="failure",
                  env_extra=app_env)

    verifier_case(verify_src, "empty combined status -> could not evaluate",
                  baseline_all_green(required), 2,
                  "combined commit status", combined="",
                  env_extra=app_env)

    verifier_case(verify_src, "empty REQUIRED_CHECKS -> could not evaluate",
                  green, 2, "REQUIRED_CHECKS is empty",
                  env_extra={"REQUIRED_CHECKS": "\n",
                             "REQUIRED_CHECK_APP": "github-actions"})

    # ------------------------------------------------- baseline null arms
    section(f"BASELINE  the same known-bad fixtures against {args.baseline} "
            "(the verifier as landed, before this fix)")
    blob = subprocess.run(
        ["git", "show", f"{args.baseline}:.github/workflows/release.yml"],
        capture_output=True, text=True, cwd=REPO)
    if blob.returncode != 0:
        raise SystemExit("could not read the baseline blob")
    old_doc = load(RELEASE, blob.stdout)
    if True:
        old_src = heredoc(step(old_doc, "verify-checks",
                               "Verify every required check succeeded")["run"])
        old_env = {"REQUIRED_CHECKS":
                   old_doc["jobs"]["verify-checks"]["env"]["REQUIRED_CHECKS"]}
        passed = "All 16 required check(s) succeeded"
        verifier_case(old_src,
                      "P0-7 known-bad fixture PASSED the old verifier "
                      "(expected: defect confirmed real)",
                      stale, 0, passed, env_extra=old_env)
        verifier_case(old_src,
                      "P2-29 impostor-beside fixture PASSED the old verifier "
                      "(expected: defect confirmed real)",
                      impostor_beside, 0, passed, env_extra=old_env)
        verifier_case(old_src,
                      "old verifier agreed on the all-green null arm",
                      green, 0, passed, env_extra=old_env)

    # --------------------------------------------------------------- P0-11
    section("P0-11  required checks must be re-evaluated AFTER the approval "
            "wait, by the copy that runs inside the gated publish job")
    verifier_case(publish_src,
                  "null arm: publish copy accepts a commit still fully green",
                  green, 0, "All 16 required check(s) succeeded",
                  env_extra=app_env)
    verifier_case(publish_src,
                  "KNOWN-BAD: a required check went pending DURING the "
                  "approval wait -- publish copy refuses to publish",
                  stale, 1, "still in flight", env_extra=app_env)
    verifier_case(publish_src,
                  "KNOWN-BAD: a required check was re-run and FAILED during "
                  "the approval wait -- publish copy refuses to publish",
                  failed_during_wait(required), 1, "conclusion=failure",
                  env_extra=app_env)

    # --------------------------------------------------- dependencies.yml
    section("P2-30  a missing package-lock.json must not read as a satisfied "
            "control")

    deps = load(DEPS)
    manifest_src = step(deps, "manifest-health",
                        "Detect ecosystems and validate lockfiles")["run"]
    detect_src = step(deps, "npm-audit", "Require a lockfile to audit")["run"]

    def files_case(label, files, src, code, needle=None):
        with tempfile.TemporaryDirectory() as tmp:
            for name, body in files.items():
                with open(os.path.join(tmp, name), "w", encoding="utf-8") as h:
                    h.write(body)
            summary = os.path.join(tmp, "summary.md")
            proc = run_bash(src, {"GITHUB_STEP_SUMMARY": summary,
                                  "GITHUB_OUTPUT": os.path.join(tmp, "out.txt")},
                            cwd=tmp)
        return expect(label, proc, code, needle)

    files_case("null arm: manifest + lockfile present",
               {"package.json": "{}", "package-lock.json": "{}"},
               manifest_src, 0)
    files_case("KNOWN-BAD: package.json with NO lockfile",
               {"package.json": "{}"}, manifest_src, 1,
               "no lockfile was found")
    files_case("null arm: documentation-only repo, no manifests at all",
               {"README.md": "hi"}, manifest_src, 0)
    files_case("preserved: two JavaScript lockfiles",
               {"package.json": "{}", "package-lock.json": "{}",
                "yarn.lock": ""}, manifest_src, 1, "Multiple JavaScript")
    files_case("preserved: lockfile with no manifest",
               {"package-lock.json": "{}"}, manifest_src, 1,
               "without a package.json")

    files_case("null arm: npm-audit lockfile gate with a lockfile present",
               {"package.json": "{}", "package-lock.json": "{}"},
               detect_src, 0)
    files_case("KNOWN-BAD: npm-audit lockfile gate with NO lockfile",
               {"package.json": "{}"}, detect_src, 2,
               "could not evaluate")

    section("P2-30 BASELINE  the same known-bad inputs against "
            f"{args.baseline}")
    dblob = subprocess.run(
        ["git", "show", f"{args.baseline}:.github/workflows/dependencies.yml"],
        capture_output=True, text=True, cwd=REPO)
    old_deps = load(DEPS, dblob.stdout)
    old_manifest = step(old_deps, "manifest-health",
                        "Detect ecosystems and validate lockfiles")["run"]
    old_detect = step(old_deps, "npm-audit", "Detect npm project")["run"]
    files_case("manifest-health PASSED with no lockfile "
               "(expected: defect confirmed real)",
               {"package.json": "{}"}, old_manifest, 0)
    files_case("npm-audit detect PASSED with no lockfile and set npm=false, "
               "skipping every later step (expected: defect confirmed real)",
               {"package.json": "{}"}, old_detect, 0)

    # --------------------------------------------------------------- P2-31
    section("P2-31  the npm-audit control must validate the auditor's "
            "exit-code domain")

    audit_src = heredoc(step(deps, "npm-audit", "Run npm audit")["run"])
    old_audit_src = heredoc(step(old_deps, "npm-audit", "Run npm audit")["run"])

    def report(critical=0, high=0, moderate=0, low=0, info=0, error=None):
        body = {"metadata": {"vulnerabilities": {
            "info": info, "low": low, "moderate": moderate,
            "high": high, "critical": critical,
            "total": info + low + moderate + high + critical}}}
        if error is not None:
            body["error"] = error
        return json.dumps(body)

    def audit_case(label, exit_code, body, src, code, needle=None):
        with tempfile.TemporaryDirectory() as tmp:
            with open(os.path.join(tmp, "audit.json"), "w",
                      encoding="utf-8") as h:
                h.write(body)
            proc = run_python(src, {"AUDIT_EXIT": exit_code,
                                    "GITHUB_STEP_SUMMARY":
                                        os.path.join(tmp, "summary.md")},
                              cwd=tmp)
        return expect(label, proc, code, needle)

    audit_case("null arm: exit 1 with 2 moderate, 0 high/critical "
               "(this repository's real audit output today)",
               1, report(moderate=2), audit_src, 0, "npm audit passed")
    audit_case("null arm: exit 0 with a completely clean report",
               0, report(), audit_src, 0, "npm audit passed")
    audit_case("KNOWN-BAD: exit 127 with an otherwise perfect clean report",
               127, report(), audit_src, 2, "outside the documented domain")
    audit_case("KNOWN-BAD: exit 134 (crash) with a clean report",
               134, report(), audit_src, 2, "outside the documented domain")
    audit_case("KNOWN-BAD: exit code not an integer",
               "", report(), audit_src, 2, "is not an integer")
    audit_case("KNOWN-BAD: exit 0 contradicted by 3 high in the report",
               0, report(high=3), audit_src, 2, "exit code 0 asserts")
    audit_case("KNOWN-BAD: exit 1 contradicted by an empty report",
               1, report(), audit_src, 2, "exit code 1 asserts")
    audit_case("preserved: a real policy violation is exit 1, NOT exit 2",
               1, report(critical=1), audit_src, 1, "npm audit policy failed")
    audit_case("preserved: npm error object -> could not evaluate",
               1, report(moderate=2, error={"code": "ENETUNREACH"}),
               audit_src, 2, "reported an error object")

    section(f"P2-31 BASELINE  the same known-bad inputs against "
            f"{args.baseline}")
    audit_case("exit 127 with a clean report PASSED the old control "
               "(expected: defect confirmed real)",
               127, report(), old_audit_src, 0, "npm audit passed")
    audit_case("exit 0 contradicted by 3 high: old control failed on POLICY "
               "but never noticed the contradiction",
               0, report(high=3), old_audit_src, 1)
    audit_case("old control agreed on the clean null arm",
               0, report(), old_audit_src, 0, "npm audit passed")

    tag_lifecycle_cases(doc, old_doc)

    with open(RELEASE, encoding="utf-8") as handle:
        release_text = handle.read()
    gh_cli_contract_cases(release_text, args.gh_probe)

    gh_blob = subprocess.run(
        ["git", "show", f"{args.gh_baseline}:.github/workflows/release.yml"],
        capture_output=True, text=True, cwd=REPO)
    if gh_blob.returncode != 0:
        raise SystemExit(f"could not read the {args.gh_baseline} blob")
    gh_ambiguity_cases(doc, load(RELEASE, gh_blob.stdout))

    section("RESULT")
    bad = RESULTS.count(False)
    print(f"  {len(RESULTS) - bad}/{len(RESULTS)} expectations met")
    for note in NOT_EVALUATED:
        print(f"  NOT EVALUATED: {note}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
