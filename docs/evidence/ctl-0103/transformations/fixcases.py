"""Replace the mangled loop-2 case block with correctly escaped source.

Written to a file rather than piped through a heredoc: the heredoc consumed one
backslash level, so every `\\n` inside the generated source became a real
newline and the file stopped parsing.
"""
import pathlib
import sys

p = pathlib.Path("scripts/test-verify-record-claims.py")
t = p.read_text(encoding="utf-8")

start_marker = '@case("REVIEW2/A a regex literal must not open a block comment", 1,'
end_marker = '@case("REVIEW/1 a cap by .filter rebind, naming no listed operation", 1,'
start = t.index(start_marker)
end = t.index(end_marker)

BLOCK = r'''@case("REVIEW2/A a regex literal must not open a block comment", 1,
      "is TRUNCATED")
def _(root):
    # The scanner had no regex-literal state, so `/[/*]/` -- a valid regex --
    # opened a `/*` that never closed and blanked EVERY line below it. A cap
    # four lines down was invisible and the claim reported holds.
    with (root / "lib" / "collection.ts").open(
            "a", encoding="utf-8", newline="") as handle:
        handle.write("const sep = /[/*]/;\nvoid sep;\n"
                     "store.events.length = 200;\n")


@case("REVIEW2/A a template literal spanning lines must not leak", 1,
      "is TRUNCATED")
def _(root):
    # Block state carried across lines while quote state reset at each line
    # boundary, so a `/*` INSIDE a multi-line template literal opened a real
    # block comment and silenced the rest of the file.
    with (root / "lib" / "collection.ts").open(
            "a", encoding="utf-8", newline="") as handle:
        handle.write("const banner = `\n/*\n`;\nvoid banner;\n"
                     "store.events.length = 200;\n")


@case("an unterminated /* ... */ is refused, not silently swallowed", 2,
      "never closed")
def _(root):
    # If the scanner's model of the text is wrong, everything after the opener
    # was discarded unread. That is not a verdict.
    with (root / "lib" / "collection.ts").open(
            "a", encoding="utf-8", newline="") as handle:
        handle.write("/* opened and never closed\n")


@case("REVIEW2/B code_only over an unknown comment syntax is refused", 2,
      "comment syntax this verifier does not know")
def _(root):
    # Treating every file as C-family meant `#` was not a comment, so a YAML
    # comment answered for the code beside it.
    amend(root, "g-present", lambda c: c["args"].update(
        {"path": "notes.rst", "code_only": True}))
    (root / "notes.rst").write_text(NEEDLE + "\n", encoding="utf-8",
                                    newline="")


@case("REVIEW2/B a # comment does not satisfy a claim about YAML", 1,
      "no longer matches")
def _(root):
    amend(root, "g-present", lambda c: c["args"].update(
        {"path": "conf.yml", "code_only": True}))
    (root / "conf.yml").write_text("# was: " + NEEDLE + "\nvalue: other\n",
                                   encoding="utf-8", newline="")


@case("REVIEW2/C a cap split across lines still counts", 1, "is TRUNCATED")
def _(root):
    # Matching per physical line meant a formatter's line break hid the cap.
    with (root / "lib" / "collection.ts").open(
            "a", encoding="utf-8", newline="") as handle:
        handle.write("store.events\n  = [];\n")


@case("REVIEW2/C a cap with spaces around the dots still counts", 1,
      "is TRUNCATED")
def _(root):
    with (root / "lib" / "collection.ts").open(
            "a", encoding="utf-8", newline="") as handle:
        handle.write("store . events . length = 200;\n")


@case("REVIEW2/E a record for a never-required id is refused", 2,
      "never required at the baseline")
def _(root):
    # It silently lowered the reported required count.
    data = json.loads((root / "claims.json").read_text(encoding="utf-8"))
    data["retired_claims"] = [{"id": "never-existed", "reason": "r",
                               "authorized_by": "a"}]
    write_manifest(root, data)


@case("REVIEW2/E a duplicate authorization id is refused", 2, "more than once")
def _(root):
    # load_manifest already refuses duplicate CLAIM ids for this reason.
    data = json.loads((root / "claims.json").read_text(encoding="utf-8"))
    data["retired_claims"] = [
        {"id": "f-present", "reason": "r", "authorized_by": "a"},
        {"id": "f-present", "reason": "other", "authorized_by": "b"},
    ]
    data["claims"] = [c for c in data["claims"] if c["id"] != "f-present"]
    write_manifest(root, data)


@case("REVIEW2/MAJOR-2 a tag that disagrees with its recorded commit", 2,
      "must agree")
def _(root):
    # A tag can be force-moved with no change to any tracked file, so the
    # recorded commit is what keeps a pin move visible in a diff.
    git(["tag", "-a", "fixture-drifted-tag", "-m", "drifted", "HEAD~1"], root)
    data = json.loads((root / "claims.json").read_text(encoding="utf-8"))
    data["required_claims_baseline"]["tag"] = "fixture-drifted-tag"
    write_manifest(root, data)


@case("a redefinition alongside an unevaluable claim exits 2", 2,
      "were redefined")
def _(root):
    # The third outcome class had no mixed-precedence case.
    data = json.loads((root / "claims.json").read_text(encoding="utf-8"))
    for claim in data["claims"]:
        if claim["id"] == "f-present":
            claim["args"] = {"path": "second.txt"}
        if claim["id"] == "g-present":
            claim["args"] = {"path": "lib/needle.ts", "pattern": "bad(["}
    write_manifest(root, data)


'''

p.write_text(t[:start] + BLOCK + t[end:], encoding="utf-8")
import subprocess
r = subprocess.run([sys.executable, "-c",
                    "import ast,pathlib;"
                    "ast.parse(pathlib.Path('scripts/test-verify-record-claims.py')"
                    ".read_text(encoding='utf-8'));print('parses')"],
                   capture_output=True, text=True)
print(r.stdout or r.stderr)
