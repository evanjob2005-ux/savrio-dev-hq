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

## The `compliant-*` files are the null arm

`compliant-route.ts` and `compliant-env-reader.ts` are the opposite: they are
**correct**, and the control fails if any rule produces a finding against them.

They exist because the known-bad set alone cannot tell a working rule from one
that has been widened into noise. A rule mutated to fire on every handler still
detects all nine known-bad fixtures, so a control asserting only "the rules
still fire" reports success — that mutation was run against this control and is
caught solely by these two files. A rule that flags compliant code gets muted,
and a muted rule enforces nothing.

Do not "fix" these either, and do not add a guard or a token read to them.
