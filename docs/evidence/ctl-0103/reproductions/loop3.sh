#!/usr/bin/env bash
# Loop-3 evidence: the exploits both reviewers executed against loop 2.
# NOTE: restore() must NOT touch docs/claims.json unless it is committed --
# twice this discarded uncommitted manifest work. Manifest arms snapshot it.
set -u
cd /c/tmp/savrio-ctl-01-03 || exit 2
pass=0; fail=0
SRC="lib/dev-hq/store.ts lib/dev-hq/id.ts lib/dev-hq/review-service.ts \
lib/dev-hq/audit-timeline.test.ts .github/workflows/frontend-tests.yml vitest.config.ts"
SNAP=$(mktemp -d)
cp docs/claims.json "$SNAP/claims.json"
restore() { git checkout -- $SRC 2>/dev/null; cp "$SNAP/claims.json" docs/claims.json; }

arm() {
  python scripts/verify-record-claims.py >/tmp/l3.txt 2>&1
  local got=$?
  if [ "$got" != "$2" ]; then
    echo "  FAIL $1: expected $2, got $got"; fail=$((fail+1)); restore; return
  fi
  if [ -n "${3:-}" ] && ! grep -q "$3" /tmp/l3.txt; then
    echo "  FAIL $1: exit $got but never names '$3'"; fail=$((fail+1)); restore; return
  fi
  echo "  OK  $1 (exit $got)"; pass=$((pass+1)); restore
}

restore; arm "NULL ARM clean tree" 0 ""

echo "--- ICR BLOCKER-A / AR BLOCKER 1: phantom block comment blanks the file ---"
python - <<'PY'
import pathlib
p = pathlib.Path("lib/dev-hq/store.ts"); t = p.read_text(encoding="utf-8")
p.write_text(t.replace("  store.events.unshift(event);",
"""  const trailingSlash = /a\\/*/;
  void trailingSlash;
  store.events.unshift(event);
  if (store.events.length > 200) store.events.length = 200;""", 1), encoding="utf-8")
PY
arm "regex literal /a\\/*/ then a cap" 1 "event-store-has-no-retention-cap"

python - <<'PY'
import pathlib
p = pathlib.Path("lib/dev-hq/id.ts"); t = p.read_text(encoding="utf-8")
p.write_text(t.replace('  return `${prefix}-${randomUUID().replace(/-/g, "")}`;',
"""  const entropy = randomUUID();
  const sep = /[/*]/;
  void entropy; void sep;
  return nextId(prefix);""", 1), encoding="utf-8")
PY
arm "regex literal /[/*]/ then predictable token" 1 "capability-token"

python - <<'PY'
import pathlib
p = pathlib.Path("lib/dev-hq/store.ts"); t = p.read_text(encoding="utf-8")
p.write_text(t.replace("  store.events.unshift(event);",
"""  const banner = `
/*
`;
  void banner;
  store.events.unshift(event);
  if (store.events.length > 200) store.events.length = 200;""", 1), encoding="utf-8")
PY
arm "multi-line template literal containing /*" 1 "event-store-has-no-retention-cap"

echo "--- ICR BLOCKER-B: a YAML # comment must not satisfy a code claim ---"
python - <<'PY'
import pathlib
p = pathlib.Path(".github/workflows/frontend-tests.yml"); t = p.read_text(encoding="utf-8")
p.write_text(t.replace("        run: npx vitest run --project node",
  "        # historically: npx vitest run --project node\n"
  "        run: npx vitest run --project dom", 1), encoding="utf-8")
PY
arm "YAML comment answering for the step" 1 "retention-test-executes-in-ci"

echo "--- ICR BLOCKER-C: multi-line and spaced truncation ---"
for form in 'store.events\n  = [];' 'store\n  .events.length = 200;' 'store . events . length = 200;'; do
  python - "$form" <<'PY'
