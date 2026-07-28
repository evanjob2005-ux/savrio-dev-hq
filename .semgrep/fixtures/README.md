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
