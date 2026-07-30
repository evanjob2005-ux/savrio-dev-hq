// NULL ARM -- this file is CORRECT and must produce NO finding.
//
// Reads process.env, but not DEV_HQ_INTERNAL_TOKEN. The token rule is scoped to
// one variable; a rule accidentally widened to "any process.env read" would
// still detect both known-bad token fixtures, so only this file can tell the
// two apart.
export function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
