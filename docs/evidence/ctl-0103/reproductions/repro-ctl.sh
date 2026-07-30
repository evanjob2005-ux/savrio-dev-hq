#!/usr/bin/env bash
# Reproduce CTL-01, CTL-02, CTL-03 at HEAD 5064526 BEFORE any fix.
# Every mutation preserves the text the probe greps for while breaking the
# property the claim asserts. A "still exits 0" line is a confirmed false green.
set -u
cd /c/tmp/savrio-ctl-01-03 || exit 2

pass=0; fail=0
restore() { git checkout -- lib/dev-hq/store.ts lib/dev-hq/id.ts \
  lib/dev-hq/audit-timeline.test.ts docs/claims.json 2>/dev/null; }

run() { python scripts/verify-record-claims.py >/tmp/ctl-out.txt 2>&1; echo $?; }

report() { # name expected_exit actual_exit
  if [ "$2" = "$3" ]; then
    echo "  REPRODUCED: $1 (verifier exit $3)"; pass=$((pass+1))
  else
    echo "  NOT reproduced: $1 (expected exit $2, got $3)"; fail=$((fail+1))
  fi
}

echo "=== null arm: unmutated tree must be green ==="
report "clean baseline exits 0" 0 "$(run)"

echo
echo "=== CTL-01.1 alternate retention cap, no searched-for identifier ==="
python - <<'PY'
import pathlib
p = pathlib.Path("lib/dev-hq/store.ts"); t = p.read_text(encoding="utf-8")
# NB: the mutation carries no explanatory comment on purpose. An earlier version
# named the searched-for identifier in a comment, which tripped the grep-absent
# probe on the comment rather than the cap and masked the real false green.
t = t.replace("  store.events.unshift(event);",
"""  store.events.unshift(event);
  if (store.events.length > 200) {
    store.events.length = 200;
  }""", 1)
p.write_text(t, encoding="utf-8")
PY
grep -q "store.events.length = 200" lib/dev-hq/store.ts && echo "  (cap is present in tree)"
report "capped store still passes event-store-has-no-retention-cap" 0 "$(run)"
restore

echo
echo "=== CTL-01.2 capability token hollowed, randomUUID() left in a COMMENT ==="
python - <<'PY'
import pathlib
p = pathlib.Path("lib/dev-hq/id.ts"); t = p.read_text(encoding="utf-8")
t = t.replace('  return `${prefix}-${randomUUID().replace(/-/g, "")}`;',
'''  // Formerly built over randomUUID() from node:crypto.
  return nextId(prefix);''', 1)
p.write_text(t, encoding="utf-8")
PY
grep -q "return nextId(prefix);" lib/dev-hq/id.ts && echo "  (token now predictable: prefix-epoch-counter)"
report "predictable token still passes capability-token-uses-node-crypto" 0 "$(run)"
restore

echo
echo "=== CTL-01.3 retention test gutted, unrelated toHaveLength(205) added ==="
python - <<'PY'
import pathlib
p = pathlib.Path("lib/dev-hq/audit-timeline.test.ts"); t = p.read_text(encoding="utf-8")
t = t.replace("for (let index = 0; index < 205; index += 1)",
              "for (let index = 0; index < 1; index += 1)", 1)
t = t.replace("const all = await logger.listRecent({ limit: 205 });\n    expect(all).toHaveLength(205);",
              "const all = await logger.listRecent({ limit: 205 });\n"
              "    expect(all).toHaveLength(1);\n"
              "    expect(new Array(205)).toHaveLength(205);", 1)
p.write_text(t, encoding="utf-8")
PY
grep -q "expect(new Array(205)).toHaveLength(205);" lib/dev-hq/audit-timeline.test.ts \
  && echo "  (guard now asserts 1 event; 205 survives only as filler)"
report "gutted guard still passes timeline-retention-guarded-by-test" 0 "$(run)"
restore

echo
echo "=== CTL-01.4 lightweight tag satisfies a claim naming an annotation ==="
git tag -d ctl-repro-lightweight >/dev/null 2>&1
git tag ctl-repro-lightweight 5064526   # lightweight: no -a, no annotation
cat > /tmp/ctl-tagmanifest.json <<'JSON'
{ "version": 1, "claims": [ {
  "id": "repro-tag-is-annotated",
  "document": "reproduction only",
  "statement": "ctl-repro-lightweight exists and is annotated.",
  "probe": "tag-present",
  "args": { "tag": "ctl-repro-lightweight" },
  "red_means": "reproduction only"
} ] }
JSON
python scripts/verify-record-claims.py --manifest /tmp/ctl-tagmanifest.json >/tmp/ctl-out.txt 2>&1
tagexit=$?
echo "  (tag object type: $(git cat-file -t ctl-repro-lightweight))"
report "lightweight tag satisfies an annotated-tag claim" 0 "$tagexit"
git tag -d ctl-repro-lightweight >/dev/null 2>&1

echo
echo "=== CTL-02 deleting a required claim restores green ==="
python - <<'PY'
import json, pathlib
p = pathlib.Path("docs/claims.json"); m = json.loads(p.read_text(encoding="utf-8"))
before = len(m["claims"])
m["claims"] = [c for c in m["claims"] if c["id"] != "sec6-review-token-not-nextid"]
print(f"  (claims {before} -> {len(m['claims'])}; dropped sec6-review-token-not-nextid)")
p.write_text(json.dumps(m, indent=2) + "\n", encoding="utf-8")
PY
report "manifest with a required claim deleted still exits 0" 0 "$(run)"
grep -c "documented claim(s) reported CONSISTENT" /tmp/ctl-out.txt >/dev/null \
  && grep -o "Verifying [0-9]* documented" /tmp/ctl-out.txt | head -1 | sed 's/^/  /'
restore

echo
echo "=== CTL-03 negative-control harness is not wired into CI ==="
hits=$(grep -rl "test-verify-record-claims" .github/workflows/ 2>/dev/null | wc -l)
echo "  workflow files referencing test-verify-record-claims.py: $hits"
if [ "$hits" = "0" ]; then
  echo "  REPRODUCED: mutation harness runs in no workflow"; pass=$((pass+1))
else
  echo "  NOT reproduced: harness is referenced"; fail=$((fail+1))
fi

echo
echo "=== tree is restored ==="
git status --short
echo "reproduced=$pass not_reproduced=$fail"
