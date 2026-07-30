// DEFECT: reaches the internal token through an alias of process.env. One
// extra line defeated every pattern anchored on the literal `process.env`
// receiver, while the comparison it feeds is a second, weaker fail-closed site.
const env = process.env;

export function isAuthorized(provided: string) {
  return provided === env.DEV_HQ_INTERNAL_TOKEN;
}
