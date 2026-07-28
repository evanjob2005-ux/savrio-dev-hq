// DEFECT: reaches the internal token by destructuring, bypassing a rule that
// only matches property or index access.
const { DEV_HQ_INTERNAL_TOKEN } = process.env;

export function isAuthorized(provided: string) {
  return provided === DEV_HQ_INTERNAL_TOKEN;
}
