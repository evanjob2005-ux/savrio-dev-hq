#!/usr/bin/env bash
# Loop-2 evidence: every exploit the two reviewers executed against loop 1.
# Each arm re-applies THEIR mutation and requires a non-zero exit.
set -u
cd /c/tmp/savrio-ctl-01-03 || exit 2
pass=0; fail=0
FILES="lib/dev-hq/store.ts lib/dev-hq/id.ts lib/dev-hq/review-service.ts \
lib/dev-hq/audit-timeline.test.ts lib/dev-hq/constants.ts next.config.ts docs/claims.json"
restore() { git checkout -- $FILES 2>/dev/null; }

arm() { # label expected_exit must_name
  python scripts/verify-record-claims.py >/tmp/b-out.txt 2>&1
  local got=$?
  if [ "$got" != "$2" ]; then
    echo "  FAIL $1: expected exit $2, got $got"; fail=$((fail+1)); restore; return
  fi
  if [ -n "${3:-}" ] && ! grep -q "$3" /tmp/b-out.txt; then
    echo "  FAIL $1: exit $got but never names '$3'"; fail=$((fail+1)); restore; return
  fi
  echo "  OK  $1 (exit $got)"; pass=$((pass+1)); restore
}

py() { python - "$@"; }

restore; arm "NULL ARM clean tree" 0 ""

echo "--- ICR BLOCKER-1: no-truncation missed three real caps ---"
for form in \
  'store.events = store.events.filter((_, position) => position < 200);' \
  'store.events = [];' \
  'store.events = [...store.events].slice(0, 200);' \
  'while (store.events.length > 200) store.events.pop();' ; do
  py <<PY
import pathlib
p = pathlib.Path("lib/dev-hq/store.ts"); t = p.read_text(encoding="utf-8")
p.write_text(t.replace("  store.events.unshift(event);",
  "  store.events.unshift(event);\n  ${form}", 1), encoding="utf-8")
PY
  arm "cap: ${form:0:44}" 1 "event-store-has-no-retention-cap"
done

echo "--- ICR MAJOR-3: read-only length compare must NOT be a false red ---"
py <<'PY'
import pathlib
p = pathlib.Path("lib/dev-hq/store.ts"); t = p.read_text(encoding="utf-8")
p.write_text(t.replace("  store.events.unshift(event);",
  "  if (store.events.length === 0) { /* first event */ }\n  store.events.unshift(event);", 1),
  encoding="utf-8")
PY
arm "read-only .length === guard stays green" 0 ""

echo "--- ICR BLOCKER-2a / AR BLOCKER-2: decoy + block comment ---"
py <<'PY'
import pathlib
p = pathlib.Path("lib/dev-hq/id.ts"); t = p.read_text(encoding="utf-8")
p.write_text(t.replace('  return `${prefix}-${randomUUID().replace(/-/g, "")}`;',
  '  const unusedEntropy = randomUUID();\n  void unusedEntropy;\n  return nextId(prefix);', 1),
  encoding="utf-8")
PY
arm "unused randomUUID decoy + nextId" 1 "capability-token-not-from-nextid"

py <<'PY'
import pathlib
p = pathlib.Path("lib/dev-hq/id.ts"); t = p.read_text(encoding="utf-8")
p.write_text(t.replace('  return `${prefix}-${randomUUID().replace(/-/g, "")}`;',
  '/*\nwas: randomUUID()\n*/\n  return `${prefix}-${(globalThis.__c = (globalThis.__c ?? 0) + 1)}`;', 1),
  encoding="utf-8")
PY
arm "block-comment /* randomUUID() */" 1 "capability-token-uses-node-crypto"

echo "--- ICR BLOCKER-2b: decoy elsewhere in review-service ---"
py <<'PY'
import pathlib
p = pathlib.Path("lib/dev-hq/review-service.ts"); t = p.read_text(encoding="utf-8")
t = t.replace('    token: nextCapabilityToken("rvt"),',
              '    token: `rvt-${Date.now()}`,', 1)
