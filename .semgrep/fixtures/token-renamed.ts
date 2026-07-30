// DEFECT: reaches the internal token by destructuring WITH RENAME. From the
// next line on the binding is called something else, which is exactly why the
// plain destructuring pattern could not see it.
const { DEV_HQ_INTERNAL_TOKEN: expectedToken } = process.env;

export function isAuthorized(provided: string) {
  return provided === expectedToken;
}
