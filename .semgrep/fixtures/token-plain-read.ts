// DEFECT: a second site that decides whether the internal token is acceptable.
// The plainest possible spelling of the read, on purpose.
//
// THIS FILE IS COPIED INTO EVERY INCLUDE ROOT THE TOKEN RULE DECLARES: app/,
// lib/, components/ and trigger/. It is not here to cover a new defect SHAPE --
// token-destructured.ts, token-renamed.ts and token-env-aliased.ts already do
// that. It is here because all three of those sit in lib/dev-hq/, so three of
// the rule's four declared roots were asserted by nothing at all: deleting
// "/trigger/**" exempted the entire Trigger.dev worker directory and the control
// stayed green.
//
// trigger/ is the root that mattered most. It holds the worker that receives the
// internal callbacks, which is the likeliest place for a second token check to
// be written.
const configured = process.env.DEV_HQ_INTERNAL_TOKEN;

export function isAuthorized(provided: string) {
  return provided === configured;
}
