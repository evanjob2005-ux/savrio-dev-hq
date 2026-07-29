"""Red/null controls for verify-agent-references.py."""

from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
VERIFIER = "scripts/verify-agent-references.py"


def copy_repo(destination):
    for name in ("agents", "handbooks", "standards", "scripts"):
        shutil.copytree(ROOT / name, destination / name)


def run(root):
    return subprocess.run(
        [sys.executable, VERIFIER], cwd=root, capture_output=True, text=True
    )


def remove(root, path):
    (root / path).unlink()


def replace(root, path, content):
    (root / path).write_text(content, encoding="utf-8")


def duplicate_id(root, path):
    source = (root / "handbooks/QA_ENGINEER.md").read_text(encoding="utf-8")
    match = next(line for line in source.splitlines() if line.startswith("**Document ID:**"))
    target = root / path
    text = target.read_text(encoding="utf-8")
    text = "\n".join(match if line.startswith("**Document ID:**") else line
                     for line in text.splitlines()) + "\n"
    target.write_text(text, encoding="utf-8")


def replace_standard_id(root, path, new_id):
    target = root / path
    text = target.read_text(encoding="utf-8")
    text = "\n".join(
        f"**Document ID:** {new_id}" if line.startswith("**Document ID:**") else line
        for line in text.splitlines()
    ) + "\n"
    target.write_text(text, encoding="utf-8")


cases = (
    ("null: all references resolve", None, 0),
    ("red: missing handbook", lambda r: remove(r, "handbooks/ASSOCIATE_SOFTWARE_ENGINEER.md"), 1),
    ("red: missing standard", lambda r: remove(r, "standards/NAMING_STANDARD.md"), 1),
    ("red: empty handbook", lambda r: replace(r, "handbooks/QA_ENGINEER.md", ""), 1),
    ("red: malformed handbook", lambda r: replace(
        r, "handbooks/QA_ENGINEER.md", "# QA Engineer Handbook\n" + ("x" * 400)), 1),
    ("red: wrong-role handbook", lambda r: replace(
        r, "handbooks/QA_ENGINEER.md",
        "# Security Engineer Handbook\n**Document ID:** HBK-WRONG\n" + ("x" * 400)), 1),
    ("red: duplicate Document ID",
     lambda r: duplicate_id(r, "handbooks/SECURITY_ENGINEER.md"), 1),
    ("red: syntactically valid standard filler", lambda r: replace(
        r, "standards/NAMING_STANDARD.md",
        "# Naming Standard\n**Document ID:** STANDARD-019\n## Purpose\nPlaceholder.\n"),
     1),
    ("red: wrong standard Document ID",
     lambda r: replace_standard_id(r, "standards/NAMING_STANDARD.md", "NOT-A-STANDARD"), 1),
    ("red: duplicate standard Document ID",
     lambda r: replace_standard_id(r, "standards/NAMING_STANDARD.md", "STANDARD-020"), 1),
)

failed = 0
for label, mutate, expected in cases:
    with tempfile.TemporaryDirectory() as temporary:
        root = Path(temporary)
        copy_repo(root)
        if mutate:
            mutate(root)
        result = run(root)
        ok = result.returncode == expected
        failed += not ok
        print(f"{'PASS' if ok else 'FAIL'}: {label} (exit {result.returncode})")
        if not ok:
            print(result.stdout, result.stderr)

print(f"{len(cases) - failed} passed, {failed} failed")
sys.exit(1 if failed else 0)