t += '\nexport function describeTokenScheme(): { token: string } {\n  return { token: nextCapabilityToken("rvt") };\n}\n'
p.write_text(t, encoding="utf-8")
PY
arm "off-site decoy mint" 1 "sec6-review-token-from-csprng"

echo "--- ICR BLOCKER-3: token:// comment form ---"
py <<'PY'
import pathlib
p = pathlib.Path("lib/dev-hq/review-service.ts"); t = p.read_text(encoding="utf-8")
p.write_text(t.replace('    token: nextCapabilityToken("rvt"),',
  '    token://nextCapabilityToken("rvt")\n      `rvt-${Date.now()}`,', 1), encoding="utf-8")
PY
arm "token:// comment" 1 "sec6-review-token-from-csprng"

echo "--- ICR MAJOR-5: a URL must NOT be mistaken for a comment ---"
py <<'PY'
import pathlib
p = pathlib.Path("next.config.ts"); t = p.read_text(encoding="utf-8")
p.write_text(t.replace("const nextConfig",
  'const assetHost = "//cdn.example.invalid";\nvoid assetHost;\nconst nextConfig', 1),
  encoding="utf-8")
PY
arm "protocol-relative string stays green" 0 ""

echo "--- ICR BLOCKER-4: a misspelled arg must not silently relax ---"
py <<'PY'
import json, pathlib
p = pathlib.Path("docs/claims.json"); m = json.loads(p.read_text(encoding="utf-8"))
for c in m["claims"]:
    if c["id"] == "timeline-retention-guarded-by-test":
        c["args"]["withn"] = c["args"].pop("within")
p.write_text(json.dumps(m, indent=2) + "\n", encoding="utf-8")
PY
arm "typo'd within is refused" 2 "does not read args"

echo "--- ICR BLOCKER-5 / AR BLOCKER-1: gut the body, keep the id ---"
py <<'PY'
import json, pathlib
p = pathlib.Path("docs/claims.json"); m = json.loads(p.read_text(encoding="utf-8"))
for c in m["claims"]:
    if c["id"] == "event-store-has-no-retention-cap":
        c["probe"] = "file-present"
        c["args"] = {"path": "package.json"}
p.write_text(json.dumps(m, indent=2) + "\n", encoding="utf-8")
py2=0
PY
py <<'PY'
import pathlib
p = pathlib.Path("lib/dev-hq/store.ts"); t = p.read_text(encoding="utf-8")
p.write_text(t.replace("  store.events.unshift(event);",
  "  store.events.unshift(event);\n  store.events.length = 200;", 1), encoding="utf-8")
PY
arm "tautology swap + live cap" 1 "REQUIRED CLAIM REDEFINED event-store-has-no-retention-cap"

echo "--- AR MINOR-2: pin must not move backward ---"
py <<'PY'
import json, pathlib, subprocess
p = pathlib.Path("docs/claims.json"); m = json.loads(p.read_text(encoding="utf-8"))
older = subprocess.run(["git","rev-parse","5064526~3"],capture_output=True,text=True).stdout.strip()
m["required_claims_baseline"].pop("tag", None)
m["required_claims_baseline"]["commit"] = older
p.write_text(json.dumps(m, indent=2) + "\n", encoding="utf-8")
PY
arm "pin moved backward is refused" 2 ""

echo "--- o6: wrapping the append in a conditional ---"
py <<'PY'
import pathlib
p = pathlib.Path("lib/dev-hq/audit-timeline.test.ts"); t = p.read_text(encoding="utf-8")
p.write_text(t.replace("      await logger.log({",
  "      if (index === 0) await logger.log({", 1), encoding="utf-8")
PY
arm "conditional append" 1 "timeline-retention-test-appends-205"

restore
echo "--- tree restored ---"
git status --short
echo "passed=$pass failed=$fail"
[ "$fail" = "0" ] || exit 1