import pathlib, sys
p = pathlib.Path("lib/dev-hq/store.ts"); t = p.read_text(encoding="utf-8")
inject = sys.argv[1].encode().decode("unicode_escape")
p.write_text(t.replace("  store.events.unshift(event);",
  "  store.events.unshift(event);\n  " + inject, 1), encoding="utf-8")
PY
  arm "split/spaced cap: ${form:0:30}" 1 "event-store-has-no-retention-cap"
done

echo "--- AR BLOCKER 2: padding the generator body ---"
python - <<'PY'
import pathlib
p = pathlib.Path("lib/dev-hq/id.ts"); t = p.read_text(encoding="utf-8")
p.write_text(t.replace('  return `${prefix}-${randomUUID().replace(/-/g, "")}`;',
"""  const entropy = randomUUID();
  void entropy;
  const scheme = "counter";
  void scheme;
  return nextId(prefix);""", 1), encoding="utf-8")
PY
arm "padded body, decoy inside window" 1 "capability-token-uses-node-crypto"

echo "--- AR MAJOR B: excluding the retention test from the node project ---"
python - <<'PY'
import pathlib
p = pathlib.Path("vitest.config.ts"); t = p.read_text(encoding="utf-8")
p.write_text(t.replace('          include: ["**/*.test.ts"],',
  '          include: ["**/*.service.test.ts"],', 1), encoding="utf-8")
PY
arm "node project stops collecting the test" 1 "retention-test-collected-by-node-project"

echo "--- ICR MAJOR-3 direction: a legitimate URL must stay visible ---"
python - <<'PY'
import pathlib
p = pathlib.Path("lib/dev-hq/store.ts"); t = p.read_text(encoding="utf-8")
p.write_text(t.replace("  store.events.unshift(event);",
  '  const doc = "https://example.invalid/a//b";\n  void doc;\n'
  "  store.events.unshift(event);", 1), encoding="utf-8")
PY
arm "quoted URL does not truncate the line" 0 ""

echo "--- MINOR-1 / MINOR E: bogus and duplicate authorization records ---"
python - <<'PY'
import json, pathlib
p = pathlib.Path("docs/claims.json"); m = json.loads(p.read_text(encoding="utf-8"))
m["retired_claims"] = [{"id": "never-existed", "reason": "r", "authorized_by": "a"}]
p.write_text(json.dumps(m, indent=2) + "\n", encoding="utf-8")
PY
arm "record for a never-required id" 2 "never required at the baseline"

# Uses retired_claims, not amended_claims: once the pin moved onto the reviewed
# candidate every amendment became inert and the list is empty by design, so
# duplicating "the first amendment" duplicated nothing.
python - <<'PY'
import json, pathlib
p = pathlib.Path("docs/claims.json"); m = json.loads(p.read_text(encoding="utf-8"))
m["claims"] = [c for c in m["claims"] if c["id"] != "smoke-heading-match-is-exact"]
m["retired_claims"] = [
    {"id": "smoke-heading-match-is-exact", "reason": "r", "authorized_by": "a"},
    {"id": "smoke-heading-match-is-exact", "reason": "other", "authorized_by": "b"},
]
p.write_text(json.dumps(m, indent=2) + "\n", encoding="utf-8")
PY
arm "duplicate authorization id" 2 "more than once"

echo "--- ICR MAJOR-2: a force-moved tag must not silently rebase the pin ---"
git tag -f -a claims-baseline-probe -m probe 2ba0dd2 >/dev/null 2>&1
python - <<'PY'
import json, pathlib
p = pathlib.Path("docs/claims.json"); m = json.loads(p.read_text(encoding="utf-8"))
m["required_claims_baseline"]["tag"] = "claims-baseline-probe"
p.write_text(json.dumps(m, indent=2) + "\n", encoding="utf-8")
PY
arm "tag disagreeing with recorded commit" 2 "must agree"
git tag -d claims-baseline-probe >/dev/null 2>&1

restore
rm -rf "$SNAP"
echo "--- tree ---"; git status --short
echo "passed=$pass failed=$fail"
[ "$fail" = "0" ] || exit 1
