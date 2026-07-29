"""Fail when an agent role references a missing handbook or standard."""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
agents = sorted((ROOT / "agents").glob("*/AGENT.md"))
failures = []
handbook_count = standard_count = 0
document_ids = {}
standard_ids = {}
referenced_standards = set()


def words(value):
    return set(re.findall(r"[a-z0-9]+", value.lower().replace("llm", "llm")))

for role in agents:
    text = role.read_text(encoding="utf-8")
    handbooks = re.findall(r"handbooks/[A-Z0-9_]+\.md", text)
    if len(set(handbooks)) != 1:
        failures.append(f"{role.relative_to(ROOT)}: expected exactly one handbook reference")
    for reference in sorted(set(handbooks)):
        handbook_count += 1
        target = ROOT / reference
        if not target.is_file():
            failures.append(f"{role.relative_to(ROOT)}: missing {reference}")
            continue
        content = target.read_text(encoding="utf-8")
        heading = re.search(r"(?m)^#\s+(.+?)\s*$", content)
        doc_id = re.search(r"(?m)^\*\*Document ID:\*\*\s*(\S+)", content)
        expected = words(Path(reference).stem)
        if len(content.strip()) < 300:
            failures.append(f"{reference}: handbook content is empty or trivial")
        if not heading or not expected.issubset(words(heading.group(1))):
            failures.append(f"{reference}: heading does not match role {role.parent.name}")
        if not doc_id:
            failures.append(f"{reference}: missing Document ID")
        else:
            document_ids.setdefault(doc_id.group(1), []).append(reference)

    # Accept both the common bullet form (`- TESTING_STANDARD.md`) and an
    # explicit path (`standards/TESTING_STANDARD.md`). Every standard filename
    # mentioned by a role is a required reference, regardless of formatting.
    for name in sorted(set(re.findall(r"\b([A-Z][A-Z0-9_]+_STANDARD\.md)\b", text))):
        standard_count += 1
        referenced_standards.add(name)
        if not (ROOT / "standards" / name).is_file():
            failures.append(f"{role.relative_to(ROOT)}: missing standards/{name}")

if len(agents) != 19:
    failures.append(f"expected 19 role definitions, found {len(agents)}")
for document_id, paths in document_ids.items():
    if len(paths) > 1:
        failures.append(f"duplicate handbook Document ID {document_id}: {', '.join(paths)}")

for name in sorted(referenced_standards):
    path = ROOT / "standards" / name
    if not path.is_file():
        continue
    content = path.read_text(encoding="utf-8")
    headings = re.findall(r"(?m)^#{1,3}\s+(.+?)\s*$", content)
    doc_id = re.search(r"(?m)^\*\*Document ID:\*\*\s*(STANDARD-\S+)", content)
    if len(content.strip()) < 500 or len(headings) < 3 or len(re.findall(r"(?m)^-\s+", content)) < 4:
        failures.append(f"standards/{name}: empty, filler, or missing substantive sections")
    expected_name = re.sub(r"[^a-z0-9]", "", Path(name).stem
                           .replace("_STANDARD", "").lower())
    actual_name = re.sub(r"[^a-z0-9]", "", headings[0].lower()) if headings else ""
    if not headings or expected_name not in actual_name:
        failures.append(f"standards/{name}: heading does not match standard name")
    if not doc_id:
        failures.append(f"standards/{name}: missing STANDARD-* Document ID")
    else:
        standard_ids.setdefault(doc_id.group(1), []).append(name)
    if not any(h.lower() == "purpose" for h in headings):
        failures.append(f"standards/{name}: missing Purpose section")
for document_id, names in standard_ids.items():
    if len(names) > 1:
        failures.append(f"duplicate standard Document ID {document_id}: {', '.join(names)}")

for failure in failures:
    print(f"ERROR: {failure}")
if failures:
    sys.exit(1)
print(f"Agent references resolve: {len(agents)} roles, {handbook_count} handbooks, "
      f"{standard_count} standard references.")
