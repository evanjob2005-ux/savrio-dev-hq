# Semgrep positive-control fixtures

These files are deliberately defective. They exist so that a green Semgrep run
means "the rules work and the code is clean" rather than "the rules matched
nothing" — a zero-finding scan cannot distinguish those two on its own.

They are NOT part of the application. They live outside `app/`, `lib/`,
`components/`, and `trigger/`, so the blocking scan never sees them. The
`Verify rules detect known-bad code` CI step copies them into a throwaway tree
that mirrors the anchored rule paths, scans that tree, and fails if the
expected findings are absent.

Each file's name states the defect class it represents. Do not "fix" them.

## Depth matters, and two files exist only to prove it

`route-nested-no-guard.ts` is copied to `internal/nested/deeper/route.ts`, two
directories below `internal/`. Every other fixture sits exactly one directory
below — and six of the ten real internal routes (`execution/complete`,
`execution/dispatch`, `execution/heartbeat`, `execution/reclaim`,
`execution/running`, `review/complete`) are two.

Because the whole control lived at a single depth, narrowing the rule's path
glob from `internal/**/route.ts` to `internal/*/route.ts` — one character — left
every fixture detected and every compliant fixture clean while those six
unauthenticated write paths stopped being scanned at all. Keep this fixture at
its depth; the depth is the defect class it covers.

`compliant-route-nested.ts` is its null half, at the same depth.

## One fixture per include root, and that is also a defect class

A rule's `paths.include` list is part of the rule. A root that is declared but
has no fixture in it is asserted by nothing, and deleting it is invisible.

Every token fixture used to sit in `lib/dev-hq/`, while the token rule declares
four roots. Deleting `- "/trigger/**"` therefore exempted the entire Trigger.dev
worker directory — the process that *receives* the internal callbacks, and so the
likeliest place for a second token-verification site to be written — and this
control reported all thirteen known-bad fixtures detected and exited 0.

`token-plain-read.ts` is copied into all four roots for that reason. It covers no
new defect *shape*; `token-destructured.ts`, `token-renamed.ts` and
`token-env-aliased.ts` already do that. It covers the roots. Keep one copy per
root, and add one whenever a root is added to the rule.

`xss-dangerously-set-inner-html.tsx` and `compliant-html-render.tsx` are the same
story for `dev-hq-dangerously-set-inner-html`, which had **no known-bad fixture
and no null arm at all**: deleting the rule outright left this control green, so
under rule 1 of `standards/CONTROL_VERIFICATION_STANDARD.md` it had no acceptance
evidence. Both files are copied into each of that rule's two roots.

## The `compliant-*` files are the null arm

`compliant-route.ts`, `compliant-route-braced.ts`, `compliant-route-nested.ts`,
`compliant-env-reader.ts` and `compliant-html-render.tsx` are the opposite: they
are **correct**, and the control fails if any rule produces a finding against
them. `compliant-env-reader.ts` is copied into all four token roots and
`compliant-html-render.tsx` into both XSS roots, so the null arm reaches every
root the known-bad arm does.

They exist because the known-bad set alone cannot tell a working rule from one
that has been widened into noise. A rule mutated to fire on every handler still
detects all eighteen known-bad fixtures, so a control asserting only "the rules
still fire" reports success — that mutation was run against this control and is
caught solely by these files. A rule that flags compliant code gets muted, and a
muted rule enforces nothing.

`compliant-route-braced.ts` guards the opposite edge of the newest requirement.
The guard rule now demands that the guard's result be acted on by the very next
statement; narrowing that into a single accepted spelling of the return would
reject correct code, and this fixture is what fails if that happens.

Do not "fix" these either, and do not add a guard or a token read to them.
