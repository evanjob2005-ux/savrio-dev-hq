"""Structural census of workflow steps: base vs working tree.

The point of this script is what "YAML parses" cannot tell you. A deleted `if:`
guard leaves valid YAML, resolvable step names, and a fully green gate set --
that is exactly how two guards were removed and shipped last cycle. So compare
normalised step structures and assert the guard counts.
"""
import subprocess
import sys

import yaml

BASE = "origin/feature/dev-hq-operating-system"
FILES = ["ci.yml", "dependencies.yml", "frontend-tests.yml", "lint.yml",
         "pr.yml", "release.yml", "security.yml"]


def load(ref, name):
    if ref is None:
        with open(f".github/workflows/{name}", encoding="utf-8") as fh:
            return yaml.safe_load(fh)
    out = subprocess.run(["git", "show", f"{ref}:.github/workflows/{name}"],
                         capture_output=True, text=True)
    if out.returncode != 0:
        return None
    return yaml.safe_load(out.stdout)


def steps_of(doc):
    rows = []
    for job_name, job in (doc.get("jobs") or {}).items():
        for idx, step in enumerate(job.get("steps", [])):
            rows.append((job_name, idx, {
                "name": step.get("name"),
                "if": step.get("if"),
                "uses": step.get("uses"),
                "run": step.get("run"),
                "with": step.get("with"),
            }))
    return rows


failures = 0
print(f"{'workflow':24s} {'steps':>12s} {'guarded':>12s}   verdict")
for name in FILES:
    base_doc, head_doc = load(BASE, name), load(None, name)
    if base_doc is None:
        print(f"{name:24s} {'(new file)':>12s}")
        continue
    b, h = steps_of(base_doc), steps_of(head_doc)
    bg = sum(1 for _, _, s in b if s["if"])
    hg = sum(1 for _, _, s in h if s["if"])
    ok = len(b) == len(h) and bg == hg
    failures += 0 if ok else 1
    print(f"{name:24s} {len(b):>5d}->{len(h):<6d} {bg:>5d}->{hg:<6d}   "
          f"{'ok' if ok else '*** MISMATCH ***'}")

    # Report any step whose guard changed, in either direction.
    for (bj, bi, bs), (hj, hi, hs) in zip(b, h):
        if bs["if"] != hs["if"]:
            print(f"    {bj} step[{bi}] {bs['name']!r}: if {bs['if']!r} -> {hs['if']!r}")
            failures += 1

print()
print("RESULT:", "structure preserved" if failures == 0 else f"{failures} PROBLEM(S)")
sys.exit(1 if failures else 0)
