"""Verify the Master Roadmap body hash against the value in its own registration record.

The registration record's entire authority rests on that SHA-256. Nothing
currently prevents it going stale: edit the roadmap body, forget the hash, and
the record silently starts attesting to a document that no longer exists.

The boundary is the part worth stating precisely, because an earlier reviewer
had to brute-force it. The body is every byte from the first line AFTER the
`---` rule that follows the `END REGISTRATION RECORD` marker, through end of
file, read as raw bytes with no normalisation.

Exit 0 when they agree, 1 when they do not, 2 when the file cannot be parsed --
so a structural failure is never reported as a passing check.
"""

import hashlib
import pathlib
import re
import sys

ROADMAP = pathlib.Path("docs/roadmap/MASTER_ROADMAP.md")
END_MARKER = "<!-- END REGISTRATION RECORD"
HASH_LABEL = re.compile(
    r"amendments A-1 through A-\d+:\s*\n\s*`([0-9a-f]{64})`")


def fail(reason, code=2):
    print(f"::error::Roadmap hash check could not run: {reason}")
    print(f"FAILED STRUCTURALLY: {reason}")
    sys.exit(code)


def main():
    if not ROADMAP.exists():
        fail(f"{ROADMAP} does not exist")

    text = ROADMAP.read_text(encoding="utf-8", newline="")

    marker = text.find(END_MARKER)
    if marker == -1:
        fail(f"'{END_MARKER}' marker not found")

    newline = text.find("\n", marker)
    rule = text.find("---", newline)
    if rule == -1:
        fail("no '---' rule found after the END REGISTRATION RECORD marker")

    body = text[rule + 4:]
    if not body.strip():
        fail("body after the boundary is empty")

    actual = hashlib.sha256(body.encode("utf-8")).hexdigest()

    found = HASH_LABEL.search(text)
    if not found:
        fail("no recorded body hash found in the registration record")
    recorded = found.group(1)

    print(f"body starts: {body[:40]!r}")
    print(f"body bytes : {len(body.encode('utf-8'))}")
    print(f"computed   : {actual}")
    print(f"recorded   : {recorded}")

    if actual != recorded:
        print("::error::The roadmap body no longer matches the hash recorded in its "
              "own registration record. Either the body was edited without updating "
              "the hash, or the hash was updated without the body. Recompute and "
              "record the amendment.")
        sys.exit(1)

    print("PASS: roadmap body matches its registered hash.")


if __name__ == "__main__":
    main()
