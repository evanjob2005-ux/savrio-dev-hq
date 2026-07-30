#!/usr/bin/env bash
# Loop-1 evidence for CTL-01/CTL-02 on the FIXED tree.
# Each arm re-applies a mutation that used to pass and requires the verifier to
# exit 1 AND name the claim it broke. Naming matters: an exit 1 that blames the
# wrong claim sends the next reader to the wrong file.
set -u
cd /c/tmp/savrio-ctl-01-03 || exit 2

pass=0; fail=0
restore() { git checkout -- lib/dev-hq/store.ts lib/dev-hq/id.ts \
  lib/dev-hq/audit-timeline.test.ts lib/dev-hq/constants.ts \
  lib/dev-hq/review-service.ts docs/claims.json 2>/dev/null; }

# arm <label> <expected_exit> <must_name>
arm() {
  python scripts/verify-record-claims.py >/tmp/d-out.txt 2>&1
  local got=$?
  if [ "$got" != "$2" ]; then
    echo "  FAIL $1: expected exit $2, got $got"; fail=$((fail+1)); return
  fi
  if [ -n "${3:-}" ] && ! grep -q "$3" /tmp/d-out.txt; then
    echo "  FAIL $1: exit $got but output never names '$3'"; fail=$((fail+1)); return
  fi
  echo "  OK $1 (exit $got, names ${3:-<n/a>})"; pass=$((pass+1))
}

echo "=== NULL ARM: clean tree must be green ==="
restore; arm "clean tree" 0 ""

echo
echo "=== CTL-01.1 alternate retention cap (was FALSE GREEN) ==="
python - <<'PY'
import pathlib
p = pathlib.Path("lib/dev-hq/store.ts"); t = p.read_text(encoding="utf-8")
t = t.replace("  store.events.unshift(event);",
"""  store.events.unshift(event);
  if (store.events.length > 200) {
    store.events.length = 200;
  }""", 1)
p.write_text(t, encoding="utf-8")
PY
arm "capped store" 1 "event-store-has-no-retention-cap"; restore

echo
echo "=== CTL-01.2 token hollowed, randomUUID() left in a comment (was FALSE GREEN) ==="
python - <<'PY'
import pathlib
p = pathlib.Path("lib/dev-hq/id.ts"); t = p.read_text(encoding="utf-8")
t = t.replace('  return `${prefix}-${randomUUID().replace(/-/g, "")}`;',
'''  // Formerly built over randomUUID() from node:crypto.
  return nextId(prefix);''', 1)
p.write_text(t, encoding="utf-8")
PY
arm "predictable token" 1 "capability-token-uses-node-crypto"; restore

echo
echo "=== CTL-01.3 retention guard gutted, filler toHaveLength(205) (was FALSE GREEN) ==="
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
arm "gutted guard" 1 "timeline-retention"; restore

echo
echo "=== CTL-01.5 mint site moved off the claimed line ==="
python - <<'PY'
import pathlib
p = pathlib.Path("lib/dev-hq/review-service.ts"); t = p.read_text(encoding="utf-8")
# The identifier survives in the file, on a line the claim does not name.
t = t.replace('    token: nextCapabilityToken("rvt"),',
              '    token: nextId("rvt"), // nextCapabilityToken("rvt")', 1)
p.write_text(t, encoding="utf-8")
PY
arm "mint site moved" 1 "sec6-review-token"; restore

echo
echo "=== CTL-01.6 code_only: a commented-out declaration must not satisfy a claim ==="
python - <<'PY'
import pathlib
p = pathlib.Path("lib/dev-hq/constants.ts"); t = p.read_text(encoding="utf-8")
import re
t = re.sub(r"(?m)^(export const EVENT_BUFFER_SIZE\s*=\s*200.*)$",
           r"// \1", t, count=1)
p.write_text(t, encoding="utf-8")
PY
grep -q "^// export const EVENT_BUFFER_SIZE" lib/dev-hq/constants.ts \
  && arm "commented-out constant" 1 "event-buffer-size-is-a-page-limit" \
  || { echo "  SKIP: constants.ts shape not as expected"; fail=$((fail+1)); }
restore

echo
echo "=== CTL-02.1 deleting a required claim (was FALSE GREEN) ==="
python - <<'PY'
import json, pathlib
p = pathlib.Path("docs/claims.json"); m = json.loads(p.read_text(encoding="utf-8"))
m["claims"] = [c for c in m["claims"] if c["id"] != "sec6-review-token-not-nextid"]
p.write_text(json.dumps(m, indent=2) + "\n", encoding="utf-8")
PY
arm "claim deleted" 1 "REQUIRED CLAIM DELETED sec6-review-token-not-nextid"; restore

echo
echo "=== CTL-02.2 REPLACING a claim keeps the count and must still fail ==="
python - <<'PY'
import json, pathlib
p = pathlib.Path("docs/claims.json"); m = json.loads(p.read_text(encoding="utf-8"))
out = []
for c in m["claims"]:
    if c["id"] == "next-config-not-standalone":
        c = dict(c, id="a-cheap-substitute")   # count preserved: 16 -> 16
    out.append(c)
m["claims"] = out
p.write_text(json.dumps(m, indent=2) + "\n", encoding="utf-8")
PY
arm "claim replaced, count intact" 1 "REQUIRED CLAIM DELETED next-config-not-standalone"; restore

echo
echo "=== CTL-02.3 an unauthorized retirement record must NOT buy green ==="
python - <<'PY'
import json, pathlib
p = pathlib.Path("docs/claims.json"); m = json.loads(p.read_text(encoding="utf-8"))
m["claims"] = [c for c in m["claims"] if c["id"] != "smoke-heading-match-is-exact"]
m["retired_claims"] = [{"id": "smoke-heading-match-is-exact"}]  # no reason/authority
p.write_text(json.dumps(m, indent=2) + "\n", encoding="utf-8")
PY
arm "retirement missing reason/authority" 2 "is not a reviewed retirement"; restore

echo
echo "=== CTL-02.4 fail-closed when the baseline pin cannot be read ==="
python - <<'PY'
import json, pathlib
p = pathlib.Path("docs/claims.json"); m = json.loads(p.read_text(encoding="utf-8"))
m["required_claims_baseline"]["commit"] = "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef"
p.write_text(json.dumps(m, indent=2) + "\n", encoding="utf-8")
PY
arm "unreadable baseline is exit 2" 2 "could not be read"; restore

echo
echo "=== tree restored ==="
git status --short
echo "passed=$pass failed=$fail"
[ "$fail" = "0" ] || exit 1
